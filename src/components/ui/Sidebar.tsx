'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, UserLevel } from '@/types/database'

const LEVEL_THRESHOLDS = [
  0, 200, 450, 750, 1100, 1500, 2000, 2600, 3300, 4100, 5000,
  6200, 7600, 9200, 11000, 13000, 15500, 18500, 22000, 26000,
]

function getXpProgress(level: number, currentXp: number) {
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? (LEVEL_THRESHOLDS[level - 1] + 5000)
  const progress = currentXp - currentThreshold
  const total = nextThreshold - currentThreshold
  return Math.min(100, Math.round((progress / total) * 100))
}

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'ホーム',
    emoji: '🏠',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    href: '/quiz',
    label: '問題練習',
    emoji: '🧠',
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  },
  {
    href: '/roleplay',
    label: 'AIロープレ',
    emoji: '🎭',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    href: '/brainstorm',
    label: '壁打ちチャット',
    emoji: '🤝',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
  {
    href: '/recordings',
    label: '録音分析',
    emoji: '🎙️',
    icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
  },
  {
    href: '/skills',
    label: 'スキルマップ',
    emoji: '📊',
    icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  },
  {
    href: '/missions',
    label: 'ミッション',
    emoji: '🎯',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  {
    href: '/leaderboard',
    label: 'ランキング',
    emoji: '🏆',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    href: '/products',
    label: '商材管理',
    emoji: '📦',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  },
  {
    href: '/profile',
    label: 'プロフィール',
    emoji: '👤',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
]

export default function Sidebar({ profile, userLevel }: { profile: Profile; userLevel: UserLevel | null }) {
  const pathname = usePathname()
  const router = useRouter()

  const level = userLevel?.current_level ?? 1
  const currentXp = userLevel?.current_xp ?? 0
  const xpProgress = getXpProgress(level, currentXp)
  const xpToNext = (LEVEL_THRESHOLDS[level] ?? 0) - currentXp
  const streak = profile.current_streak ?? 0

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = profile.full_name?.charAt(0)?.toUpperCase() ?? profile.company_name?.charAt(0)?.toUpperCase() ?? 'U'

  return (
    <div className="fixed top-0 left-0 h-full w-[228px] flex flex-col z-20"
      style={{ background: 'linear-gradient(180deg,#1e293b 0%,#0f172a 100%)' }}>

      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            🔥
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Grow Alike</p>
            <p className="text-orange-400 text-xs font-medium">Sales AI</p>
          </div>
        </div>
      </div>

      {/* User info + XP bar */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#f97316,#dc2626)' }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-semibold truncate">
              {profile.full_name ?? profile.company_name ?? 'ユーザー'}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-orange-400 text-xs font-bold">Lv.{level}</span>
              {streak > 0 && (
                <span className="text-amber-400 text-xs flex items-center gap-0.5">
                  🔥{streak}日
                </span>
              )}
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-orange-300 font-medium">{currentXp.toLocaleString()} XP</span>
            <span className="text-white/40">あと {xpToNext > 0 ? xpToNext.toLocaleString() : 0}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${xpProgress}%`,
                background: 'linear-gradient(90deg,#f97316,#fbbf24)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'text-white'
                  : 'text-white/55 hover:bg-white/8 hover:text-white/90'
              }`}
              style={isActive ? {
                background: 'linear-gradient(90deg,rgba(249,115,22,0.25),rgba(249,115,22,0.08))',
                borderLeft: '3px solid #f97316',
              } : {}}>
              <span className="text-base w-5 text-center">{item.emoji}</span>
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Plan badge + Logout */}
      <div className="px-4 py-3 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          {(profile.plan ?? 'free') === 'beta' ? (
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: 'white' }}>
              BETA
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-medium">
              {(profile.plan ?? 'free').toUpperCase()} プラン
            </span>
          )}
          <Link href="/profile" className="text-xs text-orange-400 hover:text-orange-300 transition">
            {(profile.plan ?? 'free') === 'beta' ? 'プラン詳細' : 'アップグレード'}
          </Link>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 text-white/40 hover:text-white/70 text-xs transition px-2 py-1.5 rounded-lg hover:bg-white/5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          ログアウト
        </button>
      </div>
    </div>
  )
}
