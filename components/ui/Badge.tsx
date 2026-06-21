import { cn } from '@/lib/utils'

type Variant = 'lalafo' | 'vip' | 'select' | 'premium' | 'daily' | 'longterm' | 'default'

interface BadgeProps {
  variant?: Variant
  className?: string
  children: React.ReactNode
}

const styles: Record<Variant, string> = {
  lalafo: 'bg-orange-500 text-white',
  vip: 'bg-yellow-400 text-yellow-900',
  select: 'bg-purple-500 text-white',
  premium: 'bg-blue-600 text-white',
  daily: 'bg-emerald-100 text-emerald-700',
  longterm: 'bg-blue-100 text-blue-700',
  default: 'bg-gray-100 text-gray-600',
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
