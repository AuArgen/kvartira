'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface SyncInfo {
  lastSync: {
    status: string
    startedAt: string
    finishedAt: string | null
    newListingsCount: number
    pagesFetched: number
    errorMessage: string | null
  } | null
  totalListings: number
}

export function SyncStatus() {
  const [info, setInfo] = useState<SyncInfo | null>(null)
  const [syncing, setSyncing] = useState(false)

  async function load() {
    try {
      const res = await fetch('/api/sync/status')
      setInfo(await res.json())
    } catch {}
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [])

  async function triggerSync() {
    setSyncing(true)
    try {
      await fetch('/api/sync', { method: 'POST' })
      await load()
    } finally {
      setSyncing(false)
    }
  }

  if (!info) return null

  const ls = info.lastSync
  const icon =
    !ls ? null :
    ls.status === 'running' ? <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" /> :
    ls.status === 'completed' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> :
    <XCircle className="h-3.5 w-3.5 text-red-500" />

  return (
    <div className="flex items-center gap-3">
      <div className="hidden items-center gap-1.5 text-xs text-gray-500 sm:flex">
        {icon}
        {ls?.status === 'running' ? (
          <span>Синхронизация...</span>
        ) : ls?.finishedAt ? (
          <span title={ls.finishedAt}>
            +{ls.newListingsCount} новых · {info.totalListings.toLocaleString('ru-RU')} всего
          </span>
        ) : (
          <span>{info.totalListings.toLocaleString('ru-RU')} объявлений</span>
        )}
      </div>

      <button
        onClick={triggerSync}
        disabled={syncing}
        title="Синхронизировать сейчас"
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Sync</span>
      </button>
    </div>
  )
}
