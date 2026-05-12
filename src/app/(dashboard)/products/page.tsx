import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
  if (!profile) redirect('/register')

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('profile_id', profile.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">商材管理</h1>
          <p className="text-gray-500 text-sm mt-0.5">あなたの担当商材を登録して、商材特化の学習を始めましょう</p>
        </div>
        <Link href="/products/new"
          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
          <span>+</span>
          商材を追加
        </Link>
      </div>

      {/* Info banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <span className="text-2xl">💡</span>
        <div>
          <p className="font-semibold text-orange-800 text-sm">商材を登録するメリット</p>
          <p className="text-orange-700 text-sm mt-0.5">
            商材情報を登録すると、AIが「その商材専用の問題」「商材に合わせたロープレシナリオ」「商材別の弱点分析」を提供できます。
          </p>
        </div>
      </div>

      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {products.map(product => (
            <Link key={product.id} href={`/products/${product.id}`}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-xl flex items-center justify-center">
                  📦
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                  アクティブ
                </span>
              </div>
              <h2 className="font-bold text-gray-900 text-base mb-1">{product.name}</h2>
              {product.description && (
                <p className="text-gray-500 text-xs line-clamp-2 mb-3">{product.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {product.target_segment && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {product.target_segment === 'smb' ? 'SMB' : product.target_segment === 'mid' ? 'Mid市場' : product.target_segment === 'enterprise' ? 'エンタープライズ' : '全市場'}
                  </span>
                )}
                {product.sales_method && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {product.sales_method === 'inbound' ? 'インバウンド' : product.sales_method === 'outbound' ? 'アウトバウンド' : '両方'}
                  </span>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                <Link href={`/quiz?product=${product.id}`}
                  onClick={e => e.stopPropagation()}
                  className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition font-medium">
                  問題練習
                </Link>
                <Link href={`/roleplay?product=${product.id}`}
                  onClick={e => e.stopPropagation()}
                  className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition font-medium">
                  ロープレ
                </Link>
              </div>
            </Link>
          ))}

          {/* Add product card */}
          <Link href="/products/new"
            className="border-2 border-dashed border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:border-orange-300 transition group">
            <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-orange-100 flex items-center justify-center text-2xl mb-3 transition">
              +
            </div>
            <p className="font-semibold text-gray-500 group-hover:text-orange-600 transition text-sm">
              商材を追加する
            </p>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-10 shadow-sm text-center">
          <div className="text-5xl mb-4">📦</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">まだ商材が登録されていません</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            あなたの担当商材を登録することで、AIがパーソナライズした学習コンテンツを提供します。
          </p>
          <Link href="/products/new"
            className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            最初の商材を登録する →
          </Link>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-600 mb-3">商材なしでも学習できます</p>
            <div className="flex gap-3 justify-center">
              <Link href="/quiz"
                className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 transition">
                基礎問題を解く
              </Link>
              <Link href="/roleplay"
                className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 transition">
                汎用ロープレ
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
