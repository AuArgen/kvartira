import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, Clock, ExternalLink, ArrowLeft, Building2 } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/Badge'
import { formatPrice, formatDate } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

export default async function ListingPage({ params }: Props) {
  const { id } = await params
  const listing = await prisma.listing.findUnique({
    where: { id: parseInt(id) },
    include: {
      city: true,
      district: true,
      images: { orderBy: [{ isMain: 'desc' }, { sortOrder: 'asc' }] },
      params: { orderBy: { paramId: 'asc' } },
    },
  })

  if (!listing) notFound()

  const price = listing.price?.toNumber() ?? null
  const oldPrice = listing.oldPrice?.toNumber() ?? null
  const isDaily = listing.categoryId === 2045
  const isLongterm = listing.categoryId === 2044

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Навигация */}
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" />
        Назад к объявлениям
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Левая колонка: фото + описание */}
        <div className="lg:col-span-2 space-y-4">
          {/* Галерея */}
          {listing.images.length > 0 ? (
            <div className="space-y-2">
              {/* Главное фото */}
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src={
                    listing.images[0].originalWebpUrl ??
                    listing.images[0].originalUrl ??
                    listing.images[0].thumbnailUrl ?? ''
                  }
                  alt={listing.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* Превью */}
              {listing.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {listing.images.slice(1).map((img) => (
                    <div key={img.id} className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={img.thumbnailWebpUrl ?? img.thumbnailUrl ?? img.originalUrl ?? ''}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-gray-100">
              <Building2 className="h-16 w-16 text-gray-300" />
            </div>
          )}

          {/* Описание */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-gray-800">Описание</h2>
            {listing.description ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                {listing.description}
              </p>
            ) : (
              <p className="text-sm text-gray-400">Описание не указано</p>
            )}
          </div>

          {/* Параметры */}
          {listing.params.length > 0 && (
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-gray-800">Характеристики</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {listing.params.map((p) => (
                  <div key={p.id} className="flex justify-between border-b border-gray-50 py-1.5 text-sm">
                    <span className="text-gray-500">{p.paramName}</span>
                    <span className="font-medium text-gray-800">{p.paramValue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Комментарии — placeholder */}
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-5 text-center text-sm text-gray-400">
            Комментарии будут доступны после авторизации
          </div>
        </div>

        {/* Правая колонка: цена + контакты */}
        <div className="space-y-4">
          {/* Карточка с ценой */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            {/* Бейджи */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {listing.source === 'lalafo' && <Badge variant="lalafo">Lalafo</Badge>}
              {listing.isVip && <Badge variant="vip">VIP</Badge>}
              {listing.isSelect && <Badge variant="select">Select</Badge>}
              {listing.isPremium && <Badge variant="premium">Premium</Badge>}
              {isDaily && <Badge variant="daily">Посуточно</Badge>}
              {isLongterm && <Badge variant="longterm">Долгосрочно</Badge>}
            </div>

            <h1 className="text-base font-semibold text-gray-900 leading-snug">{listing.title}</h1>

            {/* Цена */}
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(price, listing.currency ?? 'KGS')}
              </span>
              {oldPrice && (
                <span className="text-sm text-gray-400 line-through">
                  {oldPrice.toLocaleString('ru-RU')}
                </span>
              )}
            </div>
            {listing.isNegotiable && (
              <p className="mt-0.5 text-xs text-gray-400">Возможен торг</p>
            )}

            {/* Локация */}
            {(listing.cityName || listing.district) && (
              <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span>{[listing.cityName, listing.district?.name].filter(Boolean).join(', ')}</span>
              </div>
            )}

            {/* Телефон */}
            {listing.phone && (
              <div className="mt-2">
                <a
                  href={`tel:${listing.phone}`}
                  className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100"
                >
                  <Phone className="h-4 w-4" />
                  {listing.phone}
                </a>
              </div>
            )}

            {/* Ссылка на Lalafo */}
            {listing.lalafoUrl && (
              <a
                href={listing.lalafoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
              >
                <ExternalLink className="h-4 w-4" />
                Открыть на Lalafo
              </a>
            )}

            {/* Дата */}
            <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {formatDate(listing.lalafoCreatedAt ?? listing.createdAt)}
              </span>
            </div>
          </div>

          {/* Реакции — placeholder */}
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-center">
            <p className="text-xs text-gray-400">Лайки и избранное — после авторизации</p>
          </div>
        </div>
      </div>
    </div>
  )
}
