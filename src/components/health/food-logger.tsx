'use client'

import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CaloriePieChart } from '@/components/health/charts'
import { EmptyHint, SectionTitle } from '@/components/health/shared'
import {
  FOOD_SUGGESTIONS,
  MEALS,
  MEAL_LABELS,
  nowTimeStr,
  todayStr,
  type FoodEntry,
  type MealType,
  type SummaryResponse,
} from '@/lib/health'

interface FoodLoggerProps {
  foods: FoodEntry[]
  summary: SummaryResponse
  calorieTarget: number
  refresh: () => void
}

export function FoodLogger({ foods, summary, calorieTarget, refresh }: FoodLoggerProps) {
  const today = todayStr()
  const [name, setName] = useState('')
  const [mealType, setMealType] = useState<MealType>(guessMeal())
  const [time, setTime] = useState(nowTimeStr())
  const [calories, setCalories] = useState('')
  const [saving, setSaving] = useState(false)

  function guessMeal(): MealType {
    const h = new Date().getHours()
    if (h < 11) return 'breakfast'
    if (h < 16) return 'lunch'
    if (h < 21) return 'dinner'
    return 'snack'
  }

  async function addFood(e: React.FormEvent) {
    e.preventDefault()
    const kcal = Number(calories)
    if (!name.trim() || !calories || !Number.isFinite(kcal) || kcal < 0) {
      toast({ title: 'Missing details', description: 'Please enter the food name and its calories.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, name: name.trim(), mealType, time, calories: kcal }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast({
        title: 'Meal logged! 🍽️',
        description: `${name.trim()} (${Math.round(kcal)} kcal) added at ${time}. Your pie chart is updated!`,
      })
      setName('')
      setCalories('')
      setTime(nowTimeStr())
      setMealType(guessMeal())
      refresh()
    } catch {
      toast({ title: 'Could not save meal', description: 'Please try again.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function removeFood(id: string) {
    try {
      await fetch(`/api/entries/${id}?type=food`, { method: 'DELETE' })
      toast({ title: 'Meal removed' })
      refresh()
    } catch {
      toast({ title: 'Could not remove meal', variant: 'destructive' })
    }
  }

  const todayFoods = foods.filter((f) => f.date === today)
  const totalIn = todayFoods.reduce((s, f) => s + f.calories, 0)
  const remaining = Math.max(0, calorieTarget - totalIn)

  return (
    <div className="space-y-5 sm:space-y-6">
      <SectionTitle
        icon="🍽️"
        title="Food log"
        hint={`${totalIn.toLocaleString()} kcal eaten today · ${remaining.toLocaleString()} kcal left in budget`}
      />

      {/* Add food form */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">What did you eat?</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Log every meal with the time you ate it — the pie chart & totals update instantly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addFood} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
            <div className="space-y-1.5 lg:col-span-2">
              <Label htmlFor="food-name">Food / dish</Label>
              <Input
                id="food-name"
                placeholder="e.g. Grilled chicken salad"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="food-meal">Meal</Label>
              <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
                <SelectTrigger id="food-meal" className="w-full">
                  <SelectValue placeholder="Meal" />
                </SelectTrigger>
                <SelectContent>
                  {MEALS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {MEAL_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="food-time">Time eaten</Label>
              <Input id="food-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="food-cal">Calories (kcal)</Label>
              <Input
                id="food-cal"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="e.g. 450"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 sm:col-span-2 lg:col-span-5"
            >
              {saving ? 'Saving…' : '+ Add to food log'}
            </Button>
          </form>

          {/* Quick add common foods */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Quick add (tap to pre-fill calories):
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '🍎 Apple', kcal: 95 },
                { label: '🍞 2 Chapati', kcal: 210 },
                { label: '🍚 1 cup Rice', kcal: 205 },
                { label: '🥛 Milk (1 cup)', kcal: 150 },
                { label: '☕ Tea with sugar', kcal: 60 },
                { label: '🥚 Boiled egg', kcal: 78 },
                { label: '☕ Black coffee', kcal: 5 },
                { label: '🍪 Biscuit (2)', kcal: 160 },
              ].map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => {
                    if (!calories) setCalories(String(q.kcal))
                    if (!name) setName(q.label.replace(/^[^ ]+ /, ''))
                  }}
                  className="rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-emerald-50 hover:text-emerald-800"
                >
                  {q.label} · {q.kcal}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pie chart update view */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CaloriePieChart data={summary.mealBreakdown} />

        {/* Today's list grouped by meal */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Today&apos;s food timeline</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Swipe to review · tap ✕ to remove a mistake</CardDescription>
          </CardHeader>
          <CardContent>
            {todayFoods.length === 0 ? (
              <EmptyHint icon="🥄">Your plate is empty (in the log!). Add your first meal above.</EmptyHint>
            ) : (
              <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {MEALS.filter((m) => todayFoods.some((f) => f.mealType === m)).map((m) => {
                  const mealFoods = todayFoods.filter((f) => f.mealType === m)
                  const mealTotal = mealFoods.reduce((s, f) => s + f.calories, 0)
                  return (
                    <div key={m}>
                      <div className="mb-1 flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--foreground)' }}>
                          {MEAL_LABELS[m]}
                        </p>
                        <span className="text-xs text-muted-foreground">{mealTotal.toLocaleString()} kcal</span>
                      </div>
                      <ul className="space-y-1.5">
                        {mealFoods.map((f) => (
                          <li key={f.id} className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{f.name}</p>
                              <p className="text-xs text-muted-foreground">🕘 {f.time}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                {f.calories.toLocaleString()} kcal
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => removeFood(f.id)}
                                aria-label={`Remove ${f.name}`}
                              >
                                ✕
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full diet suggestions */}
      <div>
        <SectionTitle
          icon="🥗"
          title="What to eat in a day — healthy plate guide"
          hint="Pick from these balanced options to stay within your budget"
        />
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {MEALS.map((m) => (
            <Card key={m} className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                  <span>{MEAL_LABELS[m]}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {todayFoods.filter((f) => f.mealType === m).length} logged today
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {FOOD_SUGGESTIONS[m].map((o) => (
                  <button
                    key={o.name}
                    type="button"
                    onClick={() => {
                      setName(o.name)
                      setMealType(m)
                      setCalories(String(o.kcal))
                      toast({ title: 'Pre-filled!', description: `${o.name} (${o.kcal} kcal) — adjust the time, then save.` })
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{o.name}</p>
                      <p className="text-[11px] text-muted-foreground">{o.note}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                      {o.kcal} kcal
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
