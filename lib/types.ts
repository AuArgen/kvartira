// ─── Lalafo API types ──────────────────────────────────────────────────────────

export interface LalafoUser {
  id: number
  username: string
  avatar: string | null
  pro: boolean
  response_rate: number
  response_time: number
  is_banned: boolean
  is_deleted: boolean
  response_info: string
}

export interface LalafoImage {
  id: number
  is_main: boolean
  original_url: string
  thumbnail_url: string
  original_webp_url?: string
  thumbnail_webp_url?: string
  width?: number
  height?: number
  p_hash?: string
}

export interface LalafoParam {
  id: number
  name: string
  value: string
  value_id: number
}

export interface LalafoItem {
  id: number
  old_id: number | null
  country_id: number
  status_id: number
  category_id: number
  user_id: number
  user: LalafoUser
  title: string
  description: string
  city: string
  city_id: number
  city_alias: string
  hide_phone: boolean
  hide_chat: boolean | null
  lat: number
  lng: number
  views: number
  impressions: number
  favorite_count: number
  callers_count: number
  writers_count: number
  is_vip: boolean
  is_select: boolean
  is_premium: boolean
  is_negotiable: boolean
  price: number | null
  old_price: number | null
  currency: string | null
  symbol: string | null
  mobile: string
  images: LalafoImage[]
  created_time: number
  updated_time: number
  is_freedom: boolean
  price_type: number
  ad_label: string
  params: LalafoParam[]
  url: string
}

export interface LalafoResponse {
  items: LalafoItem[]
  total_count?: number
  current_page?: number
  per_page?: number
}

// ─── Sync result ───────────────────────────────────────────────────────────────

export interface SyncResult {
  success: boolean
  newListings: number
  pagesFetched: number
  error?: string
}

// ─── Serialized listing (BigInt → string/number для JSON) ─────────────────────

export interface SerializedListing {
  id: number
  source: string
  lalafoId: string | null
  lalafoUrl: string | null
  title: string
  description: string | null
  price: number | null
  oldPrice: number | null
  currency: string | null
  isNegotiable: boolean
  cityName: string | null
  lat: number | null
  lng: number | null
  phone: string | null
  categoryId: number | null
  categoryLabel: string | null
  rooms: number | null
  ownerType: string | null
  rentType: string | null
  isVip: boolean
  isSelect: boolean
  isPremium: boolean
  lalafoCreatedAt: string | null
  createdAt: string
  city: { id: number; name: string; alias: string } | null
  district: { id: number; name: string } | null
  images: SerializedImage[]
}

export interface SerializedImage {
  id: number
  isMain: boolean
  thumbnailUrl: string | null
  originalUrl: string | null
  thumbnailWebpUrl: string | null
  originalWebpUrl: string | null
  width: number | null
  height: number | null
  sortOrder: number
}
