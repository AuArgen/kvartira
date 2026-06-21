import Link from 'next/link'
import { Home } from 'lucide-react'
import { SyncStatus } from '@/components/listings/SyncStatus'

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Лого */}
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
            <Home className="h-4 w-4 text-white" />
          </div>
          <span className="text-base">KvartiraKG</span>
        </Link>

        {/* Правая часть */}
        <div className="flex items-center gap-3">
          <SyncStatus />
          {/* Кнопки авторизации — будут добавлены позже */}
          <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
            Войти
          </button>
        </div>
      </div>
    </header>
  )
}
