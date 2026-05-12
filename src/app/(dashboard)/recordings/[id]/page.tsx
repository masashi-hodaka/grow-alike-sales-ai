import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Recording, AiFeedback, FeedbackScores, IndustryInsights } from '@/types/database'

function scoreColor(score: number) {
  if (score >= 85) return 'text-green-600'
  if (score >= 70) return 'text-indigo-600'
  return 'text-orange-500'
}

function scoreBarColor(score: number) {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default async function RecordingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single()
  if (!profile) redirect('/register')

  const { data: recording } = await supabase
    .from('recordings').select('*').eq('id', id).eq('profile_id', profile.id).single()
  if (!recording) notFound()

  const { data: feedback } = await supabase
    .from('ai_feedbacks').select('*').eq('recording_id', id).single()

  const rec = recording as Recording
  const fb = feedback as AiFeedback | null

  const scoreItems = [
    { label: 'オープニング', key: 'opening' as keyof FeedbackScores },
    { label: 'ヒアリング', key: 'needs_discovery' as keyof FeedbackScores },
    { label: '提案', key: 'proposal' as keyof FeedbackScores },
    { label: '反論対応', key: 'objection_handling' as keyof FeedbackScores },
    { label: 'クロージング', key: 'closing' as keyof FeedbackScores },
  ]

  return (
    <div className="p-8">
      <Link href="/recordings"
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6 transition w-fit">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        録音一覧に戻る
      </Link>

      {/* 処理中の表示 */}
      {rec.status === 'processing' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <p className="text-yellow-700 text-sm font-medium">AIがフィードバックを生成中です。しばらくお待ちください...</p>
        </div>
      )}

      {rec.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700 text-sm font-medium">フィードバックの生成に失敗しました。</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* 左カラム */}
        <div className="col-span-2 space-y-5">
          {/* ヘッダー */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${rec.recording_type === 'roleplay' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                {rec.recording_type === 'roleplay' ? '🎭 ロープレ' : '💼 実商談'}
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              {new Date(rec.recorded_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ·{' '}
              {Math.floor(rec.duration_seconds / 60)}分{rec.duration_seconds % 60}秒
            </p>
          </div>

          {/* スコア詳細 */}
          {fb && (
            <>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-5">スコア詳細</h3>
                <div className="space-y-3">
                  {scoreItems.map(item => {
                    const score = fb.scores[item.key] as number
                    return (
                      <div key={item.key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-bold">{score}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${scoreBarColor(score)} rounded-full transition-all duration-700`}
                            style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t text-sm">
                  <div className="text-center">
                    <p className="text-gray-400 text-xs mb-1">発話割合</p>
                    <p className="font-bold text-gray-900">{fb.scores.talk_ratio_percent}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-xs mb-1">フィラーワード</p>
                    <p className={`font-bold ${fb.scores.filler_word_count > 10 ? 'text-orange-500' : 'text-gray-900'}`}>
                      {fb.scores.filler_word_count}回
                    </p>
                  </div>
                </div>
              </div>

              {/* 良かった点・改善点 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                    <span>✅</span> 良かった点
                  </h3>
                  <ul className="space-y-2">
                    {fb.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                        <span className="text-gray-700">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-orange-600 mb-3 flex items-center gap-2">
                    <span>💡</span> 改善ポイント
                  </h3>
                  <ul className="space-y-2">
                    {fb.improvements.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-orange-500 mt-0.5 flex-shrink-0">→</span>
                        <span className="text-gray-700">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 業界インサイト */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-200 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
                  <span>🏢</span> 業界特有のアドバイス
                </h3>
                <p className="text-indigo-700 text-sm leading-relaxed mb-3">
                  {(fb.industry_insights as IndustryInsights).custom_comments}
                </p>
                <div className="flex flex-wrap gap-4">
                  {(fb.industry_insights as IndustryInsights).used_effective_keywords?.length > 0 && (
                    <div>
                      <p className="text-xs text-indigo-500 mb-1">使えていたキーワード</p>
                      <div className="flex flex-wrap gap-1">
                        {(fb.industry_insights as IndustryInsights).used_effective_keywords.map((k, i) => (
                          <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(fb.industry_insights as IndustryInsights).missed_keywords?.length > 0 && (
                    <div>
                      <p className="text-xs text-red-400 mb-1">使えていなかったキーワード</p>
                      <div className="flex flex-wrap gap-1">
                        {(fb.industry_insights as IndustryInsights).missed_keywords.map((k, i) => (
                          <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">{k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 文字起こし */}
              {fb.transcript_text && (
                <details className="bg-white rounded-2xl p-5 shadow-sm">
                  <summary className="font-bold text-gray-900 cursor-pointer select-none">
                    📝 文字起こし
                  </summary>
                  <div className="mt-4 text-sm text-gray-600 leading-relaxed border-t pt-4 whitespace-pre-wrap">
                    {fb.transcript_text}
                  </div>
                </details>
              )}
            </>
          )}

          {!fb && rec.status === 'uploaded' && (
            <div className="bg-white rounded-2xl p-10 shadow-sm text-center text-gray-400">
              <p className="text-3xl mb-2">⏳</p>
              <p className="font-medium">フィードバックの生成をお待ちください</p>
            </div>
          )}
        </div>

        {/* 右カラム */}
        <div className="space-y-4">
          {/* 総合スコア */}
          {fb && (
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <p className="text-gray-500 text-sm mb-3">総合スコア</p>
              <div className="relative inline-block">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="55" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                  <circle cx="70" cy="70" r="55" fill="none" stroke="#6366f1" strokeWidth="12"
                    strokeDasharray="345.6"
                    strokeDashoffset={345.6 - (fb.scores.overall / 100) * 345.6}
                    strokeLinecap="round" transform="rotate(-90 70 70)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-black ${scoreColor(fb.scores.overall)}`}>
                    {fb.scores.overall}
                  </span>
                  <span className="text-xs text-gray-500">/ 100</span>
                </div>
              </div>
              <p className="text-indigo-600 font-semibold text-sm mt-2">+50 XP 獲得</p>
            </div>
          )}

          {/* 業界スコア */}
          {fb && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-bold text-gray-700 mb-2">業界適合スコア</p>
              <p className={`text-3xl font-black ${scoreColor((fb.industry_insights as IndustryInsights).industry_specific_score)}`}>
                {(fb.industry_insights as IndustryInsights).industry_specific_score}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
