'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (error) {
      setError('メールの送信に失敗しました。メールアドレスをご確認ください。')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)' }}>
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-2xl">🔥</span>
          <div>
            <span className="font-bold text-gray-900">Grow Alike </span>
            <span className="text-orange-500 font-bold">Sales AI</span>
          </div>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">メールを送信しました</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              <span className="font-semibold text-gray-700">{email}</span> にパスワードリセット用のリンクを送りました。
              メールが届かない場合は迷惑メールフォルダをご確認ください。
            </p>
            <Link href="/login"
              className="inline-block text-orange-500 font-semibold text-sm hover:text-orange-600 transition">
              ← ログイン画面に戻る
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">パスワードをリセット</h1>
            <p className="text-gray-500 text-sm mb-8">
              登録済みのメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-bold py-3.5 rounded-xl transition disabled:opacity-60 text-sm"
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}
              >
                {loading ? '送信中...' : 'リセットメールを送信 →'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              <Link href="/login" className="text-orange-500 font-semibold hover:text-orange-600 transition">
                ← ログイン画面に戻る
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
