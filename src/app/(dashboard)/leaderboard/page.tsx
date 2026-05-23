'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type RankEntry = {
  profileId: string
  name: string
  company: string
  xp: number
  level: number
  streak: number
  isMe: boolean
}

type RawRow = {
  current_xp: number | null
  total_xp_earned: number | null
  current_level: number | null
  profile: {
    id: string
    full_name: string | null
    company_name: string | null
    user_id: string
    current_streak: number | null
  } | null
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>
  if (rank === 2) return <span className="text-2xl">🥈</span>
  if (rank === 3) return <span className="text-2xl">🥉</span>
  return <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">{rank}</span>
}

export default function LeaderboardPage() {
  const [rankings, setRankings] = useState<RankEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('user_levels')
        .select('current_xp, total_xp_earned, current_level, profile:profiles(id, full_name, company_name, user_id, current_streak)')
        .order('total_xp_earned', { ascending: false })
        .limit(100)
      const rows = (data as unknown as RawRow[] | null) ?? []
      const mapped: RankEntry[] = rows
        .filter(r => r.profile)
        .map(r => ({
          profileId: r.profile!.id,
          name: r.profile!.full_name?.split(' ')[0] ?? r.profile!.company_name ?? 'ユーザー',
          company: r.profile!.company_name ?? '',
          xp: r.total_xp_earned ?? 0,
          level: r.current_level ?? 1,
          streak: r.profile!.current_streak ?? 0,
          isMe: !!user && r.profile!.user_id === user.id,
        }))
      setRankings(mapped)
      setLoading(false)
    }
    load()
  }, [])

  const myEntry = rankings.find(r => r.isMe)
  const myRank = myEntry ? rankings.indexOf(myEntry) + 1 : null

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl text-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
          🏆
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ランキング</h1>
          <p className="text-gray-500 text-sm">XPを貯めて上位を目指しましょう</p>
        </div>
      </div>

      {/* My rank summary */}
      {myEntry && myRank && (
        <div className="bg-white rounded-2xl p-4 mb-5 shadow-sm border-2 border-orange-200">
          <p className="text-xs text-gray-500 mb-1">あなたの順位（総合XP）</p>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-black text-orange-500">#{myRank}</p>
              <p className="text-xs text-gray-400">順位</p>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="font-bold text-gray-900 text-sm">{myEntry.xp.toLocaleString()}</p>
                <p className="text-xs text-gray-400">総XP</p>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Lv.{myEntry.level}</p>
                <p className="text-xs text-gray-400">レベル</p>
              </div>
              <div>
                <p className="font-bold text-amber-600 text-sm">🔥{myEntry.streak}</p>
                <p className="text-xs text-gray-400">連続日数</p>
              </div>
            </div>
            <Link href="/quiz"
              className="text-xs text-white px-3 py-1.5 rounded-lg font-medium"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
              順位を上げる
            </Link>
          </div>
        </div>
      )}

      {/* Ranking list */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b flex items-center text-xs font-medium text-gray-500">
          <span className="w-12 text-center">順位</span>
          <span className="flex-1">ユーザー</span>
          <span className="w-20 text-right">Lv</span>
          <span className="w-24 text-right">総XP</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">読み込み中...</div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">🏆</p>
            <p className="text-sm font-medium text-gray-600">まだランキングデータがありません</p>
            <p className="text-xs mt-1">問題練習やロープレでXPを貯めましょう</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rankings.map((entry, i) => {
              const rank = i + 1
              return (
                <div key={entry.profileId}
                  className={`flex items-center px-5 py-3.5 transition ${entry.isMe ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                  <div className="w-12 flex justify-center">
                    <RankBadge rank={rank} />
                  </div>
                  <div className="flex-1 flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: entry.isMe ? 'linear-gradient(135deg,#f97316,#ea580c)' : 'linear-gradient(135deg,#94a3b8,#64748b)' }}>
                      {entry.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm truncate ${entry.isMe ? 'text-orange-700' : 'text-gray-800'}`}>
                        {entry.name}
                        {entry.isMe && <span className="ml-1 text-xs bg-orange-200 text-orange-700 px-1.5 rounded">あなた</span>}
                      </p>
                      {entry.company && <p className="text-xs text-gray-400 truncate">{entry.company}</p>}
                    </div>
                    {entry.streak > 7 && (
                      <span className="flex-shrink-0 text-xs bg-amber-50 border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full">
                        🔥{entry.streak}日
                      </span>
                    )}
                  </div>
                  <div className="w-20 text-right">
                    <span className="font-bold text-gray-800 text-sm">Lv.{entry.level}</span>
                  </div>
                  <div className="w-24 text-right">
                    <span className="font-bold text-sm">{entry.xp.toLocaleString()}</span>
                    <span className="text-xs text-gray-400"> XP</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pro plan upsell */}
      <div className="mt-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-4 flex items-center gap-4">
        <div>
          <p className="text-white font-bold text-sm">チームランキングを解放</p>
          <p className="text-white/60 text-xs mt-0.5">Proプランで社内メンバー間のランキングが利用できます</p>
        </div>
        <Link href="/profile"
          className="flex-shrink-0 text-xs text-slate-800 bg-white px-3 py-1.5 rounded-lg font-bold hover:bg-gray-100 transition">
          Proにする
        </Link>
      </div>
    </div>
  )
}
