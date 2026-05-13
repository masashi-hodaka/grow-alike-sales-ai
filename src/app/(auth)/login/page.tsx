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
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません')
      setLoading(false)
      return
    }

    // プロフィールが未作成の場合はオンボーディングへ
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', data.user.id)
        .single()

      if (!profile) {
        router.push('/register?onboarding=true')
        return
      }
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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition bg-gray-50"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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
