'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)' }}>
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-center items-start w-1/2 px-16 py-12">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            🔥
          </div>
          <div>
            <p className="text-white font-bold text-xl leading-tight">Grow Alike</p>
            <p className="text-orange-400 text-sm font-medium">Sales AI</p>
          </div>
        </div>

        <h2 className="text-white text-4xl font-bold leading-snug mb-4">
          AIが<span className="text-orange-400">あなたの営業スキル</span>を<br />
          パーソナライズ学習
        </h2>
        <p className="text-white/50 text-base leading-relaxed max-w-md">
          問題練習・AIロープレ・録音分析を通じて、
          あなたの弱点を特定し、最短で一流の営業パーソンへ。
        </p>

        <div className="mt-12 flex gap-8">
          {[
            { label: 'AIロープレ', value: '無制限', emoji: '🎭' },
            { label: '問題バンク', value: '500問+', emoji: '🧠' },
            { label: '学習者', value: '5,000名', emoji: '👥' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl mb-1">{stat.emoji}</div>
              <div className="text-white font-bold text-xl">{stat.value}</div>
              <div className="text-white/40 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <span className="text-2xl">🔥</span>
            <div>
              <span className="font-bold text-gray-900">Grow Alike </span>
              <span className="text-orange-500 font-bold">Sales AI</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">ログイン</h1>
          <p className="text-gray-500 text-sm mb-8">おかえりなさい！学習を続けましょう 🚀</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition bg-gray-50"
                style={{ '--tw-ring-color': '#f97316' } as React.CSSProperties}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition bg-gray-50"
                placeholder="••••••••"
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
              className="w-full text-white font-bold py-3.5 rounded-xl transition mt-2 disabled:opacity-60 text-sm"
              style={{ background: loading ? '#fb923c' : 'linear-gradient(135deg,#f97316,#ea580c)' }}
            >
              {loading ? 'ログイン中...' : 'ログイン →'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            アカウントをお持ちでない方は{' '}
            <Link href="/register" className="text-orange-500 font-semibold hover:text-orange-600 transition">
              新規登録（無料）
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
