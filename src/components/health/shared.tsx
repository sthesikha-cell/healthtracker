'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function StatCard({
  icon,
  label,
  value,
  unit,
  sub,
  tone = 'emerald',
}: {
  icon: string
  label: string
  value: string | number
  unit?: string
  sub?: string
  tone?: 'emerald' | 'amber' | 'orange' | 'red'
}) {
  const tones: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    orange: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    red: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  }
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className={cn('flex h-8 w-8 items-center justify-center rounded-full text-base', tones[tone])}
          >
            {icon}
          </span>
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
        </div>
        <p className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit ? <span className="ml-1 text-xs font-medium text-muted-foreground">{unit}</span> : null}
        </p>
        {sub ? <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">{sub}</p> : null}
      </CardContent>
    </Card>
  )
}

export function SectionTitle({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
        <span aria-hidden>{icon}</span>
        {title}
      </h2>
      {hint ? <p className="text-xs text-muted-foreground sm:text-sm">{hint}</p> : null}
    </div>
  )
}

export function LoadingSkeletons() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}

export function EmptyHint({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-6 text-center">
      <span className="text-2xl" aria-hidden>
        {icon}
      </span>
      <p className="px-6 text-xs text-muted-foreground sm:text-sm">{children}</p>
    </div>
  )
}
