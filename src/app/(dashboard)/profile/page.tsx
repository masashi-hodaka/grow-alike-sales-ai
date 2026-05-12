import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Profile, UserLevel, UsageStats, UserBadge, Badge } from '@/types/database'

const RARITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  common:    { color: '#9ca3af', bg: '#f3f4f6', label: 'コモン' },
  rare:      { color: '#3b82f6', bg: '#eff6ff', label: 'レア' },
  epic:      { color: '#8b5cf6', bg: '#f5f3ff', label: 'エピック' },
  legendary: { color: '#f59e0b', bg: '#fffbeb', label: 'レジェンダリー' },
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '¥0',
    period: '/月',
    color: '#6b7280',
    gradient: 'linear-gradient(135deg,#6b7280,#4b5563)',
    features: [
      '問題練習 20問/月',
      'AIロープレ 3回/月',
      '壁打ちチャット 5回/月',
      '商材登録 1件',
      'スキルマップ 閲覧のみ',
    ],
    limits: { recording: 'なし', quiz: '20問', roleplay: '3回', products: '1件' },
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '¥980',
    period: '/月',
    color: '#f97316',
    gradient: 'linear-gradient(135deg,#f97316,#ea580c)',
    badge: '人気No.1',
    features: [
      '問題練習 無制限',
      'AIロープレ 15回/月',
      '壁打ちチャット 20回/月',
      '商材登録 5件',
      '録音分析 5本/月',
      'AIコーチ機能',
      'スキルマップ詳細分析',
    ],
    limits: { recording: '5本', quiz: '無制限', roleplay: '15回', products: '5件' },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '¥1,980',
    period: '/月',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    features: [
      '問題練習 無制限',
      'AIロープレ 30回/月',
      '壁打ちチャット 無制限',
      '商材登録 無制限',
      '録音分析 無制限',
      'AIコーチ（詳細パターン分析）',
      'チームランキング',
      '弱点ミッション自動生成',
    ],
    limits: { recording: '無制限', quiz: '無制限', roleplay: '30回', products: '無制限' },
  },
]

const LEVEL_THRESHOLDS = [
  0, 200, 450, 750, 1100, 1500, 2000, 2600, 3300, 4100, 5000,
  6200, 7600, 9200, 11000, 13000, 15500, 18500, 22000, 26000,
]

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
  if (!profile) redirect('/register')

  const [{ data: userLevel }, { data: usageStats }, { data: allBadges }, { data: userBadges }] = await Promise.all([
    supabase.from('user_levels').select('*').eq('profile_id', profile.id).single(),
    supabase.from('usage_stats').select('*').eq('profile_id', profile.id).order('year_month', { ascending: false }).limit(1).single(),
    supabase.from('badges').select('*'),
    supabase.from('user_badges').select('*, badge:badges(*)').eq('profile_id', profile.id),
  ])

  const p = profile as Profile
  const ul = userLevel as UserLevel | null
  const us = usageStats as UsageStats | null
  const currentPlan = p.plan ?? p.plan_type ?? 'free'
  const unlockedIds = new Set((userBadges ?? []).map((ub: UserBadge) => ub.badge_id))

  const level = ul?.current_level ?? 1
  const currentXp = ul?.current_xp ?? 0
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? (LEVEL_THRESHOLDS[level - 1] + 5000)
  const prevThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  const xpProgress = Math.min(100, Math.round(((currentXp - prevThreshold) / (nextThreshold - prevThreshold)) * 100))

  const initials = p.full_name?.charAt(0)?.toUpperCase() ?? p.company_name?.charAt(0)?.toUpperCase() ?? 'U'
  const displayName = p.full_name ?? p.company_name ?? 'ユーザー'
  const streak = p.current_streak ?? 5

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">プロフィール</h1>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: Profile + badges */}
        <div className="col-span-2 space-y-4">

          {/* Profile card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                {initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
                  {streak > 0 && (
                    <span className="flex items-center gap-1 text-sm bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                      🔥{streak}日連続
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                    style={{ background: PLANS.find(p => p.id === currentPlan)?.gradient ?? '#6b7280' }}>
                    {currentPlan.toUpperCase()} プラン
                  </span>
                  <span className="text-orange-500 text-sm font-bold">Lv.{level}</span>
                </div>
              </div>
              <Link href="/register?edit=true"
                className="text-sm border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                編集
              </Link>
            </div>

            {/* XP bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Level {level}</span>
                <span>{currentXp.toLocaleString()} / {nextThreshold.toLocaleString()} XP</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${xpProgress}%`, background: 'linear-gradient(90deg,#f97316,#fbbf24)' }} />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              {[
                { label: '総獲得XP', value: (ul?.total_xp_earned ?? 0).toLocaleString(), unit: 'XP', color: '#f97316' },
                { label: '録音本数', value: us?.recording_count ?? 0, unit: '本', color: '#3b82f6' },
                { label: '取得バッジ', value: unlockedIds.size, unit: '個', color: '#8b5cf6' },
                { label: '最長連続', value: p.longest_streak ?? streak, unit: '日', color: '#10b981' },
              ].map(stat => (
                <div key={stat.label} className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.unit}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">
                バッジコレクション
                <span className="ml-2 text-orange-500">{unlockedIds.size}</span>
                <span className="text-gray-400">/{allBadges?.length ?? 0}</span>
              </h3>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {(allBadges ?? []).map((badge: Badge) => {
                const unlocked = unlockedIds.has(badge.id)
                const cfg = RARITY_CONFIG[badge.rarity] ?? RARITY_CONFIG.common
                return (
                  <div key={badge.id}
                    className={`rounded-xl p-3 text-center border-2 transition ${
                      unlocked ? 'shadow-sm' : 'opacity-35 grayscale'
                    }`}
                    style={{
                      borderColor: unlocked ? cfg.color : '#e5e7eb',
                      background: unlocked ? cfg.bg : '#f9fafb',
                    }}>
                    <div className="text-2xl mb-1">{badge.icon_url ?? '🏅'}</div>
                    <p className="text-xs font-semibold text-gray-700 leading-tight">{badge.name}</p>
                    <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Plan info */}
        <div className="space-y-4">
          {/* Current plan summary */}
          <div className="rounded-2xl p-5 text-white shadow-sm"
            style={{ background: PLANS.find(pl => pl.id === currentPlan)?.gradient ?? 'linear-gradient(135deg,#6b7280,#4b5563)' }}>
            <p className="text-white/70 text-xs mb-1">現在のプラン</p>
            <p className="text-2xl font-black mb-0.5">{currentPlan.toUpperCase()}</p>
            <p className="text-white/70 text-sm">{PLANS.find(pl => pl.id === currentPlan)?.price ?? '¥0'}<span className="text-xs">/月</span></p>
          </div>

          {/* Plan comparison cards */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3">プランを比較</h3>
            <div className="space-y-3">
              {PLANS.map(plan => {
                const isCurrent = plan.id === currentPlan
                return (
                  <div key={plan.id}
                    className={`rounded-xl p-4 border-2 transition ${isCurrent ? '' : 'hover:border-gray-300'}`}
                    style={{ borderColor: isCurrent ? plan.color : '#e5e7eb' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm" style={{ color: plan.color }}>{plan.name}</span>
                        {plan.badge && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
                            style={{ background: plan.color }}>
                            {plan.badge}
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                            現在
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-gray-900 text-sm">{plan.price}<span className="text-xs text-gray-400">{plan.period}</span></span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 mb-3">
                      <span>録音: {plan.limits.recording}</span>
                      <span>問題: {plan.limits.quiz}</span>
                      <span>ロープレ: {plan.limits.roleplay}</span>
                      <span>商材: {plan.limits.products}</span>
                    </div>
                    {!isCurrent && plan.id !== 'free' && (
                      <button
                        className="w-full text-xs text-white py-2 rounded-lg font-bold transition hover:opacity-90"
                        style={{ background: plan.gradient }}>
                        {plan.name}にアップグレード
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Account */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3">アカウント情報</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">メールアドレス</span>
                <span className="font-medium text-gray-800 text-xs truncate ml-2">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">会社名</span>
                <span className="font-medium">{p.company_name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">登録日</span>
                <span className="font-medium">{new Date(p.created_at).toLocaleDateString('ja-JP')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
