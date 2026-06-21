import { prisma } from '@/lib/prisma'
import { ListingCard } from '@/components/listings/ListingCard'
import { ListingFilters } from '@/components/listings/ListingFilters'
import { Pagination } from '@/components/ui/Pagination'
import type { Prisma } from '@prisma/client'
import type { SerializedListing } from '@/lib/types'
import { Suspense } from 'react'

type SearchParams = Promise<Record<string, string | undefined>>

const PER_PAGE = 20

function serializeListing(l: {
  id: number; source: string; lalafoId: bigint | null; lalafoUrl: string | null
  title: string; description: string | null; price: { toNumber(): number } | null
  oldPrice: { toNumber(): number } | null; currency: string | null; isNegotiable: boolean
  cityName: string | null; lat: { toNumber(): number } | null; lng: { toNumber(): number } | null
  phone: string | null; categoryId: number | null; categoryLabel: string | null
  rooms: number | null; ownerType: string | null; rentType: string | null; furnishing: string | null; isVip: boolean; isSelect: boolean; isPremium: boolean
  lalafoCreatedAt: Date | null; createdAt: Date
  city: { id: number; name: string; alias: string } | null
  district: { id: number; name: string } | null
  images: { id: number; isMain: boolean; thumbnailUrl: string | null; originalUrl: string | null
    thumbnailWebpUrl: string | null; originalWebpUrl: string | null
    width: number | null; height: number | null; sortOrder: number }[]
}): SerializedListing {
  return {
    id: l.id, source: l.source,
    lalafoId: l.lalafoId?.toString() ?? null,
    lalafoUrl: l.lalafoUrl,
    title: l.title, description: l.description,
    price: l.price?.toNumber() ?? null,
    oldPrice: l.oldPrice?.toNumber() ?? null,
    currency: l.currency, isNegotiable: l.isNegotiable,
    cityName: l.cityName,
    lat: l.lat?.toNumber() ?? null,
    lng: l.lng?.toNumber() ?? null,
    phone: l.phone, categoryId: l.categoryId, categoryLabel: l.categoryLabel,
    rooms: l.rooms, ownerType: l.ownerType, rentType: l.rentType, furnishing: l.furnishing,
    isVip: l.isVip, isSelect: l.isSelect, isPremium: l.isPremium,
    lalafoCreatedAt: l.lalafoCreatedAt?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
    city: l.city ?? null, district: l.district ?? null,
    images: l.images.map((img) => ({
      id: img.id, isMain: img.isMain,
      thumbnailUrl: img.thumbnailUrl, originalUrl: img.originalUrl,
      thumbnailWebpUrl: img.thumbnailWebpUrl, originalWebpUrl: img.originalWebpUrl,
      width: img.width, height: img.height, sortOrder: img.sortOrder,
    })),
  }
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const skip = (page - 1) * PER_PAGE

  const where: Prisma.ListingWhereInput = { status: 'active' }

  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
    ]
  }
  if (params.city) where.city = { alias: params.city }
  if (params.districts) {
    const ids = params.districts.split(',').map(Number).filter(Boolean)
    where.districtId = ids.length === 1 ? ids[0] : { in: ids }
  }
  if (params.category) where.categoryId = parseInt(params.category)
  if (params.ownerType) where.ownerType = params.ownerType
  if (params.rentType) where.rentType = params.rentType
  if (params.furnishing) where.furnishing = params.furnishing
  if (params.rooms) {
    const r = parseInt(params.rooms)
    where.rooms = r >= 4 ? { gte: 4 } : r
  }
  if (params.minPrice || params.maxPrice) {
    where.price = {
      ...(params.minPrice ? { gte: parseFloat(params.minPrice) as never } : {}),
      ...(params.maxPrice ? { lte: parseFloat(params.maxPrice) as never } : {}),
    }
  }

  const sort = params.sort ?? 'newest'
  const orderBy: Prisma.ListingOrderByWithRelationInput =
    sort === 'price_asc' ? { price: 'asc' } :
    sort === 'price_desc' ? { price: 'desc' } :
    { lalafoCreatedAt: 'desc' }

  const [listings, total, cities, districts] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        city: true,
        district: true,
        images: { where: { isMain: true }, take: 1, orderBy: { sortOrder: 'asc' } },
      },
      orderBy,
      skip,
      take: PER_PAGE,
    }),
    prisma.listing.count({ where }),
    prisma.city.findMany({ orderBy: { name: 'asc' } }),
    prisma.district.findMany({
      where: params.city ? { city: { alias: params.city } } : {},
      orderBy: { name: 'asc' },
    }),
  ])

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Квартиры в Кыргызстане</h1>
        <p className="mt-1 text-sm text-gray-500">{total.toLocaleString('ru-RU')} объявлений</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        <Suspense>
          <ListingFilters cities={cities} districts={districts} />
        </Suspense>

        <div className="min-w-0 flex-1">
          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-24 text-center">
              <p className="text-lg font-medium text-gray-500">Объявления не найдены</p>
              <p className="mt-1 text-sm text-gray-400">Попробуйте изменить фильтры</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={serializeListing(l)} />
                ))}
              </div>
              <div className="mt-8">
                <Suspense>
                  <Pagination page={page} totalPages={totalPages} total={total} />
                </Suspense>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
