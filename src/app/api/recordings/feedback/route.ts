import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { createServiceClient } from '@/lib/supabase/server'
import { ProductProfile } from '@/types/database'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
// OpenAI client is initialized lazily to avoid build-time errors
function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })
}

const INDUSTRY_LABELS: Record<string, string> = {
  IT_SAAS: 'SaaS/IT', REAL_ESTATE: '不動産', FINANCE: '金融',
  MEDICAL: '医療・製薬', MANUFACTURING: '製造業', HR: '人材', OTHER: 'その他',
}

export async function POST(request: NextRequest) {
  try {
    const { recording_id, profile_id } = await request.json()
    const supabase = await createServiceClient()

    // 録音レコードを処理中に更新
    await supabase.from('recordings').update({ status: 'processing' }).eq('id', recording_id)

    // プロフィールと録音データを取得
    const [{ data: profile }, { data: recording }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profile_id).single(),
      supabase.from('recordings').select('*').eq('id', recording_id).single(),
    ])

    if (!profile || !recording) throw new Error('データが見つかりません')

    const productProfile = profile.product_profile as ProductProfile
    const industryLabel = INDUSTRY_LABELS[profile.industry_type] || profile.industry_type

    // Supabase Storageから録音ファイルをダウンロード
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('recordings')
      .download(recording.storage_path)
    if (downloadError) throw downloadError

    // Whisper APIで文字起こし
    const audioFile = new File([fileData], 'audio.webm', { type: 'audio/webm' })
    let transcriptText = ''
    try {
      const transcription = await getOpenAI().audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'ja',
      })
      transcriptText = transcription.text
    } catch {
      transcriptText = '（文字起こしに失敗しました）'
    }

    // Claude APIでフィードバック生成
    const prompt = `あなたは${industryLabel}業界専門の営業コーチです。
以下の商材情報と商談の文字起こしを分析し、詳細なフィードバックをJSON形式で返してください。

【商材情報】
商材名: ${productProfile.product_name}
価格帯: ${productProfile.unit_price_range}
営業サイクル: ${productProfile.sales_cycle_days}日
決裁者: ${productProfile.decision_maker}
顧客課題: ${productProfile.pain_points?.join('、')}

【文字起こし】
${transcriptText || '（録音内容なし）'}

以下のJSON形式のみで返してください（余計な説明不要）:
{
  "scores": {
    "overall": 0〜100の整数,
    "opening": 0〜100の整数,
    "needs_discovery": 0〜100の整数,
    "proposal": 0〜100の整数,
    "objection_handling": 0〜100の整数,
    "closing": 0〜100の整数,
    "talk_ratio_percent": 話者の発話割合の整数,
    "filler_word_count": フィラーワード数の整数
  },
  "strengths": ["良かった点1", "良かった点2", "良かった点3"],
  "improvements": ["改善点1", "改善点2", "改善点3"],
  "industry_insights": {
    "industry_specific_score": 0〜100の整数,
    "used_effective_keywords": ["使えていたキーワード"],
    "missed_keywords": ["使えていなかったキーワード"],
    "custom_comments": "業界特有の具体的アドバイス（200字程度）"
  }
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSONの抽出に失敗しました')
    const feedbackData = JSON.parse(jsonMatch[0])

    // フィードバックをDBに保存
    await supabase.from('ai_feedbacks').insert({
      recording_id,
      profile_id,
      scores: feedbackData.scores,
      strengths: feedbackData.strengths,
      improvements: feedbackData.improvements,
      transcript_text: transcriptText,
      industry_insights: feedbackData.industry_insights,
      model_version: 'claude-sonnet-4-20250514',
    })

    // 録音ステータスをcompletedに更新
    await supabase.from('recordings').update({ status: 'completed' }).eq('id', recording_id)

    // XP付与
    const baseXp = 50
    let bonusXp = 0
    if (feedbackData.scores.overall >= 90) bonusXp = 200
    else if (feedbackData.scores.overall >= 80) bonusXp = 100

    await supabase.from('user_levels').update({
      current_xp: supabase.rpc('increment', { x: baseXp + bonusXp }),
      total_xp_earned: supabase.rpc('increment', { x: baseXp + bonusXp }),
      updated_at: new Date().toISOString(),
    }).eq('profile_id', profile_id)

    // usage_stats更新
    const yearMonth = parseInt(new Date().toISOString().slice(0, 7).replace('-', ''))
    const { data: usage } = await supabase.from('usage_stats').select('*')
      .eq('profile_id', profile_id).eq('year_month', yearMonth).single()
    if (usage) {
      await supabase.from('usage_stats').update({
        total_recording_seconds: usage.total_recording_seconds + recording.duration_seconds,
        recording_count: usage.recording_count + 1,
        feedback_count: usage.feedback_count + 1,
        remaining_seconds: Math.max(0, usage.remaining_seconds - recording.duration_seconds),
        updated_at: new Date().toISOString(),
      }).eq('id', usage.id)
    }

    return NextResponse.json({ success: true, overall_score: feedbackData.scores.overall })
  } catch (error) {
    console.error('フィードバック生成エラー:', error)
    // エラー時はステータスをerrorに
    try {
      const { recording_id } = await request.clone().json()
      const supabase = await createServiceClient()
      await supabase.from('recordings').update({ status: 'error' }).eq('id', recording_id)
    } catch {}
    return NextResponse.json({ error: 'フィードバック生成に失敗しました' }, { status: 500 })
  }
}
