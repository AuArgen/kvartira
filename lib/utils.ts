import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | null, currency = 'KGS'): string {
  if (price == null) return 'Договорная'
  return `${price.toLocaleString('ru-RU')} ${currency}`
}

export function formatDate(date: Date | string | null): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  if (diff < 60_000) return 'только что'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} мин. назад`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} ч. назад`
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)} дн. назад`

  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function getCategoryLabel(categoryId: number | null): string {
  if (categoryId === 2045) return 'Посуточно'
  if (categoryId === 2044) return 'Долгосрочная'
  return 'Аренда'
}
