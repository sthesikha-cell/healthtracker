'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Profile } from '@/lib/health'
import { DEFAULT_PROFILE } from '@/lib/health'

const STORAGE_KEY = 'fittrack-profile'

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE)

  // Hydrate from localStorage after mount (deferred to avoid sync setState in effect)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          setProfile({ ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<Profile>) })
        }
      } catch {
        // ignore corrupted storage
      }
    }, 0)
    return () => clearTimeout(id)
  }, [])

  const update = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // storage may be unavailable
      }
      return next
    })
  }, [])

  return { profile, update }
}
