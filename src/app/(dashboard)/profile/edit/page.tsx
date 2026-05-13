'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const INDUSTRY_OPTIONS = [
  { value: 'IT_SAAS', label: 'SaaS / IT' },
  { value: 'REAL_ESTATE', label: '不動産' },
  { value: 'FINANCE', label: '金融' },
  { value: 'MEDICAL', label: '医療・製薬' },
  { value: 'MANUFACTURING', label: '製造業' },
  { value: 'HR', label: '人材' },
  { value: 'OTHER', label: 'その他' },
]

export default function ProfileEditPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industryType, setIndustryType] = useState('IT_SAAS')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, industry_type')
        .eq('user_id', user.id)
        .single()

      if (!profile) { router.push('/register?onboarding=true'); return }

      setProfileId(profile.id)
      setFullName(profile.full_name ?? '')
      setCompanyName(profile.company_name ?? '')
      setIndustryType(profile.industry_type ?? 'IT_SAAS')
      setLoading(false)
    }
    load()
  }, [router])

  const handleSave = async () => {
    if (!profileId) return
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName || null,
          company_name: companyName || null,
          industry_type: industryType,
        })
        .eq('id', profileId)

      if (updateError) throw updateError
      router.push('/profile')
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : '保存に失敗しました'
      setError(msg)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="text-gray-400 text-sm">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-lg">
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-5">
        <Link href="/profile" className="hover:text-gray-700">プロフィール</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">編集</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">プロフィールを編集</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">お名前</label>
          <input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="例：田中 太郎"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">会社名</label>
          <input
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="例：株式会社〇〇"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">業種</label>
          <div className="grid grid-cols-2 gap-2">
            {INDUSTRY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setIndustryType(opt.value)}
                className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition text-left ${
                  industryType === opt.value
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-orange-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Link href="/profile"
          className="flex-1 text-center border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">
          キャンセル
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 text-white py-3 rounded-xl font-bold text-sm transition hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}
        >
          {saving ? '保存中...' : '変更を保存'}
        </button>
      </div>
    </div>
  )
}
