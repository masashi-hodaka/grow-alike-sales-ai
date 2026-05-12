'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Step = 1 | 2 | 3 | 4

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

export default function NewProductPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
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
    lead_sources: [] as string[],
    competitors: '',
    differentiators: '',
    common_objections: '',
    value_props: '',
  })

  const set = (key: keyof typeof form, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const toggleLeadSource = (source: string) => {
    set('lead_sources', form.lead_sources.includes(source)
      ? form.lead_sources.filter(s => s !== source)
      : [...form.lead_sources, source]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインが必要です')

      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single()
      if (!profile) throw new Error('プロフィールが見つかりません')

      const { error: insertError } = await supabase.from('products').insert({
        profile_id: profile.id,
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
      })

      if (insertError) throw insertError
      router.push('/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
      setSaving(false)
    }
  }

  const canNext1 = form.name.trim().length > 0
  const canNext2 = form.target_segment !== '' && form.sales_method !== ''

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-5">
        <Link href="/products" className="hover:text-gray-700">商材管理</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">新規登録</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">商材を登録</h1>
      <p className="text-gray-500 text-sm mb-6">詳しく入力するほど、AIのパーソナライズ精度が上がります</p>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {[1, 2, 3, 4].map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition ${
              step >= s
                ? 'text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
            style={step >= s ? { background: 'linear-gradient(135deg,#f97316,#ea580c)' } : {}}>
              {s}
            </div>
            {i < 3 && (
              <div className={`flex-1 h-0.5 mx-1 transition ${step > s ? 'bg-orange-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg mb-4">基本情報</h2>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                商品・サービス名 <span className="text-red-500">*</span>
              </label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="例：クラウド型CRM「SalesHub」"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                商材説明 <span className="text-gray-400 font-normal">（自由記述）</span>
              </label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="この商材について自由に説明してください。AIがこの情報を元に最適な問題とロープレシナリオを生成します。&#13;&#13;例：中小企業向けのSaaS型CRMツールです。月額2万円から利用でき、導入実績は全国3,000社。主な訴求ポイントは「業務効率化」と「売上管理の見える化」..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-gray-50"
                rows={5} />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">バリュープロポジション</label>
              <textarea value={form.value_props} onChange={e => set('value_props', e.target.value)}
                placeholder="例：「3ヶ月で営業工数を30%削減」「競合比較でコスト半額」"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-gray-50"
                rows={2} />
            </div>
          </div>
        )}

        {/* Step 2: Target & Method */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-bold text-gray-900 text-lg mb-4">ターゲット・営業手法</h2>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                ターゲット規模 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TARGET_SEGMENTS.map(seg => (
                  <button key={seg.id} onClick={() => set('target_segment', seg.id)}
                    className={`border-2 rounded-xl p-3 flex items-center gap-2 transition ${
                      form.target_segment === seg.id ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <span className="text-xl">{seg.emoji}</span>
                    <span className={`font-medium text-sm ${form.target_segment === seg.id ? 'text-orange-700' : 'text-gray-700'}`}>
                      {seg.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">対象業種</label>
                <input value={form.target_industry} onChange={e => set('target_industry', e.target.value)}
                  placeholder="例：製造業、IT企業、小売業"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">対象役職</label>
                <input value={form.target_role} onChange={e => set('target_role', e.target.value)}
                  placeholder="例：社長、IT部長、購買担当"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                営業手法 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {SALES_METHODS.map(m => (
                  <button key={m.id} onClick={() => set('sales_method', m.id)}
                    className={`w-full border-2 rounded-xl p-3 flex items-center gap-3 transition text-left ${
                      form.sales_method === m.id ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      form.sales_method === m.id ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                    }`} />
                    <div>
                      <p className={`font-medium text-sm ${form.sales_method === m.id ? 'text-orange-700' : 'text-gray-700'}`}>{m.label}</p>
                      <p className="text-xs text-gray-500">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">リード獲得経路</label>
              <div className="flex flex-wrap gap-2">
                {LEAD_SOURCE_OPTIONS.map(src => (
                  <button key={src} onClick={() => toggleLeadSource(src)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                      form.lead_sources.includes(src)
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'border-gray-200 text-gray-600 hover:border-orange-300'
                    }`}>
                    {src}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Deal Info */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg mb-4">案件・契約情報</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">平均営業サイクル</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={form.sales_cycle_days} onChange={e => set('sales_cycle_days', e.target.value)}
                    placeholder="30"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
                  <span className="text-sm text-gray-500 whitespace-nowrap">日</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">契約期間</label>
                <input value={form.contract_duration} onChange={e => set('contract_duration', e.target.value)}
                  placeholder="例：1年、月次"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">案件規模（万円）</label>
              <div className="flex items-center gap-2">
                <input type="number" value={form.deal_size_min} onChange={e => set('deal_size_min', e.target.value)}
                  placeholder="最小"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
                <span className="text-gray-400">〜</span>
                <input type="number" value={form.deal_size_max} onChange={e => set('deal_size_max', e.target.value)}
                  placeholder="最大"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
                <span className="text-sm text-gray-500">万円</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">平均LTV（万円）</label>
              <input type="number" value={form.ltv_avg} onChange={e => set('ltv_avg', e.target.value)}
                placeholder="例：150"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">競合他社</label>
              <input value={form.competitors} onChange={e => set('competitors', e.target.value)}
                placeholder="例：Salesforce, HubSpot, kintone（カンマ区切り）"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">競合との差別化ポイント</label>
              <textarea value={form.differentiators} onChange={e => set('differentiators', e.target.value)}
                placeholder="例：価格が競合の半額、UI/UXが直感的、日本語サポートが充実"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-gray-50"
                rows={2} />
            </div>
          </div>
        )}

        {/* Step 4: Objections + AI gen */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg mb-4">よくある反論・AI設定</h2>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                よくある反論 <span className="text-gray-400 font-normal">（1行1反論）</span>
              </label>
              <textarea value={form.common_objections} onChange={e => set('common_objections', e.target.value)}
                placeholder="予算がない&#13;今は時期じゃない&#13;既存のシステムで間に合っている&#13;上司の承認が必要"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-gray-50"
                rows={5} />
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="font-bold text-orange-800 text-sm">AIが次のコンテンツを自動生成します</p>
                  <ul className="mt-2 space-y-1 text-xs text-orange-700">
                    <li>✓ この商材専用の問題セット（各カテゴリ5問以上）</li>
                    <li>✓ 商材に合わせたロープレシナリオ</li>
                    <li>✓ よくある反論への回答例・練習問題</li>
                    <li>✓ 競合比較トーク練習</li>
                  </ul>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button onClick={() => setStep(s => (s - 1) as Step)}
              className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">
              ← 戻る
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep(s => (s + 1) as Step)}
              disabled={step === 1 ? !canNext1 : step === 2 ? !canNext2 : false}
              className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
              次へ →
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
              {saving ? '保存中...' : '登録してAI生成を開始 →'}
            </button>
          )}
        </div>
      </div>

      {/* Step labels */}
      <div className="flex justify-between mt-3 px-1">
        {['基本情報', 'ターゲット', '案件情報', '反論・AI'].map((label, i) => (
          <span key={i} className={`text-xs ${step === i + 1 ? 'text-orange-500 font-semibold' : 'text-gray-400'}`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
