'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X, Check, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

interface Props {
  options: SelectOption[]
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  single?: boolean   // single=true → работает как обычный select (один вариант)
}

export function MultiSelect({ options, value, onChange, placeholder = 'Выбрать...', single = false }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else setQuery('')
  }, [open])

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  function toggle(val: string) {
    if (single) {
      onChange(value[0] === val ? [] : [val])
      setOpen(false)
    } else {
      onChange(value.includes(val) ? value.filter(v => v !== val) : [...value, val])
    }
  }

  const selectedLabels = value
    .map(v => options.find(o => o.value === v)?.label)
    .filter(Boolean) as string[]

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm text-left transition-colors',
          open ? 'border-blue-400 ring-1 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
        )}
      >
        <span className={cn('truncate', !value.length && 'text-gray-400')}>
          {value.length === 0
            ? placeholder
            : value.length === 1
              ? selectedLabels[0]
              : `Выбрано: ${value.length}`}
        </span>
        <div className="flex items-center gap-1">
          {value.length > 0 && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onChange([]) }}
              className="rounded p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {/* Теги выбранных (для multi) */}
      {!single && value.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {selectedLabels.map((label, i) => (
            <span
              key={value[i]}
              className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
            >
              {label}
              <button type="button" onClick={() => toggle(value[i])}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Выпадающий список */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          {/* Поиск внутри списка */}
          <div className="border-b border-gray-100 p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Поиск..."
                className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-xs focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Список */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-400">Ничего не найдено</p>
            ) : (
              filtered.map(opt => {
                const selected = value.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggle(opt.value)}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-gray-50',
                      selected && 'bg-blue-50/50'
                    )}
                  >
                    {!single && (
                      <div className={cn(
                        'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors',
                        selected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                      )}>
                        {selected && <Check className="h-3 w-3 text-white" />}
                      </div>
                    )}
                    {single && selected && <Check className="h-4 w-4 flex-shrink-0 text-blue-600" />}
                    {single && !selected && <div className="h-4 w-4 flex-shrink-0" />}
                    <span className="truncate text-left">{opt.label}</span>
                  </button>
                )
              })
            )}
          </div>

          {!single && value.length > 0 && (
            <div className="border-t border-gray-100 p-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full rounded py-1 text-xs text-gray-500 hover:text-red-500"
              >
                Снять все
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
