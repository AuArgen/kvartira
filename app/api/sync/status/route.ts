import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [lastSync, totalListings] = await Promise.all([
    prisma.syncLog.findFirst({ orderBy: { startedAt: 'desc' } }),
    prisma.listing.count({ where: { status: 'active' } }),
  ])

  return NextResponse.json({
    lastSync: lastSync
      ? {
          id: lastSync.id,
          startedAt: lastSync.startedAt.toISOString(),
          finishedAt: lastSync.finishedAt?.toISOString() ?? null,
          status: lastSync.status,
          newListingsCount: lastSync.newListingsCount,
          pagesFetched: lastSync.pagesFetched,
          errorMessage: lastSync.errorMessage ?? null,
        }
      : null,
    totalListings,
  })
}
