import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserMissionProgress, Mission } from '@/types/database'

// ダミー追加ミッション（スト リーク・弱点・AI推薦）
const DUMMY_AI_MISSIONS = [
  {
    id: 'ai-1',
    title: '弱点克服チャレンジ',
    description: 'AIが検出した弱点カテゴリ「ヒアリング」の問題を5問正解する',
    type: 'ai_recommended',
    emoji: '🎯',
    xp: 120,
    progress: 2,
    target: 5,
    link: '/quiz?category=hearing&weak=true',
    color: '#ef4444',
  },
  {
    id: 'ai-2',
    title: 'ロープレ連続達成',
    description: '今週中にAIロープレを3回完了する',
    type: 'ai_recommended',
    emoji: '🎭',
    xp: 200,
    progress: 1,
    target: 3,
    link: '/roleplay',
    color: '#8b5cf6',
  },
]

const STREAK_MILESTONES = [
  { days: 3,  reward: '50 XP',  emoji: '🌱', achieved: true },
  { days: 7,  reward: '150 XP', emoji: '🔥', achieved: false },
  { days: 14, reward: '400 XP', emoji: '⚡', achieved: false },
  { days: 30, reward: '1000 XP',emoji: '👑', achieved: false },
]

export default async function MissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
  if (!profile) redirect('/register')

  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay() + 1)
  const dailyKey = today.toISOString().slice(0, 10)
  const weeklyKey = weekStart.toISOString().slice(0, 10)

  const { data: allMissions } = await supabase.from('missions').select('*').eq('is_active', true)
  const { data: progresses } = await supabase.from('user_mission_progress').select('*').eq('profile_id', profile.id)

  const getProgress = (missionId: string, periodKey: string) =>
    progresses?.find(p => p.mission_id === missionId && p.period_key === periodKey) ?? null

  const dailyMissions = (allMissions ?? []).filter(m => m.mission_type === 'daily')
  const weeklyMissions = (allMissions ?? []).filter(m => m.mission_type === 'weekly')
  const challengeMissions = (allMissions ?? []).filter(m => m.mission_type === 'challenge')

  const streak = (profile as unknown as { current_streak?: number }).current_streak ?? 5

  // 今日のミッション完了数
  const todayCompleted = dailyMissions.filter(m => getProgress(m.id, dailyKey)?.is_completed).length
  const totalXpToday = dailyMissions
    .filter(m => getProgress(m.id, dailyKey)?.is_completed)
    .reduce((sum, m) => sum + m.xp_reward, 0)

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl text-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
          🎯
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ミッション</h1>
          <p className="text-gray-500 text-sm">毎日の積み重ねがスキルを伸ばします</p>
        </div>
      </div>

      {/* 今日の進捗バナー */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-5 mb-6 flex items-center gap-6">
        <div className="text-center">
          <p className="text-white/50 text-xs mb-0.5">今日の進捗</p>
          <p className="text-white font-black text-3xl">{todayCompleted}<span className="text-white/50 text-lg font-normal">/{dailyMissions.length}</span></p>
          <p className="text-white/50 text-xs">完了</p>
        </div>
        <div className="w-px h-12 bg-white/10" />
        <div className="text-center">
          <p className="text-white/50 text-xs mb-0.5">今日の獲得XP</p>
          <p className="text-orange-400 font-black text-3xl">+{totalXpToday}</p>
          <p className="text-white/50 text-xs">XP</p>
        </div>
        <div className="w-px h-12 bg-white/10" />
        <div className="text-center">
          <p className="text-white/50 text-xs mb-0.5">連続学習</p>
          <p className="text-amber-400 font-black text-3xl">🔥{streak}</p>
          <p className="text-white/50 text-xs">日</p>
        </div>
        <div className="flex-1">
          <p className="text-white/60 text-xs mb-1.5">今日の達成度</p>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{
                width: dailyMissions.length > 0 ? `${(todayCompleted / dailyMissions.length) * 100}%` : '0%',
                background: 'linear-gradient(90deg,#f97316,#fbbf24)',
              }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Main missions */}
        <div className="col-span-2 space-y-5">

          {/* AI推薦ミッション */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🤖</span>
              <h2 className="font-bold text-gray-900">AIおすすめミッション</h2>
              <span className="ml-auto text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">あなた専用</span>
            </div>
            <div className="space-y-3">
              {DUMMY_AI_MISSIONS.map(m => {
                const pct = Math.min(100, Math.round((m.progress / m.target) * 100))
                return (
                  <div key={m.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white transition">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-xl">{m.emoji}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-sm text-gray-800">{m.title}</p>
                          <span className="font-bold text-sm ml-2 whitespace-nowrap" style={{ color: m.color }}>+{m.xp} XP</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: m.color }} />
                      </div>
                      <span className="text-xs text-gray-500">{m.progress}/{m.target}</span>
                      <Link href={m.link}
                        className="text-xs text-white px-3 py-1 rounded-lg font-medium whitespace-nowrap"
                        style={{ background: m.color }}>
                        挑戦する
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* デイリーミッション */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🌅</span>
              <h2 className="font-bold text-gray-900">デイリーミッション</h2>
              <span className="text-xs text-gray-400 ml-1">毎日リセット</span>
              <span className="ml-auto text-xs text-gray-500">{todayCompleted}/{dailyMissions.length} 完了</span>
            </div>
            {dailyMissions.length > 0 ? (
              <div className="space-y-3">
                {dailyMissions.map(mission => {
                  const progress = getProgress(mission.id, dailyKey)
                  const current = progress?.current_value ?? 0
                  const target = (mission as Mission).condition?.threshold ?? 1
                  const pct = Math.min(100, Math.round((current / target) * 100))
                  const completed = progress?.is_completed ?? false
                  const claimed = progress?.xp_claimed ?? false
                  return (
                    <div key={mission.id}
                      className={`rounded-xl p-4 border transition ${completed ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                      <div className="flex items-start gap-3 mb-2">
                        <span className="text-xl">{completed ? '✅' : '⭕'}</span>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className={`font-semibold text-sm ${completed ? 'text-green-800' : 'text-gray-800'}`}>
                              {mission.title}
                            </p>
                            <span className="font-bold text-sm text-orange-500 ml-2">+{mission.xp_reward} XP</span>
                          </div>
                          {mission.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{mission.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${completed ? 'bg-green-500' : ''}`}
                            style={!completed ? { width: `${pct}%`, background: 'linear-gradient(90deg,#f97316,#fbbf24)' } : { width: '100%' }} />
                        </div>
                        <span className="text-xs text-gray-500">{current}/{target}</span>
                      </div>
                      {completed && !claimed && (
                        <button className="mt-2 w-full text-xs py-1.5 rounded-lg font-bold text-white transition hover:opacity-90"
                          style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                          🎁 XPを受け取る
                        </button>
                      )}
                      {completed && claimed && (
                        <p className="mt-1 text-xs text-green-600 text-center font-medium">✓ 受け取り済み</p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-2xl mb-1">🌅</p>
                <p className="text-sm">今日のデイリーミッションを準備中...</p>
              </div>
            )}
          </div>

          {/* ウィークリーミッション */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📅</span>
              <h2 className="font-bold text-gray-900">ウィークリーミッション</h2>
              <span className="text-xs text-gray-400 ml-1">毎週月曜リセット</span>
            </div>
            {weeklyMissions.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {weeklyMissions.map(mission => {
                  const progress = getProgress(mission.id, weeklyKey)
                  const current = progress?.current_value ?? 0
                  const target = (mission as Mission).condition?.threshold ?? 1
                  const pct = Math.min(100, Math.round((current / target) * 100))
                  const completed = progress?.is_completed ?? false
                  return (
                    <div key={mission.id}
                      className={`rounded-xl p-4 border ${completed ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-sm text-gray-800 flex-1">{mission.title}</p>
                        <span className="font-bold text-sm text-orange-500 ml-1 whitespace-nowrap">+{mission.xp_reward}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: completed ? '#22c55e' : 'linear-gradient(90deg,#f97316,#fbbf24)' }} />
                        </div>
                        <span className="text-xs text-gray-500">{current}/{target}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">ウィークリーミッションなし</p>
            )}
          </div>
        </div>

        {/* Right: Streak + Challenge */}
        <div className="space-y-4">
          {/* Streak card */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white">
            <p className="text-white/70 text-sm mb-1">連続学習ストリーク</p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-4xl">🔥</span>
              <p className="text-5xl font-black">{streak}</p>
              <p className="text-white/70 text-sm self-end pb-1">日</p>
            </div>
            <p className="text-white/80 text-xs">次のマイルストーンまで {7 - (streak % 7)} 日</p>
            <div className="mt-3 flex gap-1">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`flex-1 h-2 rounded-full ${i < (streak % 7) ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
          </div>

          {/* Streak milestones */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">ストリーク報酬</h3>
            <div className="space-y-2.5">
              {STREAK_MILESTONES.map(m => (
                <div key={m.days}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl transition ${m.achieved ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                  <span className="text-xl">{m.emoji}</span>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${m.achieved ? 'text-amber-700' : 'text-gray-600'}`}>
                      {m.days}日連続
                    </p>
                    <p className={`text-xs ${m.achieved ? 'text-amber-500' : 'text-gray-400'}`}>{m.reward}</p>
                  </div>
                  {m.achieved ? (
                    <span className="text-amber-500 text-sm font-bold">✓</span>
                  ) : (
                    <span className="text-xs text-gray-400">Lv{streak}/{m.days}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Challenge missions */}
          {challengeMissions.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⚡</span>
                <h3 className="font-bold text-gray-800 text-sm">チャレンジ</h3>
              </div>
              <div className="space-y-3">
                {challengeMissions.map(mission => {
                  const progress = getProgress(mission.id, 'challenge')
                  const current = progress?.current_value ?? 0
                  const target = (mission as Mission).condition?.threshold ?? 1
                  const pct = Math.min(100, Math.round((current / target) * 100))
                  return (
                    <div key={mission.id} className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                      <p className="font-semibold text-xs text-purple-800 mb-1">{mission.title}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-purple-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-purple-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-purple-600">{current}/{target}</span>
                      </div>
                      <p className="text-xs text-purple-600 font-bold mt-1">+{mission.xp_reward} XP</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quick action */}
          <div className="space-y-2">
            <Link href="/quiz"
              className="flex items-center gap-2 p-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
              <span>🧠</span> 問題を解いてXP獲得
            </Link>
            <Link href="/roleplay"
              className="flex items-center gap-2 p-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition"
              style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
              <span>🎭</span> AIロープレで実践
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
