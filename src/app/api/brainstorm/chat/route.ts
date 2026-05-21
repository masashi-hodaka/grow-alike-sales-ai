import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })
}

const SYSTEM_PROMPT = `あなたは「Sales Coach AI」という、営業のプロフェッショナルコーチです。
Grow Alike Sales AIというプラットフォーム上で、営業担当者の商談力向上を支援しています。

【あなたの役割】
- ユーザーの商談や営業活動について、具体的かつ実践的なアドバイスを提供する
- 商談の壁打ち相手として、戦略立案・トーク練習・振り返りを一緒に行う
- ユーザーの状況を深く理解し、その商談に最適なアドバイスをする

【対応できること】
- 商談前の作戦立て・シナリオ検討
- トークスクリプトの添削・改善提案
- 反論対処法の練習
- 商談後の振り返りとネクストアクション整理
- 競合比較・差別化ポイントの整理
- ヒアリング質問の設計

【会話スタイル】
- フレンドリーで前向き、でもプロフェッショナルな口調
- 具体的な例や言い回しを示しながら説明する
- 一度に全部解決しようとせず、ユーザーの状況を先にヒアリングする
- 営業の型（BANT・SPIN・問題/解決提案など）を自然に取り入れる
- 日本語で会話する
- 返答は読みやすい長さにまとめ、必要に応じて箇条書きを使う

【重要】
- AIロープレではなく「コーチング」の場なので、顧客役を演じることはしない
- ユーザーが悩んでいることに共感し、一緒に解決策を考える姿勢を大切にする`

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[]
      context?: { productName?: string; topic?: string }
    }

    if (!messages?.length) {
      return NextResponse.json({ error: 'messages is required' }, { status: 400 })
    }

    let systemPrompt = SYSTEM_PROMPT
    if (context?.productName) {
      systemPrompt += `\n\n【現在の商材】ユーザーの商材名: ${context.productName}`
    }
    if (context?.topic) {
      systemPrompt += `\n【相談テーマ】${context.topic}`
    }

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })

    const content = response.content[0]
    const text = content.type === 'text' ? content.text : ''

    return NextResponse.json({ message: text })
  } catch (error) {
    console.error('Brainstorm chat error:', error)
    // API keyが未設定の場合はわかりやすいメッセージ
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
    }
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
