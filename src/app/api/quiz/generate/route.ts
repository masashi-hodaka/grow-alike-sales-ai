import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient as createServerClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CATEGORY_PROMPTS: Record<string, string> = {
  hearing: 'ヒアリング・課題発見（SPIN質問法、ニーズ掘り下げ、傾聴技術）',
  opening: 'アプローチ・オープニング（テレアポ、初回接触、アイスブレイク）',
  proposition: '提案力・プレゼン（ソリューション提案、資料作成、ROI説明）',
  objection: '反論処理（価格、時期、競合比較、必要性の反論への対応）',
  closing: 'クロージング・次ステップ合意（稟議サポート、タイムライン管理）',
  rapport: 'ラポール構築（信頼関係、共感、コミュニケーション）',
  follow_up: 'フォローアップ（商談後ケア、育成、チャーン防止）',
  product: '商品知識・業界理解（自社商材、競合、市場トレンド）',
  mindset: '営業マインドセット（目標設定、モチベーション、失敗処理）',
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      categories = ['hearing'],
      questionType = 'multiple_choice',
      difficulty = 2,
      count = 5,
      productId = null,
    } = body

    // 商材情報取得（あれば）
    let productContext = ''
    if (productId) {
      const { data: product } = await supabase.from('products').select('*').eq('id', productId).single()
      if (product) {
        productContext = `
## 商材情報（この商材に特化した問題を生成してください）
- 商材名: ${product.name}
- 説明: ${product.description ?? 'なし'}
- ターゲット: ${product.target_segment ?? '未設定'}（${product.target_industry ?? ''}）
- 営業手法: ${product.sales_method ?? '未設定'}
- 競合: ${(product.competitors ?? []).join(', ') || 'なし'}
- よくある反論: ${(product.common_objections ?? []).join(' / ') || 'なし'}
- 差別化ポイント: ${product.differentiators ?? 'なし'}
`
      }
    }

    const categoryDesc = categories
      .map((c: string) => CATEGORY_PROMPTS[c] ?? c)
      .join('、')

    const typeInstructions = questionType === 'multiple_choice'
      ? `4択問題を生成してください。choices配列に{label:"A",text:"..."}の形式で4つの選択肢を含め、correct_answerにA/B/C/Dのいずれかを指定してください。`
      : questionType === 'written'
      ? `記述式問題を生成してください。choices配列は空、correct_answerには模範回答の要点を書いてください。`
      : `ケーススタディ問題を生成してください。実際の商談シナリオを提示し、どう対応するか問う問題にしてください。choices配列は空、correct_answerには最適解の説明を書いてください。`

    const prompt = `あなたは優秀な営業研修のトレーナーです。以下の条件で営業学習の問題を${count}問生成してください。

## カテゴリ
${categoryDesc}

## 問題形式
${typeInstructions}

## 難易度
${difficulty}（1=入門、2=基礎、3=中級、4=応用、5=上級）

${productContext}

## 出力形式（必ずこのJSON配列形式で出力してください）
[
  {
    "skill_category": "hearing",
    "question_type": "${questionType}",
    "difficulty": ${difficulty},
    "question_text": "問題文をここに",
    "choices": [{"label":"A","text":"選択肢A"},{"label":"B","text":"選択肢B"},{"label":"C","text":"選択肢C"},{"label":"D","text":"選択肢D"}],
    "correct_answer": "B",
    "explanation": "解説文をここに（なぜその答えが正しいか、実践でのポイント）",
    "xp_reward": 15
  }
]

重要：
- 実際の営業現場で役立つ具体的な問題にしてください
- 日本語で出力してください
- JSONのみを返し、前後に余分なテキストを含めないでください`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    // JSON抽出
    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('JSONが見つかりません')

    const questions = JSON.parse(jsonMatch[0])

    // DBに保存
    const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single()
    if (profile && questions.length > 0) {
      const rows = questions.map((q: Record<string, unknown>) => ({
        ...q,
        product_id: productId,
      }))
      await supabase.from('quiz_questions').insert(rows)
    }

    return NextResponse.json({ questions, count: questions.length })

  } catch (err) {
    console.error('Quiz generation error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '問題生成に失敗しました' },
      { status: 500 }
    )
  }
}
