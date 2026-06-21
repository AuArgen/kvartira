import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const perPage = 20
  const skip = (page - 1) * perPage

  const search = searchParams.get('search') ?? ''
  const city = searchParams.get('city') ?? ''
  const districtId = searchParams.get('districts') ?? searchParams.get('district') ?? ''
  const minPrice = searchParams.get('minPrice') ?? ''
  const maxPrice = searchParams.get('maxPrice') ?? ''
  const categoryId = searchParams.get('category') ?? ''
  const ownerType = searchParams.get('ownerType') ?? ''
  const rentType = searchParams.get('rentType') ?? ''
  const rooms = searchParams.get('rooms') ?? ''
  const sort = searchParams.get('sort') ?? 'newest'

  const where: Prisma.ListingWhereInput = { status: 'active' }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (city) where.city = { alias: city }
  if (districtId) {
    const ids = districtId.split(',').map(Number).filter(Boolean)
    where.districtId = ids.length === 1 ? ids[0] : { in: ids }
  }
  if (categoryId) where.categoryId = parseInt(categoryId)
  if (ownerType) where.ownerType = ownerType
  if (rentType) where.rentType = rentType
  const furnishing = searchParams.get('furnishing') ?? ''
  if (furnishing) where.furnishing = furnishing
  if (rooms) {
    const r = parseInt(rooms)
    where.rooms = r >= 4 ? { gte: 4 } : r
  }

  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice ? { gte: parseFloat(minPrice) as never } : {}),
      ...(maxPrice ? { lte: parseFloat(maxPrice) as never } : {}),
    }
  }

  const orderBy: Prisma.ListingOrderByWithRelationInput =
    sort === 'price_asc'
      ? { price: 'asc' }
      : sort === 'price_desc'
        ? { price: 'desc' }
        : { lalafoCreatedAt: 'desc' }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        city: true,
        district: true,
        images: {
          where: { isMain: true },
          take: 1,
        },
      },
      orderBy,
      skip,
      take: perPage,
    }),
    prisma.listing.count({ where }),
  ])

  // BigInt → string для JSON сериализации
  const serialized = listings.map((l) => ({
    ...l,
    lalafoId: l.lalafoId?.toString() ?? null,
    price: l.price?.toNumber() ?? null,
    oldPrice: l.oldPrice?.toNumber() ?? null,
    lat: l.lat?.toNumber() ?? null,
    lng: l.lng?.toNumber() ?? null,
    lalafoCreatedAt: l.lalafoCreatedAt?.toISOString() ?? null,
    lalafoUpdatedAt: l.lalafoUpdatedAt?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
    furnishing: 'furnishing' in l ? (l.furnishing as string | null) : null,
    images: l.images.map((img) => ({
      ...img,
      lalafoImageId: img.lalafoImageId?.toString() ?? null,
      createdAt: img.createdAt.toISOString(),
    })),
  }))

  return NextResponse.json({
    listings: serialized,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  })
}
