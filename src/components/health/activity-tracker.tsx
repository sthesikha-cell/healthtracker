'use client'

import { useMemo, useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WeeklyActivityChart, WeeklyStepsBars } from '@/components/health/charts'
import { EmptyHint, SectionTitle, StatCard } from '@/components/health/shared'
import {
  estimateStepsFromDistance,
  estimateWalkDistance,
  EXERCISE_TYPES,
  exerciseCalories,
  prettyDate,
  todayStr,
  type ActivityEntry,
  type Profile,
  type SummaryResponse,
  type WalkEntry,
} from '@/lib/health'

interface ActivityTrackerProps {
  walks: WalkEntry[]
  activities: ActivityEntry[]
  summary: SummaryResponse
  profile: Profile
  refresh: () => void
}

export function ActivityTracker({ walks, activities, summary, profile, refresh }: ActivityTrackerProps) {
  const today = todayStr()

  // Walk form
  const [steps, setSteps] = useState('')
  const [walkMinutes, setWalkMinutes] = useState('')
  const [distance, setDistance] = useState('')
  const [walkSaving, setWalkSaving] = useState(false)

  // Exercise form
  const [exName, setExName] = useState(EXERCISE_TYPES[0].name)
  const [exMinutes, setExMinutes] = useState('')
  const [exBurnOverride, setExBurnOverride] = useState('')
  const [exSaving, setExSaving] = useState(false)

  const todayWalks = walks.filter((w) => w.date === today)
  const todayActivities = activities.filter((a) => a.date === today)

  const walkPreview = useMemo(() => {
    const s = Number(steps) || 0
    const km = distance ? Number(distance) : estimateWalkDistance(s)
    const kcal = Math.round(s * 0.04)
    return { steps: s, km, kcal }
  }, [steps, distance])

  const exPreview = useMemo(() => {
    const mins = Number(exMinutes) || 0
    const burn =
      exBurnOverride !== ''
        ? Number(exBurnOverride)
        : exerciseCalories(exName, mins, profile.weightKg)
    return { mins, burn: Math.max(0, Math.round(burn)) }
  }, [exName, exMinutes, exBurnOverride, profile.weightKg])

  const stats = summary.todayStats

  async function addWalk(e: React.FormEvent) {
    e.preventDefault()
    const s = Number(steps)
    if (!steps || !Number.isFinite(s) || s < 0) {
      toast({ title: 'Steps required', description: 'Enter the number of steps you walked today.', variant: 'destructive' })
      return
    }
    setWalkSaving(true)
    try {
      const km = distance ? Number(distance) : estimateWalkDistance(s)
      const res = await fetch('/api/walks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          steps: Math.round(s),
          minutes: Number(walkMinutes) || 0,
          distanceKm: km,
        }),
      })
      if (!res.ok) throw new Error()
      toast({
        title: 'Walk updated! 👟',
        description: `Result: +${Math.round(s * 0.04).toLocaleString()} kcal burned · ${Math.round(s).toLocaleString()} steps · ${km} km added to today.`,
      })
      setSteps('')
      setWalkMinutes('')
      setDistance('')
      refresh()
    } catch {
      toast({ title: 'Could not save walk', variant: 'destructive' })
    } finally {
      setWalkSaving(false)
    }
  }

  async function addActivity(e: React.FormEvent) {
    e.preventDefault()
    if (!exName.trim()) {
      toast({ title: 'Pick an exercise', variant: 'destructive' })
      return
    }
    setExSaving(true)
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          name: exName.trim(),
          minutes: exPreview.mins,
          caloriesBurned: exPreview.burn,
        }),
      })
      if (!res.ok) throw new Error()
      toast({
        title: 'Activity updated! 💪',
        description: `Result: ${exName} · ${exPreview.mins} min · ≈${exPreview.burn.toLocaleString()} kcal burned.`,
      })
      setExMinutes('')
      setExBurnOverride('')
      refresh()
    } catch {
      toast({ title: 'Could not save activity', variant: 'destructive' })
    } finally {
      setExSaving(false)
    }
  }

  async function removeEntry(id: string, type: 'walk' | 'activity') {
    try {
      await fetch(`/api/entries/${id}?type=${type}`, { method: 'DELETE' })
      toast({ title: 'Entry removed' })
      refresh()
    } catch {
      toast({ title: 'Could not remove entry', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <SectionTitle
        icon="🏃"
        title="Today's activity"
        hint="Update what you've done — see results instantly"
      />

      {/* Result stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon="👟" label="Steps" value={stats.steps} unit="steps" tone="emerald" />
        <StatCard
          icon="🛣️"
          label="Distance"
          value={Math.round(todayWalks.reduce((s, w) => s + w.distanceKm, 0) * 10) / 10}
          unit="km"
          tone="emerald"
        />
        <StatCard icon="⏱️" label="Active minutes" value={stats.walkMinutes + stats.activityMinutes} unit="min" tone="amber" />
        <StatCard icon="🔥" label="Total burned" value={stats.caloriesBurned} unit="kcal" tone="orange" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Walk form */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">👟 Update your walk</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Enter steps — we estimate distance & calories (leave distance blank to auto-fill).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addWalk} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="walk-steps">Steps</Label>
                  <Input
                    id="walk-steps"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="e.g. 5000"
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="walk-min">Minutes</Label>
                  <Input
                    id="walk-min"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="e.g. 45"
                    value={walkMinutes}
                    onChange={(e) => setWalkMinutes(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="walk-km">Distance (km)</Label>
                  <Input
                    id="walk-km"
                    type="number"
                    min="0"
                    step="0.1"
                    inputMode="decimal"
                    placeholder="auto"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                  />
                </div>
              </div>

              {walkPreview.steps > 0 && (
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Result preview: <strong>{walkPreview.steps.toLocaleString()} steps</strong> ≈{' '}
                  <strong>{walkPreview.km} km</strong> ≈ <strong>{walkPreview.kcal.toLocaleString()} kcal</strong> burned
                  {distance ? ' (using your distance)' : ' (auto-estimated)'}
                  {Number(walkMinutes) > 0 && <> · {walkPreview.km > 0 && Number(walkMinutes) > 0 ? `${(walkPreview.km / (Number(walkMinutes) / 60)).toFixed(1)} km/h pace` : ''}</>}
                </div>
              )}
              <Button type="submit" disabled={walkSaving} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {walkSaving ? 'Saving…' : '+ Update today\'s walk'}
              </Button>
            </form>

            {todayWalks.length > 0 && (
              <ul className="mt-4 max-h-40 space-y-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {todayWalks.map((w) => (
                  <li key={w.id} className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2">
                    <p className="text-sm">
                      <strong>{w.steps.toLocaleString()}</strong> steps · {w.minutes} min · {w.distanceKm} km
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                        {Math.round(w.steps * 0.04).toLocaleString()} kcal
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeEntry(w.id, 'walk')}
                        aria-label="Remove walk entry"
                      >
                        ✕
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Exercise form */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">💪 Update other exercises</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Pick a workout — calories are estimated for {profile.weightKg} kg body weight (you can override).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addActivity} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Exercise</Label>
                <div className="flex flex-wrap gap-1.5">
                  {EXERCISE_TYPES.map((ex) => (
                    <button
                      key={ex.name}
                      type="button"
                      onClick={() => setExName(ex.name)}
                      aria-pressed={exName === ex.name}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        exName === ex.name
                          ? 'border-orange-400 bg-orange-100 text-orange-900'
                          : 'bg-muted/50 hover:bg-orange-50'
                      }`}
                    >
                      {ex.icon} {ex.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ex-min">Minutes</Label>
                  <Input
                    id="ex-min"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="e.g. 30"
                    value={exMinutes}
                    onChange={(e) => setExMinutes(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ex-burn">Calories burned (optional)</Label>
                  <Input
                    id="ex-burn"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder={exPreview.burn ? String(exPreview.burn) : 'auto'}
                    value={exBurnOverride}
                    onChange={(e) => setExBurnOverride(e.target.value)}
                  />
                </div>
              </div>
              {exPreview.mins > 0 && (
                <div className="rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                  Result preview: <strong>{exName}</strong> · {exPreview.mins} min ≈{' '}
                  <strong>{exPreview.burn.toLocaleString()} kcal</strong> burned
                </div>
              )}
              <Button type="submit" disabled={exSaving} className="w-full bg-orange-600 hover:bg-orange-700">
                {exSaving ? 'Saving…' : '+ Update today\'s exercise'}
              </Button>
            </form>

            {todayActivities.length > 0 && (
              <ul className="mt-4 max-h-40 space-y-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {todayActivities.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2">
                    <p className="text-sm">
                      <strong>{a.name}</strong> · {a.minutes} min
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-800">
                        {a.caloriesBurned.toLocaleString()} kcal
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeEntry(a.id, 'activity')}
                        aria-label={`Remove ${a.name}`}
                      >
                        ✕
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent history */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Recent activity history</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Last entries across days</CardDescription>
        </CardHeader>
        <CardContent>
          {walks.length === 0 && activities.length === 0 ? (
            <EmptyHint icon="🗓️">
              No activity logged yet. Update your walk or exercise above to start building history.
            </EmptyHint>
          ) : (
            <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
              {[
                ...walks.map((w) => ({
                  key: `w-${w.id}`,
                  date: w.date,
                  icon: '👟',
                  title: `${w.steps.toLocaleString()} steps · ${w.minutes} min · ${w.distanceKm} km`,
                  kcal: Math.round(w.steps * 0.04),
                })),
                ...activities.map((a) => ({
                  key: `a-${a.id}`,
                  date: a.date,
                  icon: '💪',
                  title: `${a.name} · ${a.minutes} min`,
                  kcal: a.caloriesBurned,
                })),
              ]
                .sort((a, b) => (a.date < b.date ? 1 : -1))
                .slice(0, 15)
                .map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2">
                    <p className="min-w-0 truncate text-sm">
                      <span aria-hidden className="mr-1.5">{item.icon}</span>
                      <span className="text-xs text-muted-foreground">{prettyDate(item.date)}</span>{' '}
                      {item.title}
                    </p>
                    <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-800">
                      {item.kcal.toLocaleString()} kcal
                    </span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day-to-day graphs */}
      <div className="grid gap-4 xl:grid-cols-2">
        <WeeklyActivityChart weekly={summary.weekly} />
        <WeeklyStepsBars weekly={summary.weekly} />
      </div>
    </div>
  )
}
