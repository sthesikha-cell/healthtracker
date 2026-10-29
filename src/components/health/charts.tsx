'use client'

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { dayLabel, MEAL_COLORS, MEAL_LABELS, type DaySummary } from '@/lib/health'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const PIE_COLORS = [MEAL_COLORS.breakfast, MEAL_COLORS.lunch, MEAL_COLORS.dinner, MEAL_COLORS.snack]

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">{children}</CardContent>
    </Card>
  )
}

export function CaloriePieChart({ data }: { data: { meal: string; calories: number }[] }) {
  const chartData = data.filter((d) => d.calories > 0)
  const total = chartData.reduce((s, d) => s + d.calories, 0)

  if (!chartData.length) {
    return (
      <ChartCard
        title="Today's Calorie Breakdown"
        description="Log your meals to see the pie chart update live."
      >
        <div className="flex h-[220px] sm:h-[280px] flex-col items-center justify-center gap-2 text-center">
          <span className="text-4xl" aria-hidden>
            🥗
          </span>
          <p className="text-sm text-muted-foreground px-6">
            No food logged yet today. Add your first meal in the <strong>Food</strong> tab and
            watch this chart fill up!
          </p>
        </div>
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title="Today's Calorie Breakdown"
      description={`${total.toLocaleString()} kcal total across meals`}
    >
      <div className="h-[240px] w-full sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="calories"
              nameKey="meal"
              cx="50%"
              cy="50%"
              innerRadius="45%"
              outerRadius="75%"
              paddingAngle={3}
              strokeWidth={2}
            >
              {chartData.map((entry) => (
                <Cell key={entry.meal} fill={MEAL_COLORS[entry.meal] ?? '#10b981'} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${Number(value).toLocaleString()} kcal (${Math.round((Number(value) / total) * 100)}%)`,
                MEAL_LABELS[name] ?? name,
              ]}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                fontSize: '12px',
              }}
            />
            <Legend
              verticalAlign="bottom"
              formatter={(value: string) => (
                <span className="text-xs sm:text-sm text-foreground">
                  {MEAL_LABELS[value] ?? value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

export function WeeklyActivityChart({ weekly }: { weekly: DaySummary[] }) {
  const data = weekly.map((d) => ({
    day: dayLabel(d.date),
    'Calories In': d.caloriesIn,
    'Calories Burned': d.caloriesBurned,
    Steps: d.steps,
  }))
  const hasAny = weekly.some((d) => d.caloriesIn > 0 || d.caloriesBurned > 0 || d.steps > 0)

  return (
    <ChartCard
      title="Day-to-Day Activity (Last 7 Days)"
      description="Bars = calories in vs burned · Line = daily steps"
    >
      {!hasAny ? (
        <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center">
          <span className="text-4xl" aria-hidden>
            📊
          </span>
          <p className="text-sm text-muted-foreground px-6">
            Your week is a blank canvas! Log food and activities to see your daily trends here.
          </p>
        </div>
      ) : (
        <div className="h-[260px] w-full sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis yAxisId="kcal" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis
                yAxisId="steps"
                orientation="right"
                tick={{ fontSize: 11 }}
                stroke="#9ca3af"
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar
                yAxisId="kcal"
                dataKey="Calories In"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                yAxisId="kcal"
                dataKey="Calories Burned"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Line
                yAxisId="steps"
                type="monotone"
                dataKey="Steps"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#f59e0b' }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  )
}

export function WeeklyStepsBars({ weekly }: { weekly: DaySummary[] }) {
  const data = weekly.map((d) => ({
    day: dayLabel(d.date),
    steps: d.steps,
  }))
  const goal = 8000
  return (
    <ChartCard title="Daily Steps" description={`Goal: ${goal.toLocaleString()} steps / day`}>
      <div className="h-[200px] w-full sm:h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <Tooltip
              formatter={(v: number) => [`${Number(v).toLocaleString()} steps`, 'Steps']}
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: '12px' }}
            />
            <Bar dataKey="steps" radius={[4, 4, 0, 0]} maxBarSize={36}>
              {data.map((d) => (
                <Cell key={d.day} fill={d.steps >= goal ? '#10b981' : '#6ee7b7'} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

export { PIE_COLORS }
