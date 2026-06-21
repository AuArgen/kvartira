'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
}

export function Pagination({ page, totalPages, total }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params}`)
  }

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-100 pt-6">
      <span className="text-sm text-gray-400">Всего: {total.toLocaleString('ru-RU')} объявлений</span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => goTo(page - 1)}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dot-${i}`} className="px-1 text-gray-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => goTo(p as number)}
              className={cn(
                'flex h-8 min-w-[32px] items-center justify-center rounded border px-2 text-sm',
                p === page
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => goTo(page + 1)}
          disabled={page === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
