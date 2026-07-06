import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })
}

const WARMTH_DESCRIPTION: Record<string, string> = {
  cold: 'まったく興味がない。忙しい。話を聞く気がない。早く切りたい。',
  warm: '多少興味はある。ただし積極的ではなく、話を聞いてみようという姿勢。',
  hot: '積極的に興味を持っている。課題を認識しており、解決策を探している。',
}

const DIFFICULTY_DESCRIPTION: Record<number, string> = {
  1: '素直で好意的。反論は少ない。会話しやすい相手。',
  2: '少しだけ慎重。時々質問や懸念を示すが、概ね前向き。',
  3: '標準的な顧客。価格や時期など一般的な反論をする。',
  4: '懐疑的で厳しい。論理的な根拠を求める。簡単には動かない。',
  5: '非常に厳しい。強烈な反論、時間プレッシャー、比較検討中。最難関の相手。',
}

function buildSystemPrompt(condition: {
  persona: string
  difficulty: number
  industry: string
  warmth: string
  scenario?: string
  productContext?: string
}): string {
  return `あなたは営業ロープレの顧客役を演じるAIです。以下の設定に従って顧客として振る舞ってください。

## 顧客設定
- ペルソナ: ${condition.persona}
- 業種: ${condition.industry}
- 温度感: ${condition.warmth}（${WARMTH_DESCRIPTION[condition.warmth] ?? '標準的な顧客'}）
- 難易度: ${condition.difficulty}（${DIFFICULTY_DESCRIPTION[condition.difficulty] ?? '標準'}）
${condition.scenario ? `- シナリオ: ${condition.scenario}` : ''}
${condition.productContext ? `\n## 商材情報（営業担当者が売ろうとしている商材）\n${condition.productContext}` : ''}

## 演じ方のルール
1. 常に顧客の立場で話す（営業担当者の立場にならない）
2. 設定に合った反論・質問・懸念を自然に出す
3. 難易度に応じて反論の強さを調整する
4. 一度に1〜3文程度のリアルな会話をする
5. 顧客として自然な日本語ビジネス会話をする
6. 良い提案には少し心が動く様子を見せる（完全に冷たくはならない）
7. AIであることを明かさない。あくまで顧客として振る舞う

## 重要：電話の方向性
あなたは【電話を受ける側】です。営業担当者があなたにかけてきた電話に出る立場です。
「今お時間よろしいでしょうか？」「お時間はよろしいですか？」などの確認フレーズは絶対に言わないでください。
電話を受けた瞬間の自然な反応（例：「はい、〇〇でございます」「お電話ありがとうございます、〇〇です」）から始めてください。`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      messages = [],       // {role: 'user'|'assistant', content: string}[]
      condition,           // {persona, difficulty, industry, warmth, scenario}
      productId = null,
      sessionId = null,
    } = body

    if (!condition) {
      return NextResponse.json({ error: 'conditionが必要です' }, { status: 400 })
    }

    // 商材情報取得
    let productContext = ''
    if (productId) {
      const { data: product } = await supabase.from('products').select('*').eq('id', productId).single()
      if (product) {
        productContext = `
- 商材名: ${product.name}
- 説明: ${product.description ?? ''}
- ターゲット: ${product.target_segment ?? ''}
- 競合: ${(product.competitors ?? []).join(', ')}
- 差別化: ${product.differentiators ?? ''}
- よくある反論: ${(product.common_objections ?? []).join(' / ')}`
      }
    }

    const systemPrompt = buildSystemPrompt({ ...condition, productContext })

    // Claude API呼び出し
    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: messages.length > 0 ? messages : [
        { role: 'user', content: '（通話が繋がった）' }
      ],
    })

    const aiMessage = response.content[0]
    if (aiMessage.type !== 'text') throw new Error('Unexpected response')

    // セッションに会話を保存
    if (sessionId) {
      const newMessage = { role: 'ai', content: aiMessage.text, timestamp: new Date().toISOString() }
      const { data: session } = await supabase
        .from('ai_roleplay_sessions')
        .select('conversation')
        .eq('id', sessionId)
        .single()

      const existingConversation = (session?.conversation ?? []) as unknown[]
      await supabase
        .from('ai_roleplay_sessions')
        .update({ conversation: [...existingConversation, newMessage] })
        .eq('id', sessionId)
    }

    return NextResponse.json({ message: aiMessage.text })

  } catch (err) {
    console.error('Roleplay chat error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI応答に失敗しました' },
      { status: 500 }
    )
  }
}
