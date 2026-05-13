'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const TARGET_SEGMENTS = [
  { id: 'smb', label: 'SMB（中小企業）', emoji: '🏪' },
  { id: 'mid', label: 'Mid市場（中堅企業）', emoji: '🏢' },
  { id: 'enterprise', label: 'エンタープライズ', emoji: '🏛️' },
  { id: 'all', label: '全市場', emoji: '🌐' },
]

const SALES_METHODS = [
  { id: 'inbound', label: 'インバウンド', desc: 'お客様からの問い合わせが起点' },
  { id: 'outbound', label: 'アウトバウンド', desc: 'こちらからアプローチが起点' },
  { id: 'both', label: '両方', desc: 'インバウンド・アウトバウンド両方' },
]

const LEAD_SOURCE_OPTIONS = ['テレアポ', 'メール', 'SNS', 'SEO/コンテンツ', '展示会', '紹介', '広告', 'パートナー経由']

type FormState = {
  name: string
  description: string
  target_segment: string
  target_industry: string
  target_role: string
  sales_method: string
  sales_cycle_days: string
  deal_size_min: string
  deal_size_max: string
  ltv_avg: string
  contract_duration: string
  lead_sources: string[]
  competitors: string
  differentiators: string
  common_objections: string
  value_props: string
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    target_segment: '',
    target_industry: '',
    target_role: '',
    sales_method: '',
    sales_cycle_days: '',
    deal_size_min: '',
    deal_size_max: '',
    ltv_avg: '',
    contract_duration: '',
    lead_sources: [],
    competitors: '',
    differentiators: '',
    common_objections: '',
    value_props: '',
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single()
      if (!profile) { router.push('/register'); return }

      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('profile_id', profile.id)
        .single()

      if (fetchError || !product) { router.push('/products'); return }

      setForm({
        name: product.name ?? '',
        description: product.description ?? '',
        target_segment: product.target_segment ?? '',
        target_industry: product.target_industry ?? '',
        target_role: product.target_role ?? '',
        sales_method: product.sales_method ?? '',
        sales_cycle_days: product.sales_cycle_days?.toString() ?? '',
        deal_size_min: product.deal_size_min?.toString() ?? '',
        deal_size_max: product.deal_size_max?.toString() ?? '',
        ltv_avg: product.ltv_avg?.toString() ?? '',
        contract_duration: product.contract_duration ?? '',
        lead_sources: product.lead_sources ?? [],
        competitors: (product.competitors ?? []).join('、'),
        differentiators: product.differentiators ?? '',
        common_objections: (product.common_objections ?? []).join('\n'),
        value_props: product.value_props ?? '',
      })
      setLoading(false)
    }
    load()
  }, [id, router])

  const set = (key: keyof FormState, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const toggleLeadSource = (source: string) => {
    set('lead_sources', form.lead_sources.includes(source)
      ? form.lead_sources.filter(s => s !== source)
      : [...form.lead_sources, source]
    )
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('商品・サービス名は必須です'); return }
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインが必要です')

      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single()
      if (!profile) throw new Error('プロフィールが見つかりません')

      const { error: updateError } = await supabase.from('products').update({
        name: form.name,
        description: form.description || null,
        target_segment: form.target_segment || null,
        target_industry: form.target_industry || null,
        target_role: form.target_role || null,
        sales_method: form.sales_method || null,
        sales_cycle_days: form.sales_cycle_days ? parseInt(form.sales_cycle_days) : null,
        deal_size_min: form.deal_size_min ? parseInt(form.deal_size_min) : null,
        deal_size_max: form.deal_size_max ? parseInt(form.deal_size_max) : null,
        ltv_avg: form.ltv_avg ? parseInt(form.ltv_avg) : null,
        contract_duration: form.contract_duration || null,
        lead_sources: form.lead_sources.length > 0 ? form.lead_sources : null,
        competitors: form.competitors ? form.competitors.split(/[,、]/).map(s => s.trim()).filter(Boolean) : null,
        differentiators: form.differentiators || null,
        common_objections: form.common_objections ? form.common_objections.split(/\n/).filter(Boolean) : null,
        value_props: form.value_props || null,
      }).eq('id', id).eq('profile_id', profile.id)

      if (updateError) throw updateError
      router.push(`/products/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
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
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-5">
        <Link href="/products" className="hover:text-gray-700">商材管理</Link>
        <span>/</span>
        <Link href={`/products/${id}`} className="hover:text-gray-700">{form.name || '商材詳細'}</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">編集</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">商材を編集</h1>
      <p className="text-gray-500 text-sm mb-6">情報を更新して保存してください</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
        {/* 基本情報 */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">
            商品・サービス名 <span className="text-red-500">*</span>
          </label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="例：クラウド型CRM「SalesHub」"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">商材説明</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="この商材・サービスが解決する課題や特徴を簡潔に"
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 resize-none" />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">バリュープロポジション</label>
          <textarea value={form.value_props} onChange={e => set('value_props', e.target.value)}
            placeholder="顧客にとっての価値・導入メリット"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 resize-none" />
        </div>

        {/* ターゲット */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">ターゲット市場</label>
          <div className="grid grid-cols-2 gap-2">
            {TARGET_SEGMENTS.map(seg => (
              <button key={seg.id} type="button"
                onClick={() => set('target_segment', seg.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition ${
                  form.target_segment === seg.id
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-orange-200'
                }`}>
                <span>{seg.emoji}</span>
                <span>{seg.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">対象業種</label>
            <input value={form.target_industry} onChange={e => set('target_industry', e.target.value)}
              placeholder="例：製造業、IT、小売"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">対象役職</label>
            <input value={form.target_role} onChange={e => set('target_role', e.target.value)}
              placeholder="例：営業部長、経営者"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
          </div>
        </div>

        {/* 営業手法 */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">営業手法</label>
          <div className="grid grid-cols-3 gap-2">
            {SALES_METHODS.map(m => (
              <button key={m.id} type="button"
                onClick={() => set('sales_method', m.id)}
                className={`p-3 rounded-xl border text-sm font-medium transition text-left ${
                  form.sales_method === m.id
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-orange-200'
                }`}>
                <p className="font-bold">{m.label}</p>
                <p className="text-xs mt-0.5 opacity-70">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* リード獲得経路 */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">リード獲得経路</label>
          <div className="flex flex-wrap gap-2">
            {LEAD_SOURCE_OPTIONS.map(src => (
              <button key={src} type="button"
                onClick={() => toggleLeadSource(src)}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition ${
                  form.lead_sources.includes(src)
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-gray-200 text-gray-600 hover:border-orange-200'
                }`}>
                {src}
              </button>
            ))}
          </div>
        </div>

        {/* 案件情報 */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-0.5">平均営業サイクル</label>
              <p className="text-xs text-gray-400 mb-1.5">初回接触〜契約までの平均日数。例：テレアポ営業なら30〜60日、エンタープライズなら90〜180日が目安</p>
              <div className="flex items-center gap-2">
                <input value={form.sales_cycle_days} onChange={e => set('sales_cycle_days', e.target.value)}
                  type="number" placeholder="例：45"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
                <span className="text-sm text-gray-500 whitespace-nowrap">日</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-0.5">契約期間</label>
              <p className="text-xs text-gray-400 mb-1.5">契約の単位。例：「1年」「月次（いつでも解約可）」「3年縛り」など</p>
              <input value={form.contract_duration} onChange={e => set('contract_duration', e.target.value)}
                placeholder="例：1年、月次"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-0.5">案件規模（万円）</label>
            <p className="text-xs text-gray-400 mb-1.5">1件あたりの契約金額（初回契約）の最小〜最大の目安。例：月額2万円なら「年間24万円」として入力。初期費用込みなら合算して入力</p>
            <div className="flex items-center gap-2">
              <input value={form.deal_size_min} onChange={e => set('deal_size_min', e.target.value)}
                type="number" placeholder="最小 例：10"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
              <span className="text-gray-400">〜</span>
              <input value={form.deal_size_max} onChange={e => set('deal_size_max', e.target.value)}
                type="number" placeholder="最大 例：100"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
              <span className="text-sm text-gray-500 whitespace-nowrap">万円</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-0.5">平均LTV（万円）</label>
            <p className="text-xs text-gray-400 mb-1.5">1顧客が生涯を通じて支払う合計金額の目安。例：月2万円×平均36ヶ月継続=72万円。わからなければ空欄でOK</p>
            <input value={form.ltv_avg} onChange={e => set('ltv_avg', e.target.value)}
              type="number" placeholder="例：72"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
          </div>
        </div>

        {/* 競合・差別化 */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">競合他社（カンマ区切り）</label>
          <input value={form.competitors} onChange={e => set('competitors', e.target.value)}
            placeholder="例：Salesforce、HubSpot、Zoho"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">差別化ポイント</label>
          <textarea value={form.differentiators} onChange={e => set('differentiators', e.target.value)}
            placeholder="競合と比べた強み・独自の優位性"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 resize-none" />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">よくある反論（1行に1つ）</label>
          <textarea value={form.common_objections} onChange={e => set('common_objections', e.target.value)}
            placeholder={'例：\n「今は予算がない」\n「既存ツールで十分」'}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 resize-none" />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Link href={`/products/${id}`}
          className="flex-1 text-center border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">
          キャンセル
        </Link>
        <button
          onClick={handleSave}
          disabled={saving || !form.name.trim()}
          className="flex-1 text-white py-3 rounded-xl font-bold text-sm transition hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
          {saving ? '保存中...' : '変更を保存'}
        </button>
      </div>
    </div>
  )
}
