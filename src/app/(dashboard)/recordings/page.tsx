import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Recording, AiFeedback } from '@/types/database'

function scoreColor(score: number) {
  if (score >= 85) return 'text-green-600'
  if (score >= 70) return 'text-indigo-600'
  return 'text-orange-500'
}

export default async function RecordingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single()
  if (!profile) redirect('/register')

  const { data: recordings } = await supabase
    .from('recordings')
    .select('*, ai_feedbacks(scores)')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">録音一覧</h1>
          <p className="text-gray-500 text-sm mt-1">過去の商談・ロープレを確認</p>
        </div>
        <Link href="/recordings/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新しい録音
        </Link>
      </div>

      {recordings && recordings.length > 0 ? (
        <div className="space-y-3">
          {(recordings as (Recording & { ai_feedbacks: { scores: { overall: number } }[] })[]).map(rec => {
            const score = rec.ai_feedbacks?.[0]?.scores?.overall ?? null
            return (
              <Link key={rec.id} href={`/recordings/${rec.id}`}
                className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition block">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${rec.recording_type === 'roleplay' ? 'bg-indigo-100' : 'bg-orange-100'}`}>
                  {rec.recording_type === 'roleplay' ? '🎭' : '💼'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rec.recording_type === 'roleplay' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                      {rec.recording_type === 'roleplay' ? 'ロープレ' : '実商談'}
                    </span>
                    {rec.status === 'processing' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">分析中...</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(rec.recorded_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })} ·{' '}
                    {Math.floor(rec.duration_seconds / 60)}分{rec.duration_seconds % 60}秒
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {score !== null ? (
                    <div className="text-center">
                      <p className={`text-2xl font-black ${scoreColor(score)}`}>{score}</p>
                      <p className="text-xs text-gray-400">総合</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-gray-400">{rec.status === 'processing' ? '分析中' : '—'}</p>
                    </div>
                  )}
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-16 shadow-sm text-center">
          <p className="text-5xl mb-4">🎙️</p>
          <h3 className="text-xl font-bold text-gray-900 mb-2">まだ録音がありません</h3>
          <p className="text-gray-500 text-sm mb-6">最初の録音を始めてAIフィードバックを受け取りましょう</p>
          <Link href="/recordings/new"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition">
            録音を始める
          </Link>
        </div>
      )}
    </div>
  )
}
