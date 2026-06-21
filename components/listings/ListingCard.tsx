'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, Clock, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatPrice, formatDate } from '@/lib/utils'
import type { SerializedListing } from '@/lib/types'

interface Props {
  listing: SerializedListing
}

export function ListingCard({ listing }: Props) {
  const mainImage = listing.images[0]
  const imgUrl = mainImage?.thumbnailWebpUrl ?? mainImage?.thumbnailUrl ?? mainImage?.originalUrl

  const isDaily = listing.categoryId === 2045
  const isLongterm = listing.categoryId === 2044

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Фото */}
      <Link href={`/listings/${listing.id}`} className="relative block aspect-[4/3] overflow-hidden bg-gray-100">
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
        )}

        {/* Бейджи поверх фото */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {listing.source === 'lalafo' && <Badge variant="lalafo">Lalafo</Badge>}
          {listing.isVip && <Badge variant="vip">VIP</Badge>}
          {listing.isSelect && <Badge variant="select">Select</Badge>}
          {listing.isPremium && <Badge variant="premium">Premium</Badge>}
        </div>

        {/* Категория */}
        {(isDaily || isLongterm) && (
          <div className="absolute bottom-2 right-2">
            <Badge variant={isDaily ? 'daily' : 'longterm'}>
              {isDaily ? 'Посуточно' : 'Долгосрочно'}
            </Badge>
          </div>
        )}
      </Link>

      {/* Контент */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Цена */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(listing.price, listing.currency ?? 'KGS')}
          </span>
          {listing.oldPrice && (
            <span className="text-sm text-gray-400 line-through">
              {listing.oldPrice.toLocaleString('ru-RU')}
            </span>
          )}
          {listing.isNegotiable && (
            <span className="text-xs text-gray-400">(торг)</span>
          )}
        </div>

        {/* Название */}
        <Link href={`/listings/${listing.id}`} className="line-clamp-2 text-sm font-medium text-gray-800 hover:text-blue-600">
          {listing.title}
        </Link>

        {/* Собственник / риэлтор / тип сдачи */}
        {(listing.ownerType || listing.rentType === 'room') && (
          <div className="flex flex-wrap gap-1">
            {listing.ownerType === 'owner' && (
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                Собственник
              </span>
            )}
            {listing.ownerType === 'realtor' && (
              <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                Риэлтор
              </span>
            )}
            {listing.rentType === 'room' && (
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                Подселение
              </span>
            )}
          </div>
        )}

        {/* Локация */}
        {(listing.cityName || listing.district?.name) && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              {[listing.cityName, listing.district?.name].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {/* Телефон */}
        {listing.phone && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span>{listing.phone}</span>
          </div>
        )}

        {/* Нижняя часть */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            <span>{formatDate(listing.lalafoCreatedAt ?? listing.createdAt)}</span>
          </div>

          {/* Ссылка на Lalafo */}
          {listing.lalafoUrl && (
            <a
              href={listing.lalafoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              Lalafo
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
