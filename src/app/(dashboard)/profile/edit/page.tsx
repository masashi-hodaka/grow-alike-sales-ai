'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industryType, setIndustryType] = useState('IT_SAAS')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, industry_type, avatar_url')
        .eq('user_id', user.id)
        .single()

      if (!profile) { router.push('/register?onboarding=true'); return }

      setProfileId(profile.id)
      setUserId(user.id)
      setFullName(profile.full_name ?? '')
      setCompanyName(profile.company_name ?? '')
      setIndustryType(profile.industry_type ?? 'IT_SAAS')
      setAvatarUrl(profile.avatar_url ?? null)
      setLoading(false)
    }
    load()
  }, [router])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId || !profileId) return

    // Preview
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    // Upload to Supabase Storage
    setUploadingAvatar(true)
    setError(null)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

      // Add cache-bust query param so the browser fetches the new image
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`

      // Save to profile immediately
      await supabase.from('profiles').update({ avatar_url: urlWithCacheBust }).eq('id', profileId)
      setAvatarUrl(urlWithCacheBust)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'アップロードに失敗しました'
      setError(msg)
      setAvatarPreview(null)
    } finally {
      setUploadingAvatar(false)
    }
  }

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

  const currentAvatar = avatarPreview ?? avatarUrl
  const initials = fullName?.charAt(0)?.toUpperCase() ?? companyName?.charAt(0)?.toUpperCase() ?? 'U'

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

      {/* Avatar upload */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
        <label className="text-sm font-semibold text-gray-700 block mb-3">プロフィール画像</label>
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {currentAvatar ? (
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-100">
                <Image
                  src={currentAvatar}
                  alt="プロフィール画像"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black"
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                {initials}
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="text-sm border border-orange-300 text-orange-600 px-4 py-2 rounded-xl hover:bg-orange-50 transition font-medium disabled:opacity-50"
            >
              {uploadingAvatar ? 'アップロード中...' : '画像を変更'}
            </button>
            <p className="text-xs text-gray-400 mt-1.5">JPG・PNG・GIF対応 / 最大5MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>
      </div>

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
