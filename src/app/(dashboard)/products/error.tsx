'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ProductsError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('Products page error:', error)
  }, [error])

  return (
    <div className="p-6 max-w-4xl">
      <div className="bg-white rounded-2xl p-10 shadow-sm text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">ページの読み込みに失敗しました</h2>
        <p className="text-gray-500 text-sm mb-6">
          一時的なエラーが発生しました。再度お試しください。
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => unstable_retry()}
            className="text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            再読み込み
          </button>
          <Link href="/dashboard"
            className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">
            ホームに戻る
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-gray-400 mt-4">エラーID: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
