'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RecordingType } from '@/types/database'

type RecState = 'idle' | 'recording' | 'done' | 'uploading'

export default function NewRecordingPage() {
  const router = useRouter()
  const [recType, setRecType] = useState<RecordingType>('roleplay')
  const [recState, setRecState] = useState<RecState>('idle')
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const blobRef = useRef<Blob | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startRecording = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        blobRef.current = blob
        stream.getTracks().forEach(t => t.stop())
        setRecState('done')
      }

      mediaRecorder.start(1000)
      setSeconds(0)
      setRecState('recording')

      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1)
      }, 1000)
    } catch {
      setError('マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。')
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const uploadRecording = async () => {
    if (!blobRef.current) return
    setRecState('uploading')
    setStatusMsg('Supabaseにアップロード中...')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未ログイン')

      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single()
      if (!profile) throw new Error('プロフィールが見つかりません')

      // ファイルアップロード
      const fileName = `${profile.id}/${crypto.randomUUID()}.webm`
      const { error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(fileName, blobRef.current, { contentType: 'audio/webm' })
      if (uploadError) throw uploadError

      // DBに録音レコード作成
      const { data: recording, error: recError } = await supabase
        .from('recordings')
        .insert({
          profile_id: profile.id,
          storage_path: fileName,
          duration_seconds: seconds,
          recording_type: recType,
          recorded_at: new Date().toISOString(),
          status: 'uploaded',
        })
        .select()
        .single()
      if (recError) throw recError

      // usage_stats更新
      const yearMonth = parseInt(new Date().toISOString().slice(0, 7).replace('-', ''))
      try {
        await supabase.rpc('update_usage_stats', {
          p_profile_id: profile.id,
          p_year_month: yearMonth,
          p_seconds: seconds,
        })
      } catch {
        // RPCが未定義でも続行
      }

      setStatusMsg('AIがフィードバックを生成中...')

      // フィードバック生成API呼び出し（非同期）
      fetch('/api/recordings/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recording_id: recording.id, profile_id: profile.id }),
      })

      setStatusMsg('完了！フィードバックページへ移動します...')
      await new Promise(r => setTimeout(r, 1500))
      router.push(`/recordings/${recording.id}`)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました')
      setRecState('done')
    }
  }

  const formatTime = (s: number) => {
    const m = String(Math.floor(s / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    return `${m}:${sec}`
  }

  return (
    <div className="p-8">
      <Link href="/recordings"
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6 transition w-fit">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        録音一覧に戻る
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">新しい録音</h1>

      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          {/* 録音タイプ選択 */}
          {recState === 'idle' && (
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 block mb-2">録音タイプ</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setRecType('roleplay')}
                  className={`border-2 rounded-xl p-4 text-center transition ${recType === 'roleplay' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-2xl mb-1">🎭</div>
                  <p className={`font-semibold text-sm ${recType === 'roleplay' ? 'text-indigo-700' : 'text-gray-700'}`}>ロープレ</p>
                  <p className="text-xs text-gray-500 mt-0.5">練習・シミュレーション</p>
                </button>
                <button onClick={() => setRecType('real_deal')}
                  className={`border-2 rounded-xl p-4 text-center transition ${recType === 'real_deal' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-2xl mb-1">💼</div>
                  <p className={`font-semibold text-sm ${recType === 'real_deal' ? 'text-orange-700' : 'text-gray-700'}`}>実商談</p>
                  <p className="text-xs text-gray-500 mt-0.5">本番の商談録音</p>
                </button>
              </div>
            </div>
          )}

          {/* 録音UI */}
          <div className="text-center py-6">
            {recState === 'idle' && (
              <>
                <button onClick={startRecording}
                  className="w-24 h-24 rounded-full bg-red-50 hover:bg-red-100 transition flex items-center justify-center mx-auto cursor-pointer">
                  <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2z" />
                  </svg>
                </button>
                <p className="text-gray-600 mt-4 font-medium">タップして録音開始</p>
              </>
            )}

            {recState === 'recording' && (
              <>
                <div className="relative inline-flex items-center justify-center mb-4">
                  <div className="absolute w-28 h-28 rounded-full bg-red-200 animate-ping opacity-75" />
                  <button onClick={stopRecording}
                    className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 transition flex items-center justify-center relative z-10">
                    <div className="w-8 h-8 bg-white rounded-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                  <span className="font-mono text-xl font-bold text-gray-800">{formatTime(seconds)}</span>
                </div>
                <p className="text-gray-500 text-sm">録音中... タップして停止</p>
              </>
            )}

            {recState === 'done' && (
              <>
                <div className="w-24 h-24 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-bold text-gray-800 text-lg mb-1">録音完了！</p>
                <p className="text-gray-500 text-sm mb-6">
                  {Math.floor(seconds / 60)}分{seconds % 60}秒
                </p>
                <div className="flex gap-3">
                  <button onClick={() => { setRecState('idle'); setSeconds(0) }}
                    className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition text-sm">
                    やり直す
                  </button>
                  <button onClick={uploadRecording}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition text-sm">
                    AIフィードバックを受け取る
                  </button>
                </div>
              </>
            )}

            {recState === 'uploading' && (
              <>
                <div className="w-16 h-16 mx-auto mb-4">
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                </div>
                <p className="font-medium text-gray-800 mb-2">処理中...</p>
                <p className="text-sm text-gray-500">{statusMsg}</p>
              </>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mt-4">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
