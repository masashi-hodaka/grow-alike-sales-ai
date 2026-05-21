import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { ProductProfile, SkillCategory } from '@/types/database'

export const dynamic = 'force-dynamic'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })
}

const INDUSTRY_LABELS: Record<string, string> = {
  IT_SAAS: 'SaaS/IT',
  REAL_ESTATE: '不動産',
  FINANCE: '金融',
  MEDICAL: '医療・製薬',
  MANUFACTURING: '製造業',
  HR: '人材',
  OTHER: 'その他',
}

export async function POST(request: NextRequest) {
  try {
    const { profile_id, industry_type, product_profile } = await request.json() as {
      profile_id: string
      industry_type: string
      product_profile: ProductProfile
    }

    const industryLabel = INDUSTRY_LABELS[industry_type] || industry_type

    const prompt = `あなたは営業コーチです。以下の情報をもとに、この営業担当者が習得すべきスキル項目を12〜15個生成してください。

業界: ${industryLabel}
商材: ${product_profile.product_name}
価格帯: ${product_profile.unit_price_range}
営業サイクル: ${product_profile.sales_cycle_days}日
主な決裁者: ${product_profile.decision_maker}
顧客課題: ${product_profile.pain_points.join('、')}

各スキルについて以下のJSON形式で返してください（配列で返す）。余計な説明は不要でJSONのみ返してください:
[
  {
    "skill_name": "スキル名",
    "skill_category": "prospecting か discovery か demo か closing か objection のいずれか",
    "difficulty_level": 1から5の整数,
    "learning_content": {
      "objective": "このスキルで何ができるようになるか",
      "key_phrases": ["効果的なフレーズ例1", "フレーズ例2"],
      "bad_examples": ["やってはいけない例"],
      "estimated_minutes": 学習目安分数の整数
    }
  }
]`

    const message = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    // JSONを抽出
    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('JSONの抽出に失敗しました')

    const skills = JSON.parse(jsonMatch[0])

    // Supabaseに保存
    const supabase = await createServiceClient()
    const skillRecords = skills.map((skill: {
      skill_name: string
      skill_category: SkillCategory
      difficulty_level: number
      learning_content: object
    }) => ({
      profile_id,
      industry_type,
      skill_name: skill.skill_name,
      skill_category: skill.skill_category,
      difficulty_level: skill.difficulty_level,
      learning_content: skill.learning_content,
    }))

    const { error } = await supabase.from('skills_curriculum').insert(skillRecords)
    if (error) throw error

    return NextResponse.json({ success: true, count: skills.length })
  } catch (error) {
    console.error('スキル生成エラー:', error)
    return NextResponse.json(
      { error: 'スキル生成に失敗しました' },
      { status: 500 }
    )
  }
}
