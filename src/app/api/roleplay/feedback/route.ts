import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { sessionId, conversation, condition } = body

    if (!conversation || conversation.length === 0) {
      return NextResponse.json({ error: '会話データがありません' }, { status: 400 })
    }

    // 会話を読みやすい形式に変換
    const conversationText = conversation
      .map((m: { role: string; content: string }) =>
        `【${m.role === 'user' ? '営業担当者' : '顧客'}】: ${m.content}`
      )
      .join('\n')

    const prompt = `あなたは営業コーチです。以下のロープレ会話を分析し、フィードバックをJSON形式で返してください。

## ロープレ設定
- 顧客: ${condition?.persona ?? '不明'}
- 難易度: ${condition?.difficulty ?? 3}/5
- 温度感: ${condition?.warmth ?? 'cold'}

## 会話ログ
${conversationText}

## 出力形式（このJSON形式のみで返してください）
{
  "overall_score": 75,
  "feedback_summary": "全体的な評価コメント（2〜3文）",
  "strengths": ["良かった点1", "良かった点2"],
  "improvements": ["改善点1", "改善点2", "改善点3"],
  "skill_scores": {
    "opening": 80,
    "hearing": 65,
    "proposition": 70,
    "objection_handling": 60,
    "closing": 55
  },
  "xp_earned": 80,
  "ai_coach_note": "次回の学習アドバイス（1文）"
}

評価基準：
- opening: 冒頭の掴み方、アイスブレイク
- hearing: 課題の深掘り、質問の質
- proposition: 提案の説得力、ROI説明
- objection_handling: 反論への対応
- closing: 次ステップへの誘導、合意形成`

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response')

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSONが見つかりません')

    const feedback = JSON.parse(jsonMatch[0])

    // DBに保存
    if (sessionId) {
      await supabase.from('ai_roleplay_sessions').update({
        overall_score: feedback.overall_score,
        feedback_summary: feedback.feedback_summary,
        strengths: feedback.strengths,
        improvements: feedback.improvements,
        skill_scores: feedback.skill_scores,
        xp_earned: feedback.xp_earned,
        status: 'completed',
        completed_at: new Date().toISOString(),
      }).eq('id', sessionId)

      // XP付与
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single()
      if (profile && feedback.xp_earned > 0) {
        await supabase.rpc('add_xp', { p_profile_id: profile.id, p_xp: feedback.xp_earned })
      }
    }

    return NextResponse.json(feedback)

  } catch (err) {
    console.error('Roleplay feedback error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'フィードバック生成に失敗しました' },
      { status: 500 }
    )
  }
}
