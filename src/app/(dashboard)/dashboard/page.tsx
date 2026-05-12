import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserLevel, UsageStats, UserMissionProgress, Recording } from '@/types/database'

const LEVEL_THRESHOLDS = [
  0, 200, 450, 750, 1100, 1500, 2000, 2600, 3300, 4100, 5000,
  6200, 7600, 9200, 11000, 13000, 15500, 18500, 22000, 26000,
]

function getXpProgress(level: number, currentXp: number) {
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? (currentThreshold + 5000)
  return Math.min(100, Math.round(((currentXp - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
}

// ダミー弱点データ（実装後はDBから取得）
const DUMMY_WEAK_CATEGORIES = [
  { name: 'ヒアリング', score: 52, color: '#ef4444' },
  { name: 'クロージング', score: 61, color: '#f97316' },
  { name: '反論処理', score: 67, color: '#f59e0b' },
]

const DUMMY_AI_COMMENT =
  '先週と比べてオープニングのスコアが+8点改善しました！ ただ、ヒアリングフェーズで質問が表面的になる傾向があります。「なぜ？」を3回繰り返す深掘り練習を試してみましょう。'

const QUICK_ACTIONS = [
  {
    href: '/quiz',
    emoji: '🧠',
    label: '問題練習',
    sublabel: '弱点カテゴリに挑戦',
    gradient: 'linear-gradient(135deg,#f97316,#ea580c)',
  },
  {
    href: '/roleplay',
    emoji: '🎭',
    label: 'AIロープレ',
    sublabel: '実践シミュレーション',
    gradient: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  },
  {
    href: '/recordings/new',
    emoji: '🎙️',
    label: '録音分析',
    sublabel: 'ロープレ・実商談',
    gradient: 'linear-gradient(135deg,#06b6d4,#0891b2)',
  },
]

function scoreColor(score: number) {
  if (score >= 85) return '#22c55e'
  if (score >= 70) return '#f97316'
  return '#ef4444'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
  if (!profile) redirect('/register')

  const [
    { data: userLevel },
    { data: usageStats },
    { data: missions },
    { data: recentRecordings },
  ] = await Promise.all([
    supabase.from('user_levels').select('*').eq('profile_id', profile.id).single(),
    supabase.from('usage_stats').select('*').eq('profile_id', profile.id).order('year_month', { ascending: false }).limit(1).single(),
    supabase.from('user_mission_progress').select('*, mission:missions(*)').eq('profile_id', profile.id).eq('is_completed', false).limit(3),
    supabase.from('recordings').select('*, ai_feedbacks(scores)').eq('profile_id', profile.id).eq('status', 'completed').order('created_at', { ascending: false }).limit(3),
  ])

  const level = (userLevel as UserLevel | null)?.current_level ?? 1
  const currentXp = (userLevel as UserLevel | null)?.current_xp ?? 0
  const totalXp = (userLevel as UserLevel | null)?.total_xp_earned ?? 0
  const xpProgress = getXpProgress(level, currentXp)
  const xpToNext = (LEVEL_THRESHOLDS[level] ?? 0) - currentXp
  const streak = profile.current_streak ?? 3  // dummy fallback
  const recordingCount = (usageStats as UsageStats | null)?.recording_count ?? 0

  const firstName = profile.full_name?.split(' ')[0] ?? profile.company_name ?? 'あなた'

  return (
    <div className="p-6 max-w-5xl">

      {/* Beta Banner */}
      <div className="mb-5 rounded-2xl px-5 py-3.5 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
        <div className="flex items-center gap-3">
          <span className="bg-white text-sky-600 text-xs font-black px-2.5 py-1 rounded-full tracking-wide">BETA</span>
          <div>
            <p className="text-white font-bold text-sm">ベータ版 — 全機能を無料でお試しいただけます</p>
            <p className="text-sky-200 text-xs">フィードバックをお待ちしています。気になった点はいつでもお知らせください。</p>
          </div>
        </div>
        <a href="mailto:masashi-hodaka@grow-alike.com?subject=Grow Alike Sales AI フィードバック"
          className="flex-shrink-0 bg-white text-sky-600 text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-sky-50 transition">
          フィードバック送る
        </a>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            おかえり、{firstName}さん 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            今日も一緒に成長しましょう ·{' '}
            <span className="text-orange-500 font-semibold">🔥 {streak}日連続学習中</span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-orange-600 font-bold text-lg leading-none">{streak}</p>
            <p className="text-orange-400 text-xs">日連続</p>
          </div>
        </div>
      </div>

      {/* Level + XP Banner */}
      <div className="rounded-2xl p-5 mb-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#1e293b 0%,#334155 100%)' }}>
        {/* decorative */}
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#f97316,transparent)', transform: 'translate(30%,-30%)' }} />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black text-white"
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                {level}
              </div>
              <p className="text-white/50 text-xs mt-1">Level</p>
            </div>
            <div>
              <p className="text-white/70 text-sm mb-0.5">現在 {currentXp.toLocaleString()} XP</p>
              <div className="w-52 h-3 bg-white/15 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${xpProgress}%`, background: 'linear-gradient(90deg,#f97316,#fbbf24)' }} />
              </div>
              <p className="text-white/40 text-xs mt-1">Lv.{level + 1} まで {xpToNext > 0 ? xpToNext.toLocaleString() : 0} XP</p>
            </div>
          </div>

          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold">{totalXp.toLocaleString()}</p>
              <p className="text-white/40 text-xs">総獲得XP</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{recordingCount}</p>
              <p className="text-white/40 text-xs">録音本数</p>
            </div>
            <div>
              <p className="text-2xl font-bold">+12%</p>
              <p className="text-white/40 text-xs">週間成長率</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {QUICK_ACTIONS.map(action => (
          <Link key={action.href} href={action.href}
            className="rounded-xl p-4 text-white flex items-center gap-3 transition hover:opacity-90 card-hover"
            style={{ background: action.gradient }}>
            <span className="text-2xl">{action.emoji}</span>
            <div>
              <p className="font-bold text-sm">{action.label}</p>
              <p className="text-white/70 text-xs">{action.sublabel}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left col: AI Coach + Weakness */}
        <div className="col-span-2 space-y-4">

          {/* AI Coach Comment */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full text-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                🤖
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">AIコーチからのアドバイス</p>
                <p className="text-gray-400 text-xs">あなたの学習パターンを分析しました</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed bg-orange-50 rounded-xl p-3">
              {DUMMY_AI_COMMENT}
            </p>
            <div className="flex gap-2 mt-3">
              <Link href="/quiz?category=hearing"
                className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-orange-600 transition">
                ヒアリング練習へ
              </Link>
              <Link href="/roleplay"
                className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 transition">
                ロープレで実践
              </Link>
            </div>
          </div>

          {/* Weakness Analysis */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">弱点分析</h2>
              <Link href="/skills" className="text-orange-500 text-sm hover:text-orange-600">詳細を見る →</Link>
            </div>
            <div className="space-y-3">
              {DUMMY_WEAK_CATEGORIES.map(cat => (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{cat.name}</span>
                    <span className="font-bold" style={{ color: cat.color }}>{cat.score}点</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${cat.score}%`, background: cat.color }} />
                  </div>
                </div>
              ))}
            </div>
            <Link href="/quiz?weak=true"
              className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-orange-600 border border-orange-200 hover:bg-orange-50 transition flex items-center justify-center gap-1">
              弱点カテゴリの問題を解く ✨
            </Link>
          </div>

          {/* Recent Recordings */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">最近のフィードバック</h2>
              <Link href="/recordings" className="text-orange-500 text-sm hover:text-orange-600">もっと見る →</Link>
            </div>
            {recentRecordings && recentRecordings.length > 0 ? (
              <div className="space-y-2">
                {(recentRecordings as (Recording & { ai_feedbacks: { scores: { overall: number } }[] })[]).map(rec => {
                  const score = rec.ai_feedbacks?.[0]?.scores?.overall ?? null
                  return (
                    <Link key={rec.id} href={`/recordings/${rec.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${rec.recording_type === 'roleplay' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                        {rec.recording_type === 'roleplay' ? '🎭' : '💼'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {rec.recording_type === 'roleplay' ? 'ロープレ録音' : '実商談録音'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(rec.recorded_at).toLocaleDateString('ja-JP')} · {Math.floor(rec.duration_seconds / 60)}分
                        </p>
                      </div>
                      {score !== null && (
                        <div className="text-right">
                          <span className="text-lg font-bold" style={{ color: scoreColor(score) }}>{score}</span>
                          <p className="text-xs text-gray-400">点</p>
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-3xl mb-2">🎙️</p>
                <p className="text-sm font-medium text-gray-600">まだ録音がありません</p>
                <Link href="/recordings/new"
                  className="inline-block mt-3 text-xs bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition">
                  最初の録音を始める
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right col: Missions */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900">ミッション</h2>
              <Link href="/missions" className="text-orange-500 text-xs hover:text-orange-600">すべて</Link>
            </div>
            {missions && missions.length > 0 ? (
              <div className="space-y-3">
                {(missions as UserMissionProgress[]).map(mp => {
                  const threshold = mp.mission?.condition?.threshold ?? 1
                  const progress = Math.min(100, Math.round((mp.current_value / threshold) * 100))
                  return (
                    <div key={mp.id} className="p-3 rounded-xl bg-gray-50">
                      <div className="flex justify-between items-start mb-1.5">
                        <p className="text-xs font-semibold text-gray-700 leading-tight">{mp.mission?.title}</p>
                        <span className="text-xs font-bold text-orange-500 whitespace-nowrap ml-1">+{mp.mission?.xp_reward}XP</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#f97316,#fbbf24)' }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{mp.current_value} / {threshold}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-2xl mb-1">🎯</p>
                <p className="text-xs">ミッションがありません</p>
              </div>
            )}
          </div>

          {/* Ranking preview */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900">ランキング</h2>
              <Link href="/leaderboard" className="text-orange-500 text-xs hover:text-orange-600">すべて</Link>
            </div>
            <div className="space-y-2">
              {[
                { rank: 1, name: '田中 拓也', xp: 4200, emoji: '🥇' },
                { rank: 2, name: '佐藤 美咲', xp: 3800, emoji: '🥈' },
                { rank: 3, name: firstName, xp: currentXp, emoji: '🥉', isMe: true },
              ].map(r => (
                <div key={r.rank} className={`flex items-center gap-2.5 p-2 rounded-xl text-sm ${r.isMe ? 'bg-orange-50 border border-orange-200' : ''}`}>
                  <span className="text-lg">{r.emoji}</span>
                  <span className={`flex-1 font-medium truncate ${r.isMe ? 'text-orange-700' : 'text-gray-700'}`}>{r.name}</span>
                  <span className={`text-xs font-bold ${r.isMe ? 'text-orange-600' : 'text-gray-500'}`}>{r.xp.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan info */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
            <p className="font-bold text-sm mb-1">Freeプラン</p>
            <p className="text-white/80 text-xs mb-3">Standardにアップグレードして無制限ロープレ＆AIコーチを解放！</p>
            <Link href="/profile"
              className="block text-center bg-white text-orange-600 font-bold text-xs py-2 rounded-xl hover:bg-orange-50 transition">
              アップグレード →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
