'use client'

import { useState } from 'react'
import { Activity, BarChart3, HeartPulse, UtensilsCrossed } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHealthData } from '@/hooks/use-health-data'
import { useProfile } from '@/hooks/use-profile'
import { ActivityTracker } from '@/components/health/activity-tracker'
import { Dashboard } from '@/components/health/dashboard'
import { FoodLogger } from '@/components/health/food-logger'
import { Insights } from '@/components/health/insights'
import { LoadingSkeletons } from '@/components/health/shared'
import { computeCalorieTarget, prettyDate, todayStr } from '@/lib/health'

type TabKey = 'dashboard' | 'food' | 'activity' | 'insights'

export default function Home() {
  const { summary, foods, walks, activities, loading, refresh } = useHealthData()
  const { profile, update } = useProfile()
  const [tab, setTab] = useState<TabKey>('dashboard')

  const calorieTarget = computeCalorieTarget(profile)

  const goToTab = (t: 'food' | 'activity' | 'insights') => setTab(t as TabKey)

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-50/60 via-background to-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <HeartPulse className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h1 className="text-base font-bold leading-tight tracking-tight sm:text-lg">FitTrack</h1>
              <p className="text-[11px] leading-tight text-muted-foreground sm:text-xs">
                Daily walk · food · health companion
              </p>
            </div>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium text-muted-foreground">{prettyDate(todayStr())}</p>
            <p className="text-[11px] text-muted-foreground">
              Budget: <span className="font-semibold text-emerald-700">{calorieTarget.toLocaleString()} kcal</span>
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-6 sm:py-6">
        {loading || !summary ? (
          <LoadingSkeletons />
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
            <TabsList className="mb-4 grid h-auto w-full grid-cols-4 gap-1 rounded-xl bg-muted p-1.5 sm:mb-6">
              <TabsTrigger
                value="dashboard"
                className="flex min-h-[44px] flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium sm:flex-row sm:gap-1.5 sm:text-sm"
              >
                <BarChart3 className="h-4 w-4" aria-hidden /> Overview
              </TabsTrigger>
              <TabsTrigger
                value="food"
                className="flex min-h-[44px] flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium sm:flex-row sm:gap-1.5 sm:text-sm"
              >
                <UtensilsCrossed className="h-4 w-4" aria-hidden /> Food
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="flex min-h-[44px] flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium sm:flex-row sm:gap-1.5 sm:text-sm"
              >
                <Activity className="h-4 w-4" aria-hidden /> Activity
              </TabsTrigger>
              <TabsTrigger
                value="insights"
                className="flex min-h-[44px] flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium sm:flex-row sm:gap-1.5 sm:text-sm"
              >
                <HeartPulse className="h-4 w-4" aria-hidden /> Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-0">
              <Dashboard summary={summary} foods={foods} profile={profile} onGoToTab={goToTab} />
            </TabsContent>
            <TabsContent value="food" className="mt-0">
              <FoodLogger foods={foods} summary={summary} calorieTarget={calorieTarget} refresh={refresh} />
            </TabsContent>
            <TabsContent value="activity" className="mt-0">
              <ActivityTracker walks={walks} activities={activities} summary={summary} profile={profile} refresh={refresh} />
            </TabsContent>
            <TabsContent value="insights" className="mt-0">
              <Insights summary={summary} profile={profile} updateProfile={update} />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-background/60 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto w-full max-w-6xl px-4 py-3 text-center sm:px-6">
          <p className="text-[11px] text-muted-foreground sm:text-xs">
            💚 FitTrack — log your walks & meals daily to see trends. Suggestions are general
            wellness guidance, not medical advice.
          </p>
        </div>
      </footer>
    </div>
  )
}
