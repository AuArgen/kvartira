import type { LalafoResponse } from './types'

const BASE_URL = 'https://lalafo.kg/api/search/v3/feed/search'
const CATEGORY_ID = process.env.LALAFO_CATEGORY_ID ?? '2043'
const PER_PAGE = process.env.LALAFO_PER_PAGE ?? '20'

const HEADERS: Record<string, string> = {
  Device: 'pc',
  'Country-Id': '12',
  Language: 'ru_RU',
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
}

export async function fetchLalafoPage(page = 1): Promise<LalafoResponse> {
  const params = new URLSearchParams({
    expand: 'url',
    'per-page': PER_PAGE,
    category_id: CATEGORY_ID,
    sort_by: 'newest',
    'price[from]': '0',
    with_feed_banner: 'true',
    page: String(page),
  })

  const res = await fetch(`${BASE_URL}?${params}`, {
    headers: HEADERS,
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Lalafo API error: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<LalafoResponse>
}
