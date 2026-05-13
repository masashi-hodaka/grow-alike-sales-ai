'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Step = 1 | 2 | 3 | 4 | 5

const INDUSTRY_OPTIONS = [
  { value: 'IT_SAAS', label: 'SaaS / IT' },
  { value: 'REAL_ESTATE', label: '不動産' },
  { value: 'FINANCE', label: '金融' },
  { value: 'MEDICAL', label: '医療・製薬' },
  { value: 'MANUFACTURING', label: '製造業' },
  { value: 'HR', label: '人材' },
  { value: 'OTHER', label: 'その他' },
]

const ONBOARDING_MODES = [
  {
    id: 'product',
    emoji: '📦',
    title: '商材を設定して始める',
    desc: '担当商材を登録することで、AIがあなた専用の問題・ロープレを生成します。最もパーソナライズされた学習体験を提供します。',
    badge: 'おすすめ',
    badgeColor: '#f97316',
  },
  {
    id: 'basic',
    emoji: '🧠',
    title: 'まず基礎営業を学ぶ',
    desc: '商材がなくても始められます。普遍的な営業スキル（ヒアリング・提案・クロージング）を基礎から学びましょう。後から商材を追加できます。',
    badge: null,
    badgeColor: '',
  },
]

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOnboarding = searchParams.get('onboarding') === 'true'
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [genMessages, setGenMessages] = useState<string[]>([])
  const [onboardingMode, setOnboardingMode] = useState<'product' | 'basic'>('product')
  const [signedUpUserId, setSignedUpUserId] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // ?onboarding=true の場合：すでにログイン済みなのでStep 1をスキップ
  useEffect(() => {
    if (!isOnboarding) return
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setSignedUpUserId(user.id)
        setStep(2)
      } else {
        router.replace('/login')
      }
    }
    checkSession()
  }, [isOnboarding, router])

  // Step 1: 認証情報
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Step 2: 基本情報
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industryType, setIndustryType] = useState('IT_SAAS')

  // Step 3-商材: 商材情報（簡易版）
  const [productName, setProductName] = useState('')
  const [productDesc, setProductDesc] = useState('')
  const [competitors, setCompetitors] = useState('')
  const [salesMethod, setSalesMethod] = useState('outbound')

  // onboarding=true の場合はStep 1(認証)をスキップするので表示上1少ない
  const totalSteps = onboardingMode === 'product'
    ? (isOnboarding ? 3 : 4)
    : (isOnboarding ? 2 : 3)
  const displayStep = isOnboarding ? step - 1 : step

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      // すでに登録済みの場合：そのままログインしてプロフィール作成へ
      const isAlreadyRegistered =
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already exists') ||
        error.message.toLowerCase().includes('user already')

      if (isAlreadyRegistered) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (!signInError && signInData.user) {
          // ログイン成功 → プロフィールがあればダッシュボードへ、なければ続行
          const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', signInData.user.id).single()
          if (profile) {
            router.push('/dashboard')
            return
          }
          setSignedUpUserId(signInData.user.id)
          setLoading(false)
          setStep(2)
          return
        }
        setError('このメールアドレスはすでに登録されています。パスワードが正しいか確認してください。')
        setLoading(false)
        return
      }

      setError(error.message)
      setLoading(false)
      return
    }

    // signUp 直後にユーザーIDを保持（メール認証の有無に依存しない）
    if (data.user) setSignedUpUserId(data.user.id)

    setLoading(false)
    setStep(2)
  }

  const handleComplete = async () => {
    setLoading(true)
    setError(null)
    setStep(5)

    try {
      const supabase = createClient()
      // getUser() を優先し、失敗時は signUp 時に保存した userId を使う
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id ?? signedUpUserId
      if (!userId) throw new Error('セッションが見つかりません。ページを再読み込みして、再度お試しください。')

      const productProfile = {
        product_name: onboardingMode === 'product' ? productName : '（未設定）',
        unit_price_range: '',
        sales_cycle_days: 60,
        decision_maker: '',
        pain_points: [],
        competitors: competitors.split(',').map(s => s.trim()).filter(Boolean),
        custom_keywords: [],
      }

      // プロフィール作成
      setGenMessages(['プロフィールを作成中...'])
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: fullName || null,
          company_name: companyName || null,
          industry_type: industryType,
          product_profile: productProfile,
          plan: 'beta',
          plan_type: 'pro',
          current_streak: 0,
          longest_streak: 0,
        })
        .select()
        .single()

      if (profileError) throw profileError

      // user_levels作成
      setGenMessages(prev => [...prev, 'レベルシステムを初期化中...'])
      await supabase.from('user_levels').insert({ profile_id: profile.id })

      // usage_stats作成
      const yearMonth = parseInt(new Date().toISOString().slice(0, 7).replace('-', ''))
      await supabase.from('usage_stats').insert({
        profile_id: profile.id,
        year_month: yearMonth,
        remaining_seconds: 1800,
      })

      // 商材設定の場合：productsテーブルに追加
      if (onboardingMode === 'product' && productName) {
        setGenMessages(prev => [...prev, '商材情報を登録中...'])
        await supabase.from('products').insert({
          profile_id: profile.id,
          name: productName,
          description: productDesc || null,
          sales_method: salesMethod,
          competitors: competitors.split(',').map(s => s.trim()).filter(Boolean),
        })
      }

      // スキルカリキュラム生成
      setGenMessages(prev => [...prev, 'AIがスキルマップを生成中...'])
      try {
        const res = await fetch('/api/skills/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile_id: profile.id,
            industry_type: industryType,
            product_profile: productProfile,
          }),
        })
        if (!res.ok) {
          setGenMessages(prev => [...prev, '⚠️ スキル生成をスキップしました（後で自動生成されます）'])
        }
      } catch {
        // スキル生成は失敗してもOK
      }

      setGenMessages(prev => [...prev, '✓ セットアップ完了！ダッシュボードへ移動します...'])
      await new Promise(r => setTimeout(r, 1200))
      router.push('/dashboard')
      router.refresh()

    } catch (err) {
      // PostgrestError や通常の Error どちらにも対応
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'エラーが発生しました'
      setError(msg)
      setLoading(false)
      setStep(onboardingMode === 'product' ? 4 : 3)
    }
  }

  return (
    <div className="min-h-screen flex py-10 px-4"
      style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)' }}>
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg mx-auto h-fit my-auto">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-2xl">🔥</span>
          <div>
            <span className="font-black text-gray-900">Grow Alike </span>
            <span className="text-orange-500 font-black">Sales AI</span>
          </div>
        </div>

        {/* Step indicator */}
        {step < 5 && (
          <div className="mb-6">
            <div className="flex gap-1.5 mb-1.5">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
                  style={{ background: i < displayStep ? 'linear-gradient(90deg,#f97316,#ea580c)' : '#e5e7eb' }} />
              ))}
            </div>
            <p className="text-xs text-gray-400">ステップ {displayStep} / {totalSteps}</p>
          </div>
        )}

        {/* Step 1: Auth */}
        {step === 1 && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">アカウントを作成</h2>
              <p className="text-gray-500 text-sm mt-0.5">無料で始められます。クレジットカード不要。</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">メールアドレス</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                placeholder="email@example.com" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">パスワード（8文字以上）</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                  placeholder="••••••••" />
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
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full text-white font-bold py-3.5 rounded-xl transition disabled:opacity-60 text-sm"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
              {loading ? '作成中...' : '無料で始める →'}
            </button>
            <p className="text-center text-sm text-gray-500">
              すでにアカウントをお持ちの方は{' '}
              <Link href="/login" className="text-orange-500 font-semibold hover:text-orange-600">ログイン</Link>
            </p>
          </form>
        )}

        {/* Step 2: Basic info */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">基本情報を入力</h2>
              <p className="text-gray-500 text-sm mt-0.5">パーソナライズに使用します</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">お名前</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                placeholder="例：山田 太郎" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">会社名</label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                placeholder="株式会社〇〇" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">業界</label>
              <select value={industryType} onChange={e => setIndustryType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50">
                {INDUSTRY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">
                ← 戻る
              </button>
              <button onClick={() => setStep(3)}
                className="flex-1 text-white font-bold py-3 rounded-xl transition"
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                次へ →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Onboarding mode choice */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">どちらで始めますか？</h2>
              <p className="text-gray-500 text-sm mt-0.5">後から変更できます</p>
            </div>
            <div className="space-y-3">
              {ONBOARDING_MODES.map(mode => (
                <button key={mode.id}
                  onClick={() => setOnboardingMode(mode.id as 'product' | 'basic')}
                  className={`w-full border-2 rounded-2xl p-4 text-left transition ${
                    onboardingMode === mode.id ? 'border-orange-400' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={onboardingMode === mode.id ? { background: '#fff7ed' } : {}}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{mode.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold text-sm ${onboardingMode === mode.id ? 'text-orange-700' : 'text-gray-800'}`}>
                          {mode.title}
                        </p>
                        {mode.badge && (
                          <span className="text-xs text-white px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: mode.badgeColor }}>
                            {mode.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{mode.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 flex items-center justify-center ${
                      onboardingMode === mode.id ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                    }`}>
                      {onboardingMode === mode.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">
                ← 戻る
              </button>
              <button onClick={() => onboardingMode === 'product' ? setStep(4) : handleComplete()}
                disabled={loading}
                className="flex-1 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                {loading ? 'セットアップ中...' : onboardingMode === 'product' ? '次へ →' : '学習を始める →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Product info (商材モードのみ) */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">商材情報を入力</h2>
              <p className="text-gray-500 text-sm mt-0.5">AIが専用問題・ロープレを生成します（後でも変更可能）</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">商材名 <span className="text-red-500">*</span></label>
              <input type="text" value={productName} onChange={e => setProductName(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                placeholder="例：クラウド型CRM「SalesHub」" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">商材の説明（自由記述）</label>
              <textarea value={productDesc} onChange={e => setProductDesc(e.target.value)} rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 resize-none"
                placeholder="ターゲット顧客、提供価値、差別化ポイントなどを自由に書いてください。詳しいほどAIの精度が上がります。" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">営業手法</label>
              <div className="flex gap-2">
                {[
                  { id: 'outbound', label: 'アウトバウンド' },
                  { id: 'inbound', label: 'インバウンド' },
                  { id: 'both', label: '両方' },
                ].map(m => (
                  <button key={m.id} onClick={() => setSalesMethod(m.id)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition border ${
                      salesMethod === m.id ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">競合他社（カンマ区切り・任意）</label>
              <input type="text" value={competitors} onChange={e => setCompetitors(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                placeholder="例：Salesforce, HubSpot, kintone" />
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(3)}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">
                ← 戻る
              </button>
              <button onClick={handleComplete} disabled={!productName || loading}
                className="flex-1 text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                {loading ? 'AI生成中...' : 'セットアップ完了 →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: 生成中 */}
        {step === 5 && (
          <div className="text-center py-6">
            {!genMessages.some(m => m.includes('完了')) ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                  <div className="w-10 h-10 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">AIがセットアップ中...</h3>
                <p className="text-gray-500 text-sm">あなた専用の学習環境を準備しています</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">準備完了！🎉</h3>
                <p className="text-gray-500 text-sm">さあ、学習を始めましょう</p>
              </>
            )}
            <div className="mt-4 space-y-1.5 text-sm text-left bg-gray-50 rounded-2xl p-4">
              {genMessages.map((msg, i) => (
                <p key={i} className={`${msg.includes('✓') ? 'text-green-600' : msg.includes('⚠️') ? 'text-amber-600' : 'text-gray-500'}`}>
                  {msg}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
