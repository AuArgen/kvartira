import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from './prisma'
import { fetchLalafoPage } from './lalafo'
import type { LalafoItem, SyncResult } from './types'

const DISTRICT_PARAM_ID = 357 // "Район Бишкека"
const DELAY_MS = 800
const MIN_PRICE = 5000
const MAX_AGE_DAYS = 14

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function parseRooms(title: string): number | null {
  const m = title.match(/^(\d+)\s*[-–]?\s*комнат/i)
  return m ? parseInt(m[1]) : null
}

function parseOwnerType(title: string): string | null {
  if (/собственник/i.test(title)) return 'owner'
  if (/риэлтор|агентство/i.test(title)) return 'realtor'
  return null
}

function parseRentType(title: string): string {
  if (/подселение|комнату в|совместное/i.test(title)) return 'room'
  return 'full'
}

function isEligible(item: LalafoItem): boolean {
  if (item.price != null && item.price < MIN_PRICE) return false
  const cutoff = Date.now() / 1000 - MAX_AGE_DAYS * 24 * 60 * 60
  if (item.created_time && item.created_time < cutoff) return false
  return true
}

// Деактивирует устаревшие / слишком дешёвые объявления
async function cleanupStale() {
  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000)
  await prisma.listing.updateMany({
    where: {
      source: 'lalafo',
      status: 'active',
      OR: [
        { lalafoCreatedAt: { lt: cutoff } },
        { price: { lt: MIN_PRICE as never } },
      ],
    },
    data: { status: 'inactive' },
  })
}

// ─── Главная функция синхронизации ─────────────────────────────────────────────
// Алгоритм:
//   1. Берём страницу 1 с Lalafo
//   2. Если ВСЕ объявления на странице уже есть в БД → СТОП
//   3. Если ЕСТЬ новые → сохраняем их, переходим на следующую страницу
//   4. Повторяем до пустой страницы или пока не встретим страницу без новых

export async function syncLalafo(): Promise<SyncResult> {
  const log = await prisma.syncLog.create({ data: { status: 'running' } })

  let page = 1
  let totalNew = 0
  let pagesFetched = 0

  try {
    // Перед синхронизацией деактивируем устаревшие и дешёвые
    await cleanupStale()

    while (true) {
      const data = await fetchLalafoPage(page)

      if (!data.items || data.items.length === 0) break

      pagesFetched++

      // Если на странице есть объявления старше MAX_AGE_DAYS — дальше не идём
      // (API сортирует по новизне, значит следующие страницы ещё старее)
      const cutoff = Date.now() / 1000 - MAX_AGE_DAYS * 24 * 60 * 60
      const hasOldItems = data.items.some(
        (item) => item.created_time && item.created_time < cutoff
      )

      // Проверяем, какие ID уже есть в базе
      const lalafoIds = data.items.map((item) => BigInt(item.id))
      const existing = await prisma.listing.findMany({
        where: { lalafoId: { in: lalafoIds } },
        select: { lalafoId: true },
      })
      const existingSet = new Set(existing.map((e) => e.lalafoId!.toString()))

      const newItems = data.items.filter((item) => !existingSet.has(String(item.id)))

      if (newItems.length === 0 && !hasOldItems) {
        // Все на этой странице уже в БД — дальше не идём
        break
      }

      // Сохраняем только подходящие: не старше 2 недель и цена ≥ 5000
      const eligibleItems = newItems.filter(isEligible)
      if (eligibleItems.length > 0) {
        await saveListings(eligibleItems)
        totalNew += eligibleItems.length
      }

      // Нашли старые объявления → стоп
      if (hasOldItems) break

      page++
      await sleep(DELAY_MS)
    }

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        finishedAt: new Date(),
        pagesFetched,
        newListingsCount: totalNew,
        status: 'completed',
      },
    })

    return { success: true, newListings: totalNew, pagesFetched }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        finishedAt: new Date(),
        pagesFetched,
        newListingsCount: totalNew,
        status: 'failed',
        errorMessage: msg,
      },
    })

    return { success: false, newListings: totalNew, pagesFetched, error: msg }
  }
}

// ─── Сохранение списка объявлений ──────────────────────────────────────────────

async function saveListings(items: LalafoItem[]) {
  for (const item of items) {
    try {
      await saveSingleListing(item)
    } catch (err) {
      console.error(`[sync] Failed to save listing ${item.id}:`, err)
    }
  }
}

// ─── Сохранение одного объявления ──────────────────────────────────────────────

async function saveSingleListing(item: LalafoItem) {
  // 1. Город
  let cityId: number | null = null
  if (item.city_alias && item.city) {
    const city = await prisma.city.upsert({
      where: { alias: item.city_alias },
      create: { name: item.city, alias: item.city_alias },
      update: { name: item.city },
    })
    cityId = city.id
  }

  // 2. Район (из params с id=357)
  let districtId: number | null = null
  const districtParam = item.params?.find((p) => p.id === DISTRICT_PARAM_ID)
  if (districtParam?.value_id && cityId) {
    const district = await prisma.district.upsert({
      where: { lalafoValueId: districtParam.value_id },
      create: {
        cityId,
        name: districtParam.value,
        lalafoValueId: districtParam.value_id,
      },
      update: { name: districtParam.value },
    })
    districtId = district.id
  }

  // 3. Само объявление
  const listing = await prisma.listing.create({
    data: {
      lalafoId: BigInt(item.id),
      source: 'lalafo',
      lalafoUrl: `https://lalafo.kg${item.url}`,

      title: item.title,
      description: item.description ?? null,

      price: item.price != null ? new Decimal(item.price) : null,
      oldPrice: item.old_price != null ? new Decimal(item.old_price) : null,
      currency: item.currency ?? 'KGS',
      isNegotiable: item.is_negotiable ?? false,
      priceType: item.price_type ?? null,

      cityId,
      districtId,
      cityName: item.city ?? null,
      lat: item.lat != null ? new Decimal(String(item.lat)) : null,
      lng: item.lng != null ? new Decimal(String(item.lng)) : null,

      phone: item.mobile ?? null,

      categoryId: item.category_id ?? null,
      categoryLabel: item.ad_label ?? null,

      rooms: parseRooms(item.title),
      ownerType: parseOwnerType(item.title),
      rentType: parseRentType(item.title),

      isVip: item.is_vip ?? false,
      isSelect: item.is_select ?? false,
      isPremium: item.is_premium ?? false,

      lalafoViews: item.views ?? 0,
      lalafoImpressions: item.impressions ?? 0,
      lalafoFavorites: item.favorite_count ?? 0,

      status: 'active',

      lalafoCreatedAt: item.created_time ? new Date(item.created_time * 1000) : null,
      lalafoUpdatedAt: item.updated_time ? new Date(item.updated_time * 1000) : null,
    },
  })

  // 4. Фотографии
  if (item.images?.length) {
    await prisma.listingImage.createMany({
      data: item.images.map((img, i) => ({
        listingId: listing.id,
        lalafoImageId: BigInt(img.id),
        isMain: img.is_main || i === 0,
        originalUrl: img.original_url ?? null,
        thumbnailUrl: img.thumbnail_url ?? null,
        originalWebpUrl: img.original_webp_url ?? null,
        thumbnailWebpUrl: img.thumbnail_webp_url ?? null,
        width: img.width ?? null,
        height: img.height ?? null,
        sortOrder: i,
      })),
    })
  }

  // 5. Параметры
  if (item.params?.length) {
    await prisma.listingParam.createMany({
      data: item.params.map((p) => ({
        listingId: listing.id,
        paramId: p.id,
        paramName: p.name,
        paramValue: p.value,
        paramValueId: p.value_id,
      })),
    })
  }
}
