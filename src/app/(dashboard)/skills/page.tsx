'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

// ===== 型定義 =====
type SkillMastery = 'locked' | 'learning' | 'practiced' | 'mastered'

type SkillNode = {
  id: string
  name: string
  category: string
  mastery: SkillMastery
  score: number        // 0-100
  xpRequired: number
  xpCurrent: number
  isWeak: boolean
  description: string
  tips: string[]
}

type SkillCategory = {
  id: string
  label: string
  emoji: string
  color: string
  bgColor: string
  skills: SkillNode[]
}

// ===== ダミーデータ =====
const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: 'prospecting',
    label: '見込み発掘',
    emoji: '🔍',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    skills: [
      { id: 's1', name: 'リスト作成', category: 'prospecting', mastery: 'locked', score: 0, xpRequired: 200, xpCurrent: 0, isWeak: false,
        description: 'ターゲットリストの質と量を高めるスキル',
        tips: ['業種×役職でセグメント', 'LinkedInを活用', 'ICP（理想顧客プロファイル）を定義'] },
      { id: 's2', name: 'ターゲティング', category: 'prospecting', mastery: 'locked', score: 0, xpRequired: 300, xpCurrent: 0, isWeak: false,
        description: 'アプローチすべき企業・担当者の優先順位付け',
        tips: ['BANTで絞り込む', '購買シグナルを探す', '決裁者にアプローチ'] },
      { id: 's3', name: 'SNS活用', category: 'prospecting', mastery: 'locked', score: 0, xpRequired: 200, xpCurrent: 0, isWeak: false,
        description: 'LinkedInやTwitterを使ったソーシャルセリング',
        tips: ['プロフィールを最適化', 'コンテンツで信頼構築', 'DMの開封率を上げるコツ'] },
    ],
  },
  {
    id: 'opening',
    label: 'オープニング',
    emoji: '🚪',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    skills: [
      { id: 's4', name: '電話オープニング', category: 'opening', mastery: 'locked', score: 0, xpRequired: 200, xpCurrent: 0, isWeak: false,
        description: '最初の15秒で相手の興味を引くスキル',
        tips: ['用件を先に言う', 'メリット起点で話す', 'ゲートキーパー突破術'] },
      { id: 's5', name: 'アイスブレイク', category: 'opening', mastery: 'locked', score: 0, xpRequired: 150, xpCurrent: 0, isWeak: false,
        description: '自然な雑談から本題へ移行するスキル',
        tips: ['共通点を見つける', '業界ニュースを活用', '相手を主役にする'] },
      { id: 's6', name: '自己紹介', category: 'opening', mastery: 'locked', score: 0, xpRequired: 150, xpCurrent: 0, isWeak: false,
        description: '30秒で価値を伝えるエレベーターピッチ',
        tips: ['数字で実績を示す', '顧客視点で語る', 'シンプルに言い切る'] },
    ],
  },
  {
    id: 'hearing',
    label: 'ヒアリング',
    emoji: '👂',
    color: '#10b981',
    bgColor: '#f0fdf4',
    skills: [
      { id: 's7', name: '課題ヒアリング', category: 'hearing', mastery: 'locked', score: 0, xpRequired: 400, xpCurrent: 0, isWeak: false,
        description: '潜在課題まで掘り下げる質問スキル',
        tips: ['「なぜ？」を3回繰り返す', 'SPIN質問法を使う', '沈黙を恐れない'] },
      { id: 's8', name: '決裁フロー把握', category: 'hearing', mastery: 'locked', score: 0, xpRequired: 300, xpCurrent: 0, isWeak: false,
        description: '誰が何を決める組織なのかを把握するスキル',
        tips: ['MEDDIC/BANT確認', '意思決定者を巻き込む', '稟議プロセスを聞く'] },
      { id: 's9', name: 'ニーズ整理', category: 'hearing', mastery: 'locked', score: 0, xpRequired: 250, xpCurrent: 0, isWeak: false,
        description: '聞いた情報を整理して課題を言語化するスキル',
        tips: ['ヒアリングシートを活用', 'サマリーで確認する', '優先課題を合意する'] },
    ],
  },
  {
    id: 'proposition',
    label: '提案力',
    emoji: '💡',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    skills: [
      { id: 's10', name: 'ソリューション提案', category: 'proposition', mastery: 'locked', score: 0, xpRequired: 400, xpCurrent: 0, isWeak: false,
        description: '課題に直結した提案を作るスキル',
        tips: ['課題→解決策の流れを守る', 'ROIを明示する', '具体的な数字で語る'] },
      { id: 's11', name: '資料作成', category: 'proposition', mastery: 'locked', score: 0, xpRequired: 300, xpCurrent: 0, isWeak: false,
        description: '説得力のある提案資料を作るスキル',
        tips: ['1スライド1メッセージ', '顧客名を入れる', 'ストーリーで構成する'] },
      { id: 's12', name: '競合差別化', category: 'proposition', mastery: 'locked', score: 0, xpRequired: 350, xpCurrent: 0, isWeak: false,
        description: '競合と比較して自社の優位性を伝えるスキル',
        tips: ['顧客の選定基準を先に聞く', 'ランドスケープマップで整理', '比較表を活用'] },
    ],
  },
  {
    id: 'objection',
    label: '反論処理',
    emoji: '🛡️',
    color: '#ef4444',
    bgColor: '#fef2f2',
    skills: [
      { id: 's13', name: '価格反論', category: 'objection', mastery: 'locked', score: 0, xpRequired: 350, xpCurrent: 0, isWeak: false,
        description: '「高い」「予算がない」という反論への対処',
        tips: ['ROIで語る', '初期費用と総費用を分けて説明', '分割払い等の代替案を提示'] },
      { id: 's14', name: '時期反論', category: 'objection', mastery: 'locked', score: 0, xpRequired: 300, xpCurrent: 0, isWeak: false,
        description: '「今は忙しい」「また今度」という反論への対処',
        tips: ['損失を数値化する', '小さな次のステップを提案', 'タイムラインを合意する'] },
      { id: 's15', name: '既存代替反論', category: 'objection', mastery: 'locked', score: 0, xpRequired: 400, xpCurrent: 0, isWeak: false,
        description: '「今のやり方で十分」という反論への対処',
        tips: ['現状の隠れコストを可視化', 'before/after事例を見せる', '移行コストの低さをアピール'] },
    ],
  },
  {
    id: 'closing',
    label: 'クロージング',
    emoji: '🤝',
    color: '#f97316',
    bgColor: '#fff7ed',
    skills: [
      { id: 's16', name: 'クローズ手法', category: 'closing', mastery: 'locked', score: 0, xpRequired: 400, xpCurrent: 0, isWeak: false,
        description: '成約率を高めるクロージングテクニック',
        tips: ['想定反論を事前に潰す', 'チョイスクローズを活用', '次のステップを具体的に合意'] },
      { id: 's17', name: '稟議サポート', category: 'closing', mastery: 'locked', score: 0, xpRequired: 300, xpCurrent: 0, isWeak: false,
        description: '社内決裁を通すための担当者サポート',
        tips: ['稟議書テンプレートを提供', '決裁者向けのサマリー資料', 'ROI計算ツールを活用'] },
    ],
  },
]

const MASTERY_CONFIG: Record<SkillMastery, { label: string; color: string; bg: string; ring: string }> = {
  locked:    { label: '未解放', color: '#9ca3af', bg: '#f3f4f6', ring: '#e5e7eb' },
  learning:  { label: '学習中', color: '#f97316', bg: '#fff7ed', ring: '#fdba74' },
  practiced: { label: '練習済', color: '#3b82f6', bg: '#eff6ff', ring: '#93c5fd' },
  mastered:  { label: '習得済', color: '#10b981', bg: '#f0fdf4', ring: '#6ee7b7' },
}

function RadarChart({ categories }: { categories: SkillCategory[] }) {
  const scores = categories.map(cat => {
    const avg = cat.skills.reduce((sum, s) => sum + s.score, 0) / cat.skills.length
    return Math.round(avg)
  })
  const cx = 120, cy = 120, r = 90
  const n = categories.length
  const points = scores.map((score, i) => {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2
    const pct = score / 100
    return { x: cx + r * pct * Math.cos(angle), y: cy + r * pct * Math.sin(angle) }
  })
  const gridPoints = (pct: number) =>
    Array.from({ length: n }, (_, i) => {
      const angle = (i * 2 * Math.PI) / n - Math.PI / 2
      return `${cx + r * pct * Math.cos(angle)},${cy + r * pct * Math.sin(angle)}`
    }).join(' ')

  const shapePoints = points.map(p => `${p.x},${p.y}`).join(' ')
  const labelRadius = r + 22
  const labelPos = categories.map((_, i) => {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2
    return { x: cx + labelRadius * Math.cos(angle), y: cy + labelRadius * Math.sin(angle) }
  })

  return (
    <svg width="240" height="240" viewBox="0 0 240 240">
      {/* Grid circles */}
      {[0.25, 0.5, 0.75, 1].map(pct => (
        <polygon key={pct} points={gridPoints(pct)}
          fill="none" stroke="#e5e7eb" strokeWidth="1" />
      ))}
      {/* Axis lines */}
      {Array.from({ length: n }, (_, i) => {
        const angle = (i * 2 * Math.PI) / n - Math.PI / 2
        return (
          <line key={i} x1={cx} y1={cy}
            x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)}
            stroke="#e5e7eb" strokeWidth="1" />
        )
      })}
      {/* Data shape */}
      <polygon points={shapePoints}
        fill="rgba(249,115,22,0.15)" stroke="#f97316" strokeWidth="2" />
      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#f97316" />
      ))}
      {/* Labels */}
      {labelPos.map((pos, i) => (
        <text key={i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fill="#6b7280" fontWeight="600">
          {categories[i].emoji}
        </text>
      ))}
    </svg>
  )
}

function SkillCard({ skill, onSelect }: { skill: SkillNode; onSelect: (s: SkillNode) => void }) {
  const cfg = MASTERY_CONFIG[skill.mastery]
  const progress = Math.round((skill.xpCurrent / skill.xpRequired) * 100)

  return (
    <button onClick={() => skill.mastery !== 'locked' && onSelect(skill)}
      className={`relative text-left p-3 rounded-xl border-2 transition-all ${
        skill.mastery === 'locked' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'
      }`}
      style={{ borderColor: cfg.ring, background: cfg.bg }}>
      {skill.isWeak && (
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
          <span className="text-white text-xs font-bold">!</span>
        </div>
      )}
      <div className="flex items-center justify-between mb-1.5">
        <p className="font-semibold text-xs text-gray-800 leading-tight">{skill.name}</p>
        <span className="text-xs font-bold ml-1" style={{ color: cfg.color }}>
          {skill.mastery === 'locked' ? '🔒' : `${skill.score}`}
        </span>
      </div>
      <div className="h-1 bg-white/60 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${progress}%`, background: cfg.color }} />
      </div>
      <div className="flex justify-between text-xs mt-1" style={{ color: cfg.color }}>
        <span>{cfg.label}</span>
        <span>{skill.xpCurrent}/{skill.xpRequired}XP</span>
      </div>
    </button>
  )
}

export default function SkillsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null)
  const [userXp, setUserXp] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single()
      if (!profile) return
      const { data: ul } = await supabase.from('user_levels').select('current_xp').eq('profile_id', profile.id).single()
      setUserXp(ul?.current_xp ?? 0)
      setLoading(false)
    }
    load()
  }, [])

  const allSkills = SKILL_CATEGORIES.flatMap(c => c.skills)
  const weakSkills = allSkills.filter(s => s.isWeak)
  const masteredCount = allSkills.filter(s => s.mastery === 'mastered').length
  const avgScore = Math.round(allSkills.filter(s => s.score > 0).reduce((sum, s) => sum + s.score, 0) / allSkills.filter(s => s.score > 0).length)

  const displayedCategories = selectedCategory === 'all'
    ? SKILL_CATEGORIES
    : SKILL_CATEGORIES.filter(c => c.id === selectedCategory)

  const close = () => setSelectedSkill(null)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">スキルマップ</h1>
          <p className="text-gray-500 text-sm mt-0.5">あなたの営業力を可視化・強化しましょう</p>
        </div>
        <Link href="/quiz"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
          🧠 弱点を練習する
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Radar chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center">
          <p className="font-bold text-gray-800 text-sm mb-2 self-start">総合スキルチャート</p>
          <RadarChart categories={SKILL_CATEGORIES} />
          <div className="grid grid-cols-2 gap-2 w-full mt-2">
            <div className="text-center p-2 bg-gray-50 rounded-xl">
              <p className="text-xl font-black text-gray-900">{avgScore}</p>
              <p className="text-xs text-gray-500">平均スコア</p>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded-xl">
              <p className="text-xl font-black text-orange-600">{masteredCount}</p>
              <p className="text-xs text-gray-500">習得済スキル</p>
            </div>
          </div>
        </div>

        {/* Stats + Weak */}
        <div className="col-span-3 space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-3">
            {SKILL_CATEGORIES.map(cat => {
              const avg = Math.round(cat.skills.reduce((sum, s) => sum + s.score, 0) / cat.skills.length)
              const hasWeak = cat.skills.some(s => s.isWeak)
              return (
                <button key={cat.id}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? 'all' : cat.id)}
                  className={`p-3 rounded-xl text-left transition border-2 ${
                    selectedCategory === cat.id ? 'border-opacity-80' : 'border-transparent hover:border-gray-200'
                  }`}
                  style={{
                    background: cat.bgColor,
                    borderColor: selectedCategory === cat.id ? cat.color : undefined,
                  }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">{cat.emoji}</span>
                    {hasWeak && <span className="text-red-500 text-xs">⚠️</span>}
                  </div>
                  <p className="font-bold text-xs text-gray-700">{cat.label}</p>
                  <p className="text-lg font-black" style={{ color: cat.color }}>{avg}<span className="text-xs font-normal text-gray-500">点</span></p>
                  <div className="h-1 bg-white/60 rounded-full overflow-hidden mt-1">
                    <div className="h-full rounded-full" style={{ width: `${avg}%`, background: cat.color }} />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Weak skills alert */}
          {weakSkills.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚠️</span>
                <p className="font-bold text-red-800 text-sm">弱点スキル（{weakSkills.length}件）</p>
                <Link href="/quiz?weak=true" className="ml-auto text-xs bg-red-500 text-white px-3 py-1 rounded-lg font-medium hover:bg-red-600 transition">
                  集中練習する
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {weakSkills.map(s => (
                  <button key={s.id} onClick={() => setSelectedSkill(s)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-red-200 rounded-lg text-xs text-red-700 font-medium hover:bg-red-50 transition">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    {s.name}
                    <span className="text-red-400">{s.score}点</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mastery legend */}
          <div className="flex items-center gap-4 px-1">
            {Object.entries(MASTERY_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: cfg.ring, background: cfg.bg }} />
                <span className="text-xs text-gray-500">{cfg.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-red-500 text-sm font-bold">!</span>
              <span className="text-xs text-gray-500">弱点</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button onClick={() => setSelectedCategory('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${
            selectedCategory === 'all' ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          style={selectedCategory === 'all' ? { background: 'linear-gradient(135deg,#f97316,#ea580c)' } : {}}>
          すべて
        </button>
        {SKILL_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setSelectedCategory(cat.id === selectedCategory ? 'all' : cat.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap flex items-center gap-1 ${
              selectedCategory === cat.id ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={selectedCategory === cat.id ? { background: cat.color } : {}}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Skill grid */}
      <div className="space-y-5">
        {displayedCategories.map(cat => (
          <div key={cat.id} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">{cat.emoji}</span>
              <h2 className="font-bold text-gray-900">{cat.label}</h2>
              <span className="text-sm font-bold" style={{ color: cat.color }}>
                平均{Math.round(cat.skills.reduce((sum, s) => sum + s.score, 0) / cat.skills.length)}点
              </span>
              <div className="ml-auto flex gap-2">
                <Link href={`/quiz?category=${cat.id}`}
                  className="text-xs border px-3 py-1 rounded-lg font-medium transition hover:opacity-80"
                  style={{ borderColor: cat.color, color: cat.color }}>
                  問題練習
                </Link>
                <Link href={`/roleplay?category=${cat.id}`}
                  className="text-xs text-white px-3 py-1 rounded-lg font-medium transition hover:opacity-90"
                  style={{ background: cat.color }}>
                  ロープレ
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {cat.skills.map(skill => (
                <SkillCard key={skill.id} skill={skill} onSelect={setSelectedSkill} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Skill Detail Modal */}
      {selectedSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            {(() => {
              const cat = SKILL_CATEGORIES.find(c => c.id === selectedSkill.category)!
              const cfg = MASTERY_CONFIG[selectedSkill.mastery]
              const progress = Math.round((selectedSkill.xpCurrent / selectedSkill.xpRequired) * 100)
              return (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{cat.emoji}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: cat.bgColor, color: cat.color }}>
                          {cat.label}
                        </span>
                        {selectedSkill.isWeak && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">弱点</span>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedSkill.name}</h2>
                    </div>
                    <button onClick={close} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{selectedSkill.description}</p>

                  {/* Score */}
                  <div className="flex items-center gap-4 mb-4 p-3 rounded-xl" style={{ background: cfg.bg }}>
                    <div className="text-center">
                      <p className="text-3xl font-black" style={{ color: cfg.color }}>{selectedSkill.score}</p>
                      <p className="text-xs text-gray-500">スコア</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: cfg.color }}>{cfg.label}</span>
                        <span className="text-gray-500">{selectedSkill.xpCurrent} / {selectedSkill.xpRequired} XP</span>
                      </div>
                      <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${progress}%`, background: cfg.color }} />
                      </div>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="mb-5">
                    <p className="font-semibold text-gray-800 text-sm mb-2">上達のポイント</p>
                    <ul className="space-y-1.5">
                      {selectedSkill.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-orange-400 mt-0.5 flex-shrink-0">✓</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/quiz?category=${selectedSkill.category}`}
                      className="flex-1 text-center py-2.5 rounded-xl text-sm font-bold text-orange-600 border border-orange-300 hover:bg-orange-50 transition">
                      問題練習
                    </Link>
                    <Link href={`/roleplay?category=${selectedSkill.category}`}
                      className="flex-1 text-center py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                      ロープレで実践
                    </Link>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
