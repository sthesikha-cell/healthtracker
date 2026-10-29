'use client'

import { useCallback, useEffect, useState } from 'react'
import type {
  ActivityEntry,
  FoodEntry,
  SummaryResponse,
  WalkEntry,
} from '@/lib/health'

export interface HealthData {
  summary: SummaryResponse | null
  foods: FoodEntry[]
  walks: WalkEntry[]
  activities: ActivityEntry[]
}

export function useHealthData() {
  const [data, setData] = useState<HealthData>({
    summary: null,
    foods: [],
    walks: [],
    activities: [],
  })
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => {
    setLoading(true)
    setRefreshKey((k) => k + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    Promise.all([
      fetch('/api/summary').then((r) => (r.ok ? r.json() : Promise.reject(new Error('summary')))),
      fetch('/api/foods').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/walks').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/activities').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([summary, foods, walks, activities]) => {
        if (cancelled) return
        setData({ summary, foods, walks, activities })
      })
      .catch(() => {
        if (!cancelled) setData({ summary: null, foods: [], walks: [], activities: [] })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [refreshKey])

  return { ...data, loading, refresh }
}
