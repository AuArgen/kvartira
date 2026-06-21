'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X, Share2, Bookmark, Check, Trash2, BookmarkCheck } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { MultiSelect } from '@/components/ui/MultiSelect'
import type { SelectOption } from '@/components/ui/MultiSelect'

interface City { id: number; name: string; alias: string }
interface District { id: number; name: string }
interface Props { cities: City[]; districts: District[] }

interface SavedFilter {
  id: string
  name: string
  search: string
  city: string
  districtIds: string[]
  minPrice: string
  maxPrice: string
  category: string
  ownerType: string
  rentType: string
  rooms: string
  sort: string
}

const STORAGE_KEY = 'kvartira_saved_filters'
const ROOMS = ['', '1', '2', '3', '4']

function MobileChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
      {label}
      <button type="button" onClick={onRemove} className="text-blue-400 hover:text-blue-700">
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

function loadSaved(): SavedFilter[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function persistSaved(list: SavedFilter[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function ListingFilters({ cities, districts }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [city, setCity] = useState(searchParams.get('city') ?? '')
  const [districtIds, setDistrictIds] = useState<string[]>(
    searchParams.get('districts')?.split(',').filter(Boolean) ?? []
  )
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '')
  const [category, setCategory] = useState(searchParams.get('category') ?? '')
  const [ownerType, setOwnerType] = useState(searchParams.get('ownerType') ?? '')
  const [rentType, setRentType] = useState(searchParams.get('rentType') ?? '')
  const [rooms, setRooms] = useState(searchParams.get('rooms') ?? '')
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'newest')

  // UI state
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [saving, setSaving] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const saveInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSavedFilters(loadSaved())
  }, [])

  useEffect(() => {
    setSearch(searchParams.get('search') ?? '')
    setCity(searchParams.get('city') ?? '')
    setDistrictIds(searchParams.get('districts')?.split(',').filter(Boolean) ?? [])
    setMinPrice(searchParams.get('minPrice') ?? '')
    setMaxPrice(searchParams.get('maxPrice') ?? '')
    setCategory(searchParams.get('category') ?? '')
    setOwnerType(searchParams.get('ownerType') ?? '')
    setRentType(searchParams.get('rentType') ?? '')
    setRooms(searchParams.get('rooms') ?? '')
    setSort(searchParams.get('sort') ?? 'newest')
  }, [searchParams])

  useEffect(() => {
    if (saving) setTimeout(() => saveInputRef.current?.focus(), 50)
    else setSaveName('')
  }, [saving])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  // Instant search debounce
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function handleSearchChange(val: string) {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => pushParams({ searchOverride: val }), 500)
  }

  function buildParams(overrides: {
    searchOverride?: string; cityOverride?: string; districtOverride?: string[]
    minPriceOverride?: string; maxPriceOverride?: string; categoryOverride?: string
    ownerTypeOverride?: string; rentTypeOverride?: string
    roomsOverride?: string; sortOverride?: string
  } = {}) {
    const s = overrides.searchOverride ?? search
    const c = overrides.cityOverride ?? city
    const d = overrides.districtOverride ?? districtIds
    const min = overrides.minPriceOverride ?? minPrice
    const max = overrides.maxPriceOverride ?? maxPrice
    const cat = overrides.categoryOverride ?? category
    const ot = overrides.ownerTypeOverride ?? ownerType
    const rt = overrides.rentTypeOverride ?? rentType
    const r = overrides.roomsOverride ?? rooms
    const srt = overrides.sortOverride ?? sort
    const params = new URLSearchParams()
    if (s.trim()) params.set('search', s.trim())
    if (c) params.set('city', c)
    if (d.length) params.set('districts', d.join(','))
    if (min) params.set('minPrice', min)
    if (max) params.set('maxPrice', max)
    if (cat) params.set('category', cat)
    if (ot) params.set('ownerType', ot)
    if (rt) params.set('rentType', rt)
    if (r) params.set('rooms', r)
    if (srt && srt !== 'newest') params.set('sort', srt)
    return params
  }

  function pushParams(overrides = {}) {
    router.push(`${pathname}?${buildParams(overrides)}`)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    pushParams()
    setOpen(false)
  }

  function reset() {
    setSearch(''); setCity(''); setDistrictIds([])
    setMinPrice(''); setMaxPrice(''); setCategory('')
    setOwnerType(''); setRentType('')
    setRooms(''); setSort('newest')
    router.push(pathname)
    setOpen(false)
  }

  function handleCityChange(vals: string[]) {
    setCity(vals[0] ?? '')
    setDistrictIds([])
  }

  // Share — copy current URL
  function share() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: 'Квартиры KG', url }).catch(() => null)
    } else {
      navigator.clipboard.writeText(url).then(() => showToast('Ссылка скопирована!')).catch(() => null)
    }
  }

  // Save filter
  function confirmSave() {
    const name = saveName.trim() || `Фильтр ${savedFilters.length + 1}`
    const entry: SavedFilter = {
      id: Date.now().toString(),
      name,
      search, city, districtIds, minPrice, maxPrice, category, ownerType, rentType, rooms, sort,
    }
    const updated = [entry, ...savedFilters]
    setSavedFilters(updated)
    persistSaved(updated)
    setSaving(false)
    showToast(`Сохранено: ${name}`)
  }

  function applyFilter(f: SavedFilter) {
    setSearch(f.search); setCity(f.city); setDistrictIds(f.districtIds)
    setMinPrice(f.minPrice); setMaxPrice(f.maxPrice); setCategory(f.category)
    setOwnerType(f.ownerType ?? ''); setRentType(f.rentType ?? '')
    setRooms(f.rooms); setSort(f.sort)
    const params = new URLSearchParams()
    if (f.search) params.set('search', f.search)
    if (f.city) params.set('city', f.city)
    if (f.districtIds.length) params.set('districts', f.districtIds.join(','))
    if (f.minPrice) params.set('minPrice', f.minPrice)
    if (f.maxPrice) params.set('maxPrice', f.maxPrice)
    if (f.category) params.set('category', f.category)
    if (f.ownerType) params.set('ownerType', f.ownerType)
    if (f.rentType) params.set('rentType', f.rentType)
    if (f.rooms) params.set('rooms', f.rooms)
    if (f.sort && f.sort !== 'newest') params.set('sort', f.sort)
    router.push(`${pathname}?${params}`)
    setOpen(false)
  }

  function deleteFilter(id: string) {
    const updated = savedFilters.filter(f => f.id !== id)
    setSavedFilters(updated)
    persistSaved(updated)
  }

  const hasFilters = !!(search || city || districtIds.length || minPrice || maxPrice || category || ownerType || rentType || rooms)
  const activeCount = [search, city, districtIds.length ? '1' : '', minPrice || maxPrice ? '1' : '', category, ownerType, rentType, rooms].filter(Boolean).length

  const cityOptions: SelectOption[] = cities.map(c => ({ value: c.alias, label: c.name }))
  const districtOptions: SelectOption[] = districts.map(d => ({ value: String(d.id), label: d.name }))

  const savedSection = savedFilters.length > 0 && (
    <div className="mb-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Сохранённые фильтры</p>
      <div className="flex flex-col gap-1">
        {savedFilters.map(f => (
          <div key={f.id} className="group flex items-center gap-1 rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5 hover:border-blue-200 hover:bg-blue-50/50 transition-colors">
            <BookmarkCheck className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
            <button
              type="button"
              onClick={() => applyFilter(f)}
              className="flex-1 truncate text-left text-sm text-gray-700 hover:text-blue-700 font-medium"
            >
              {f.name}
            </button>
            <button
              type="button"
              onClick={() => deleteFilter(f.id)}
              className="flex-shrink-0 rounded p-0.5 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="my-4 border-t border-gray-100" />
    </div>
  )

  const filterForm = (
    <div>
      {savedSection}

      <form onSubmit={submit} className="flex flex-col gap-4">
        {/* Поиск */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">Поиск</label>
          <input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Заголовок, описание..."
            className="w-full rounded-lg border border-gray-200 py-2 px-3 text-sm focus:border-blue-400 focus:outline-none"
            autoComplete="off"
          />
        </div>

        {/* Город */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">Город</label>
          <MultiSelect
            options={cityOptions}
            value={city ? [city] : []}
            onChange={handleCityChange}
            placeholder="Все города"
            single
          />
        </div>

        {/* Район */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">Район</label>
          <MultiSelect
            options={districtOptions}
            value={districtIds}
            onChange={setDistrictIds}
            placeholder={districtOptions.length ? 'Все районы' : 'Сначала выберите город'}
          />
        </div>

        {/* Цена */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">Цена (KGS)</label>
          <div className="flex items-center gap-2">
            <input
              type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
              placeholder="от" min={0}
              className="w-full rounded-lg border border-gray-200 py-2 px-3 text-sm focus:border-blue-400 focus:outline-none"
            />
            <span className="flex-shrink-0 text-gray-400">—</span>
            <input
              type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
              placeholder="до" min={0}
              className="w-full rounded-lg border border-gray-200 py-2 px-3 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Тип аренды (посуточно/долгосрочная) */}
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-500 uppercase tracking-wide">Тип аренды</label>
          <div className="flex flex-col gap-1.5">
            {[
              { value: '', label: 'Все' },
              { value: '2045', label: 'Посуточно' },
              { value: '2044', label: 'Долгосрочная' },
            ].map(opt => (
              <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio" name="rentalType"
                  value={opt.value}
                  checked={category === opt.value}
                  onChange={() => setCategory(opt.value)}
                  className="accent-blue-600"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Тип сдачи (вся квартира / подселение) */}
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-500 uppercase tracking-wide">Тип сдачи</label>
          <div className="flex gap-1.5">
            {[
              { value: '', label: 'Все' },
              { value: 'full', label: 'Вся квартира' },
              { value: 'room', label: 'Подселение' },
            ].map(opt => (
              <button
                key={opt.value} type="button"
                onClick={() => setRentType(opt.value)}
                className={cn(
                  'flex-1 rounded-lg border py-1.5 text-center text-xs font-medium transition-colors',
                  rentType === opt.value
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Кто сдаёт */}
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-500 uppercase tracking-wide">Кто сдаёт</label>
          <div className="flex gap-1.5">
            {[
              { value: '', label: 'Все' },
              { value: 'owner', label: 'Собственник' },
              { value: 'realtor', label: 'Риэлтор' },
            ].map(opt => (
              <button
                key={opt.value} type="button"
                onClick={() => setOwnerType(opt.value)}
                className={cn(
                  'flex-1 rounded-lg border py-1.5 text-center text-xs font-medium transition-colors',
                  ownerType === opt.value
                    ? 'border-violet-600 bg-violet-600 text-white'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Комнаты */}
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-500 uppercase tracking-wide">Комнаты</label>
          <div className="flex gap-1.5">
            {ROOMS.map(r => (
              <button
                key={r} type="button"
                onClick={() => setRooms(r)}
                className={cn(
                  'flex-1 rounded-lg border py-1.5 text-center text-sm font-medium transition-colors',
                  rooms === r
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                {r === '' ? 'Все' : r === '4' ? '4+' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Сортировка */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">Сортировка</label>
          <select
            value={sort} onChange={e => setSort(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 px-3 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="newest">Сначала новые</option>
            <option value="price_asc">Цена: дешевле</option>
            <option value="price_desc">Цена: дороже</option>
          </select>
        </div>

        {/* Кнопки — применить / сброс */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Применить
          </button>
          {hasFilters && (
            <button
              type="button" onClick={reset}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <X className="h-3.5 w-3.5" />
              Сброс
            </button>
          )}
        </div>
      </form>

      {/* Поделиться / Сохранить — вне <form> */}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={share}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Share2 className="h-3.5 w-3.5" />
          Поделиться
        </button>
        <button
          type="button"
          onClick={() => setSaving(s => !s)}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-colors',
            saving
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          )}
        >
          <Bookmark className="h-3.5 w-3.5" />
          Сохранить
        </button>
      </div>

      {/* Инлайн-форма сохранения */}
      {saving && (
        <div className="mt-2 flex gap-1.5">
          <input
            ref={saveInputRef}
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') confirmSave(); if (e.key === 'Escape') setSaving(false) }}
            placeholder="Название фильтра..."
            className="flex-1 rounded-lg border border-blue-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={confirmSave}
            className="flex items-center justify-center rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setSaving(false)}
            className="flex items-center justify-center rounded-lg border border-gray-200 px-2 py-1.5 text-gray-500 hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
          <Check className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
          {toast}
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Фильтры</h2>
          {filterForm}
        </div>
      </aside>

      {/* Mobile bar — full width */}
      <div className="lg:hidden space-y-2">
        {/* Row 1: Фильтры + быстрая сортировка */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm"
          >
            <SlidersHorizontal className="h-4 w-4 flex-shrink-0" />
            <span>Фильтры</span>
            {activeCount > 0 && (
              <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>
          <select
            value={sort}
            onChange={e => { setSort(e.target.value); pushParams({ sortOverride: e.target.value }) }}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:outline-none"
          >
            <option value="newest">Новые</option>
            <option value="price_asc">Дешевле</option>
            <option value="price_desc">Дороже</option>
          </select>
        </div>

        {/* Row 2: Активные фильтры — chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-1.5">
            {search && (
              <MobileChip label={`"${search.slice(0, 18)}${search.length > 18 ? '…' : ''}"`}
                onRemove={() => { setSearch(''); pushParams({ searchOverride: '' }) }} />
            )}
            {city && (
              <MobileChip label={cities.find(c => c.alias === city)?.name ?? city}
                onRemove={() => { setCity(''); setDistrictIds([]); pushParams({ cityOverride: '', districtOverride: [] }) }} />
            )}
            {districtIds.map(id => {
              const d = districts.find(x => String(x.id) === id)
              return d ? (
                <MobileChip key={id} label={d.name}
                  onRemove={() => { const next = districtIds.filter(x => x !== id); setDistrictIds(next); pushParams({ districtOverride: next }) }} />
              ) : null
            })}
            {rooms && (
              <MobileChip label={rooms === '4' ? '4+ комн.' : `${rooms} комн.`}
                onRemove={() => { setRooms(''); pushParams({ roomsOverride: '' }) }} />
            )}
            {(minPrice || maxPrice) && (
              <MobileChip label={`${minPrice || '0'}–${maxPrice || '∞'} KGS`}
                onRemove={() => { setMinPrice(''); setMaxPrice(''); pushParams({ minPriceOverride: '', maxPriceOverride: '' }) }} />
            )}
            {category && (
              <MobileChip label={category === '2045' ? 'Посуточно' : 'Долгосрочная'}
                onRemove={() => { setCategory(''); pushParams({ categoryOverride: '' }) }} />
            )}
            <button onClick={reset}
              className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-400 hover:text-red-500">
              Сбросить всё
            </button>
          </div>
        )}

        {/* Row 3: Сохранённые фильтры — горизонтальный скролл */}
        {savedFilters.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {savedFilters.map(f => (
              <button
                key={f.id}
                onClick={() => applyFilter(f)}
                className="flex flex-shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 whitespace-nowrap"
              >
                <BookmarkCheck className="h-3 w-3" />
                {f.name}
              </button>
            ))}
          </div>
        )}

        {/* Drawer */}
        {open && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <div className="relative ml-auto h-full w-full max-w-sm overflow-y-auto bg-white shadow-xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
                <h2 className="font-semibold text-gray-800">Фильтры</h2>
                <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-gray-100">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="p-5">
                {filterForm}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
