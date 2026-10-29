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
import { WeeklyActivityChart } from '@/components/health/charts'
import { SectionTitle, StatCard } from '@/components/health/shared'
import {
  computeBmi,
  computeCalorieTarget,
  HEALTH_TIPS,
  suggestExercises,
  type Profile,
  type SummaryResponse,
} from '@/lib/health'

interface InsightsProps {
  summary: SummaryResponse
  profile: Profile
  updateProfile: (patch: Partial<Profile>) => void
}

export function Insights({ summary, profile, updateProfile }: InsightsProps) {
  const [editing, setEditing] = useState(false)
  const calorieTarget = computeCalorieTarget(profile)
  const { bmi, label } = computeBmi(profile)

  const activeDays = summary.weekly.filter(
    (d) => d.caloriesIn > 0 || d.steps > 0 || d.caloriesBurned > 0
  ).length
  const avgSteps = Math.round(
    summary.weekly.reduce((s, d) => s + d.steps, 0) / 7
  )
  const avgIn = Math.round(summary.weekly.reduce((s, d) => s + d.caloriesIn, 0) / 7)
  const bestDay = summary.weekly.reduce((best, d) =>
    d.steps > best.steps ? d : best, summary.weekly[0])
  const exercises = suggestExercises(profile, summary.todayStats, calorieTarget)

  return (
    <div className="space-y-5 sm:space-y-6">
      <SectionTitle icon="📈" title="Insights & trends" hint="How your week is going" />

      {/* Weekly summary stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon="📅" label="Active days" value={`${activeDays}/7`} sub="days with any logged activity" tone="emerald" />
        <StatCard icon="👟" label="Avg steps / day" value={avgSteps} sub="aim for 8,000+" tone="amber" />
        <StatCard icon="🍽️" label="Avg intake / day" value={avgIn} unit="kcal" sub={`target ${calorieTarget.toLocaleString()}`} tone="orange" />
        <StatCard
          icon="🏆"
          label="Best day"
          value={`${bestDay.steps.toLocaleString()} steps`}
          sub="most steps this week"
          tone="red"
        />
      </div>

      {/* Day-to-day graph (main) */}
      <WeeklyActivityChart weekly={summary.weekly} />

      {/* Weekly day table for accessibility/small screens */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Week at a glance</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Numbers behind the graph</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Day</th>
                  <th className="pb-2 pr-3 font-medium">Steps</th>
                  <th className="pb-2 pr-3 font-medium">Eaten</th>
                  <th className="pb-2 pr-3 font-medium">Burned</th>
                  <th className="pb-2 font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {summary.weekly.map((d) => {
                  const net = d.caloriesIn - d.caloriesBurned
                  return (
                    <tr key={d.date} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                      <td className="py-2 pr-3">{d.steps.toLocaleString()}</td>
                      <td className="py-2 pr-3">{d.caloriesIn.toLocaleString()} kcal</td>
                      <td className="py-2 pr-3">{d.caloriesBurned.toLocaleString()} kcal</td>
                      <td className={`py-2 font-semibold ${net > calorieTarget ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {net.toLocaleString()} kcal
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Personal plan */}
      <div>
        <SectionTitle icon="🎯" title="Your personal plan" hint="Generated from your profile & today's numbers" />
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">Recommended exercises today</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Calorie burn estimated at {profile.weightKg} kg</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {exercises.map((e) => (
                <div key={e.name} className="flex items-start gap-3 rounded-lg border p-3">
                  <span aria-hidden className="text-xl">{e.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {e.name} — {e.minutes} min <span className="font-normal text-muted-foreground">≈ {e.burn} kcal</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{e.reason}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">Your body metrics</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Mifflin-St Jeor estimate</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">BMI</p>
                <p className="text-lg font-bold">{bmi}</p>
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Daily target</p>
                <p className="text-lg font-bold">{calorieTarget.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">kcal/day</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Goal</p>
                <p className="text-lg font-bold capitalize">{profile.goal}</p>
                <p className="text-[11px] text-muted-foreground">weight</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Health tips */}
      <div>
        <SectionTitle icon="💡" title="Health tips" hint="Small habits, big results" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HEALTH_TIPS.map((t) => (
            <Card key={t.title} className="border shadow-sm">
              <CardContent className="p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <span aria-hidden className="text-lg">{t.icon}</span> {t.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Profile settings */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg">Your profile</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Used to personalize calorie targets & exercise burn estimates
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing((v) => !v)
                if (editing) toast({ title: 'Profile saved ✓' })
              }}
            >
              {editing ? 'Done' : '✏️ Edit'}
            </Button>
          </div>
        </CardHeader>
        {editing ? (
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Name</Label>
              <Input id="p-name" value={profile.name} placeholder="Your name" onChange={(e) => updateProfile({ name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-age">Age</Label>
              <Input id="p-age" type="number" min="5" max="100" value={profile.age} onChange={(e) => updateProfile({ age: Number(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={profile.gender} onValueChange={(v) => updateProfile({ gender: v as Profile['gender'] })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-weight">Weight (kg)</Label>
              <Input id="p-weight" type="number" min="20" max="300" value={profile.weightKg} onChange={(e) => updateProfile({ weightKg: Number(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-height">Height (cm)</Label>
              <Input id="p-height" type="number" min="80" max="250" value={profile.heightCm} onChange={(e) => updateProfile({ heightCm: Number(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1.5">
              <Label>Goal</Label>
              <Select value={profile.goal} onValueChange={(v) => updateProfile({ goal: v as Profile['goal'] })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose">Lose weight</SelectItem>
                  <SelectItem value="maintain">Maintain</SelectItem>
                  <SelectItem value="gain">Gain muscle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Activity level</Label>
              <Select value={profile.activityLevel} onValueChange={(v) => updateProfile({ activityLevel: v as Profile['activityLevel'] })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary (desk job)</SelectItem>
                  <SelectItem value="light">Lightly active</SelectItem>
                  <SelectItem value="moderate">Moderately active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
              <span className="rounded-full bg-muted px-3 py-1.5 font-medium">{profile.name || 'Anonymous'} </span>
              <span className="rounded-full bg-muted px-3 py-1.5">{profile.age} yrs</span>
              <span className="rounded-full bg-muted px-3 py-1.5 capitalize">{profile.gender}</span>
              <span className="rounded-full bg-muted px-3 py-1.5">{profile.weightKg} kg</span>
              <span className="rounded-full bg-muted px-3 py-1.5">{profile.heightCm} cm</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1.5 font-medium capitalize text-emerald-800">{profile.goal} weight</span>
              <span className="rounded-full bg-muted px-3 py-1.5 capitalize">{profile.activityLevel}</span>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
