'use client'

import { useState } from 'react'
import Link from 'next/link'

// ダミーランキングデータ（実装後はSupabaseから取得）
const DUMMY_RANKINGS = {
  overall: [
    { rank: 1, name: '田中 拓也', company: 'TechCorp', xp: 12450, level: 8, streak: 22, growth: '+18%', badge: '🥇', roleplayScore: 89 },
    { rank: 2, name: '佐藤 美咲', company: 'SalesHub', xp: 9800, level: 7, streak: 15, growth: '+25%', badge: '🥈', roleplayScore: 84 },
    { rank: 3, name: '鈴木 健太', company: 'GrowthCo', xp: 8200, level: 6, streak: 30, growth: '+31%', badge: '🥉', roleplayScore: 76 },
    { rank: 4, name: '高橋 由美', company: 'SalesPro', xp: 7600, level: 6, streak: 8, growth: '+12%', badge: '4', roleplayScore: 72 },
    { rank: 5, name: '伊藤 大輔', company: 'MarketInc', xp: 6900, level: 5, streak: 11, growth: '+9%', badge: '5', roleplayScore: 68 },
    { rank: 6, name: 'あなた', company: 'あなたの会社', xp: 1200, level: 3, streak: 5, growth: '+42%', badge: '6', roleplayScore: 74, isMe: true },
  ],
  weekly: [
    { rank: 1, name: 'あなた', company: 'あなたの会社', xp: 420, level: 3, streak: 5, growth: '+42%', badge: '🥇', roleplayScore: 74, isMe: true },
    { rank: 2, name: '佐藤 美咲', company: 'SalesHub', xp: 380, level: 7, streak: 15, growth: '+25%', badge: '🥈', roleplayScore: 84 },
    { rank: 3, name: '山田 翔', company: 'StartX', xp: 310, level: 4, streak: 7, growth: '+38%', badge: '🥉', roleplayScore: 71 },
    { rank: 4, name: '田中 拓也', company: 'TechCorp', xp: 280, level: 8, streak: 22, growth: '+18%', badge: '4', roleplayScore: 89 },
    { rank: 5, name: '中村 恵子', company: 'BizSales', xp: 210, level: 5, streak: 3, growth: '+15%', badge: '5', roleplayScore: 67 },
  ],
  roleplay: [
    { rank: 1, name: '田中 拓也', company: 'TechCorp', xp: 12450, level: 8, streak: 22, growth: '+18%', badge: '🥇', roleplayScore: 94 },
    { rank: 2, name: '佐藤 美咲', company: 'SalesHub', xp: 9800, level: 7, streak: 15, growth: '+25%', badge: '🥈', roleplayScore: 91 },
    { rank: 3, name: 'あなた', company: 'あなたの会社', xp: 1200, level: 3, streak: 5, growth: '+42%', badge: '🥉', roleplayScore: 74, isMe: true },
    { rank: 4, name: '高橋 由美', company: 'SalesPro', xp: 7600, level: 6, streak: 8, growth: '+12%', badge: '4', roleplayScore: 72 },
    { rank: 5, name: '鈴木 健太', company: 'GrowthCo', xp: 8200, level: 6, streak: 30, growth: '+31%', badge: '5', roleplayScore: 70 },
  ],
  growth: [
    { rank: 1, name: '山田 翔', company: 'StartX', xp: 4100, level: 4, streak: 7, growth: '+58%', badge: '🥇', roleplayScore: 71 },
    { rank: 2, name: 'あなた', company: 'あなたの会社', xp: 1200, level: 3, streak: 5, growth: '+42%', badge: '🥈', roleplayScore: 74, isMe: true },
    { rank: 3, name: '佐藤 美咲', company: 'SalesHub', xp: 9800, level: 7, streak: 15, growth: '+25%', badge: '🥉', roleplayScore: 84 },
    { rank: 4, name: '伊藤 大輔', company: 'MarketInc', xp: 6900, level: 5, streak: 11, growth: '+18%', badge: '4', roleplayScore: 68 },
    { rank: 5, name: '田中 拓也', company: 'TechCorp', xp: 12450, level: 8, streak: 22, growth: '+15%', badge: '5', roleplayScore: 89 },
  ],
}

type Tab = 'overall' | 'weekly' | 'roleplay' | 'growth'

const TABS: { id: Tab; label: string; emoji: string; metricLabel: string; metricKey: 'xp' | 'roleplayScore' | 'growth' }[] = [
  { id: 'overall', label: '総合XP', emoji: '⭐', metricLabel: '総XP', metricKey: 'xp' },
  { id: 'weekly', label: '今週', emoji: '📅', metricLabel: '週間XP', metricKey: 'xp' },
  { id: 'roleplay', label: 'ロープレ', emoji: '🎭', metricLabel: '平均スコア', metricKey: 'roleplayScore' },
  { id: 'growth', label: '成長率', emoji: '📈', metricLabel: '成長率', metricKey: 'growth' },
]

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>
  if (rank === 2) return <span className="text-2xl">🥈</span>
  if (rank === 3) return <span className="text-2xl">🥉</span>
  return <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">{rank}</span>
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overall')
  const tab = TABS.find(t => t.id === activeTab)!
  const rankings = DUMMY_RANKINGS[activeTab]
  const myRank = rankings.find(r => r.isMe)

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl text-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
          🏆
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ランキング</h1>
          <p className="text-gray-500 text-sm">ライバルと切磋琢磨して成長しましょう</p>
        </div>
      </div>

      {/* My rank summary */}
      {myRank && (
        <div className="bg-white rounded-2xl p-4 mb-5 shadow-sm border-2 border-orange-200">
          <p className="text-xs text-gray-500 mb-1">あなたの順位（{tab.label}）</p>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-black text-orange-500">#{myRank.rank}</p>
              <p className="text-xs text-gray-400">順位</p>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="font-bold text-gray-900 text-sm">{myRank.xp.toLocaleString()}</p>
                <p className="text-xs text-gray-400">XP</p>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{myRank.roleplayScore}点</p>
                <p className="text-xs text-gray-400">ロープレ</p>
              </div>
              <div>
                <p className="font-bold text-green-600 text-sm">{myRank.growth}</p>
                <p className="text-xs text-gray-400">成長率</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/quiz"
                className="text-xs text-white px-3 py-1.5 rounded-lg font-medium"
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                順位を上げる
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-2 mb-4">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === t.id ? 'text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
            style={activeTab === t.id ? { background: 'linear-gradient(135deg,#f97316,#ea580c)' } : {}}>
            <span>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Ranking list */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 bg-gray-50 border-b flex items-center text-xs font-medium text-gray-500">
          <span className="w-12 text-center">順位</span>
          <span className="flex-1">ユーザー</span>
          <span className="w-20 text-right">Lv</span>
          <span className="w-24 text-right">{tab.metricLabel}</span>
          <span className="w-16 text-right">成長率</span>
        </div>

        <div className="divide-y divide-gray-100">
          {rankings.map(entry => (
            <div key={entry.rank}
              className={`flex items-center px-5 py-3.5 transition ${entry.isMe ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
              <div className="w-12 flex justify-center">
                <RankBadge rank={entry.rank} />
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
                  <p className="text-xs text-gray-400 truncate">{entry.company}</p>
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
                <span className="font-bold text-sm">
                  {activeTab === 'roleplay'
                    ? `${entry.roleplayScore}点`
                    : entry.xp.toLocaleString()}
                </span>
                {activeTab !== 'roleplay' && activeTab !== 'growth' && (
                  <span className="text-xs text-gray-400"> XP</span>
                )}
              </div>
              <div className="w-16 text-right">
                <span className="text-xs font-bold text-green-600">{entry.growth}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pro plan upsell */}
      {activeTab === 'overall' && (
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
      )}
    </div>
  )
}
