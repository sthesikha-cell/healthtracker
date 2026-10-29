'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  CaloriePieChart,
  WeeklyActivityChart,
} from '@/components/health/charts'
import { EmptyHint, SectionTitle, StatCard } from '@/components/health/shared'
import {
  computeCalorieTarget,
  MEAL_LABELS,
  prettyDate,
  suggestDiet,
  suggestExercises,
  tipOfTheDay,
  type FoodEntry,
  type Profile,
  type SummaryResponse,
} from '@/lib/health'

interface DashboardProps {
  summary: SummaryResponse
  foods: FoodEntry[]
  profile: Profile
  onGoToTab: (tab: 'food' | 'activity' | 'insights') => void
}

export function Dashboard({ summary, foods, profile, onGoToTab }: DashboardProps) {
  const today = summary.today
  const stats = summary.todayStats
  const calorieTarget = computeCalorieTarget(profile)
  const net = stats.caloriesIn - stats.caloriesBurned
  const targetProgress = Math.min(100, Math.round((stats.caloriesIn / Math.max(1, calorieTarget)) * 100))
  const diet = suggestDiet(foods, today, calorieTarget)
  const exercises = suggestExercises(profile, stats, calorieTarget)
  const tip = tipOfTheDay(today)
  const stepsGoal = 8000
  const stepsProgress = Math.min(100, Math.round((stats.steps / stepsGoal) * 100))
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            {greeting}{profile.name ? `, ${profile.name}` : ''}! 👋
          </h2>
          <p className="text-sm text-muted-foreground">{prettyDate(today)} · here&apos;s your day at a glance</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
          onClick={() => onGoToTab('activity')}
        >
          ✏️ Update today&apos;s activity
        </Button>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon="👟"
          label="Steps today"
          value={stats.steps}
          unit="steps"
          sub={`${stepsProgress}% of ${stepsGoal.toLocaleString()} goal`}
          tone="emerald"
        />
        <StatCard
          icon="🍽️"
          label="Calories eaten"
          value={stats.caloriesIn}
          unit="kcal"
          sub={`${stats.meals} meal${stats.meals === 1 ? '' : 's'} logged`}
          tone="amber"
        />
        <StatCard
          icon="🔥"
          label="Calories burned"
          value={stats.caloriesBurned}
          unit="kcal"
          sub={`${stats.walkMinutes + stats.activityMinutes} active minutes`}
          tone="orange"
        />
        <StatCard
          icon="⚖️"
          label="Net calories"
          value={net}
          unit="kcal"
          sub={`Target ${calorieTarget.toLocaleString()} kcal`}
          tone={net > calorieTarget ? 'red' : 'emerald'}
        />
      </div>

      {/* Targets progress */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Daily targets</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Based on your profile · {profile.goal === 'maintain' ? 'maintain weight' : profile.goal === 'lose' ? 'lose weight' : 'gain muscle'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium">Calorie budget</span>
              <span className="text-muted-foreground">
                {stats.caloriesIn.toLocaleString()} / {calorieTarget.toLocaleString()} kcal
              </span>
            </div>
            <Progress value={targetProgress} className="h-2.5" />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium">Step goal</span>
              <span className="text-muted-foreground">
                {stats.steps.toLocaleString()} / {stepsGoal.toLocaleString()} steps
              </span>
            </div>
            <Progress value={stepsProgress} className="h-2.5" />
          </div>
        </CardContent>
      </Card>

      {/* Pie chart + today's meals */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CaloriePieChart data={summary.mealBreakdown} />
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Today&apos;s meals</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Time & calories of everything you ate</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.topFoods.length === 0 ? (
              <EmptyHint icon="🍳">
                Nothing logged yet — head to the <strong>Food</strong> tab to add your breakfast,
                lunch, dinner and snacks with their times and calories.
              </EmptyHint>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {summary.topFoods.map((f) => (
                  <li
                    key={`${f.name}-${f.time}-${f.mealType}`}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{f.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {MEAL_LABELS[f.mealType] ?? f.mealType} · {f.time}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      {f.calories.toLocaleString()} kcal
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* What to eat next */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm dark:from-emerald-950/40 dark:to-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            🥑 What should you eat next?
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">{diet.message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Suggested {MEAL_LABELS[diet.nextMeal]} options
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {diet.options.slice(0, 3).map((o) => (
              <div key={o.name} className="rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug">{o.name}</p>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                    {o.kcal} kcal
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{o.note}</p>
              </div>
            ))}
          </div>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onGoToTab('food')}>
            + Log a meal
          </Button>
        </CardContent>
      </Card>

      {/* Personal exercise suggestions */}
      <div>
        <SectionTitle icon="💪" title="Suggested exercises for you" hint="Tuned to today's activity & your goal" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {exercises.map((e) => (
            <Card key={e.name} className="border shadow-sm">
              <CardContent className="flex items-start gap-3 p-4">
                <span aria-hidden className="text-2xl">{e.icon}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="font-semibold">{e.name}</p>
                    <span className="text-xs text-muted-foreground">· {e.minutes} min · ≈{e.burn} kcal</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{e.reason}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tip of the day */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm dark:from-amber-950/40 dark:to-card">
        <CardContent className="flex items-start gap-3 p-4 sm:p-5">
          <span aria-hidden className="text-2xl">{tip.icon}</span>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Health tip of the day · {tip.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{tip.text}</p>
          </div>
        </CardContent>
      </Card>

      {/* Weekly chart preview */}
      <WeeklyActivityChart weekly={summary.weekly} />
    </div>
  )
}
