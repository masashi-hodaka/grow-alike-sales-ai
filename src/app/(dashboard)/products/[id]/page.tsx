import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single()
  if (!profile) redirect('/register')

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('profile_id', profile.id)
    .single()

  if (!product) notFound()

  const segmentLabel: Record<string, string> = {
    smb: 'SMB（中小企業）', mid: 'Mid市場（中堅企業）',
    enterprise: 'エンタープライズ', all: '全市場',
  }
  const methodLabel: Record<string, string> = {
    inbound: 'インバウンド', outbound: 'アウトバウンド', both: '両方',
  }

  return (
    <div className="p-6 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-5">
        <Link href="/dashboard" className="hover:text-gray-700">ホーム</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-gray-700">商材管理</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium truncate">{product.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-2xl flex items-center justify-center">📦</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {product.target_segment && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                  {segmentLabel[product.target_segment] ?? product.target_segment}
                </span>
              )}
              {product.sales_method && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                  {methodLabel[product.sales_method] ?? product.sales_method}
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">アクティブ</span>
            </div>
          </div>
        </div>
        <Link href={`/products/${id}/edit`}
          className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 transition font-medium">
          編集
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href={`/quiz?product=${id}`}
          className="flex items-center gap-3 p-4 rounded-2xl text-white font-semibold transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
          <span className="text-2xl">🧠</span>
          <div>
            <p className="font-bold">この商材で問題練習</p>
            <p className="text-xs text-orange-200 font-normal">商材特化の問題を解く</p>
          </div>
        </Link>
        <Link href={`/roleplay?product=${id}`}
          className="flex items-center gap-3 p-4 rounded-2xl text-white font-semibold transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
          <span className="text-2xl">🎭</span>
          <div>
            <p className="font-bold">この商材でロープレ</p>
            <p className="text-xs text-purple-200 font-normal">商材に合わせたシナリオ</p>
          </div>
        </Link>
      </div>

      {/* Details */}
      <div className="space-y-4">
        {product.description && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-gray-800 text-sm mb-2">商材説明</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
          </div>
        )}

        {product.value_props && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-gray-800 text-sm mb-2">バリュープロポジション</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{product.value_props}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 text-sm mb-3">ターゲット情報</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {product.target_industry && (
              <div>
                <p className="text-gray-400 text-xs mb-0.5">対象業種</p>
                <p className="text-gray-800 font-medium">{product.target_industry}</p>
              </div>
            )}
            {product.target_role && (
              <div>
                <p className="text-gray-400 text-xs mb-0.5">対象役職</p>
                <p className="text-gray-800 font-medium">{product.target_role}</p>
              </div>
            )}
            {product.lead_sources && product.lead_sources.length > 0 && (
              <div className="col-span-2">
                <p className="text-gray-400 text-xs mb-1.5">リード獲得経路</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.lead_sources.map((s: string) => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {(product.sales_cycle_days || product.deal_size_min || product.deal_size_max || product.ltv_avg || product.contract_duration) && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-gray-800 text-sm mb-3">案件・契約情報</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {product.sales_cycle_days && (
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">平均営業サイクル</p>
                  <p className="text-gray-800 font-medium">{product.sales_cycle_days}日</p>
                </div>
              )}
              {product.contract_duration && (
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">契約期間</p>
                  <p className="text-gray-800 font-medium">{product.contract_duration}</p>
                </div>
              )}
              {(product.deal_size_min || product.deal_size_max) && (
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">案件規模</p>
                  <p className="text-gray-800 font-medium">
                    {product.deal_size_min ? `${product.deal_size_min.toLocaleString()}万円` : ''}
                    {product.deal_size_min && product.deal_size_max ? ' 〜 ' : ''}
                    {product.deal_size_max ? `${product.deal_size_max.toLocaleString()}万円` : ''}
                  </p>
                </div>
              )}
              {product.ltv_avg && (
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">平均LTV</p>
                  <p className="text-gray-800 font-medium">{product.ltv_avg.toLocaleString()}万円</p>
                </div>
              )}
            </div>
          </div>
        )}

        {(product.competitors || product.differentiators) && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-gray-800 text-sm mb-3">競合情報</h2>
            {product.competitors && product.competitors.length > 0 && (
              <div className="mb-3">
                <p className="text-gray-400 text-xs mb-1.5">競合他社</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.competitors.map((c: string) => (
                    <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {product.differentiators && (
              <div>
                <p className="text-gray-400 text-xs mb-1">差別化ポイント</p>
                <p className="text-gray-700 text-sm leading-relaxed">{product.differentiators}</p>
              </div>
            )}
          </div>
        )}

        {product.common_objections && product.common_objections.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-gray-800 text-sm mb-3">よくある反論</h2>
            <ul className="space-y-2">
              {product.common_objections.map((obj: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-orange-400 font-bold flex-shrink-0">Q.</span>
                  {obj}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
        <Link href="/products" className="text-sm text-gray-500 hover:text-gray-700 transition">
          ← 商材一覧に戻る
        </Link>
        <p className="text-xs text-gray-400">
          登録日: {new Date(product.created_at).toLocaleDateString('ja-JP')}
        </p>
      </div>
    </div>
  )
}
