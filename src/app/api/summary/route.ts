import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function GET(request: NextRequest) {
  try {
    const dateParam = request.nextUrl.searchParams.get('date')
    const today = dateParam ? new Date(dateParam + 'T00:00:00') : new Date()
    const todayStr = toDateStr(today)

    // Build last 7 days (oldest -> newest)
    const days: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      days.push(toDateStr(d))
    }

    const [foods, walks, activities] = await Promise.all([
      db.foodEntry.findMany({ where: { date: { in: days } } }),
      db.walkEntry.findMany({ where: { date: { in: days } } }),
      db.activityEntry.findMany({ where: { date: { in: days } } }),
    ])

    const daily = days.map((date) => {
      const dayFoods = foods.filter((f) => f.date === date)
      const dayWalks = walks.filter((w) => w.date === date)
      const dayActivities = activities.filter((a) => a.date === date)

      const caloriesIn = dayFoods.reduce((sum, f) => sum + f.calories, 0)
      const caloriesFromWalks = dayWalks.reduce((sum, w) => sum + Math.round(w.steps * 0.04), 0)
      const caloriesFromActivities = dayActivities.reduce((sum, a) => sum + a.caloriesBurned, 0)
      const steps = dayWalks.reduce((sum, w) => sum + w.steps, 0)
      const walkMinutes = dayWalks.reduce((sum, w) => sum + w.minutes, 0)
      const activityMinutes = dayActivities.reduce((sum, a) => sum + a.minutes, 0)

      return {
        date,
        caloriesIn,
        caloriesBurned: caloriesFromWalks + caloriesFromActivities,
        steps,
        walkMinutes,
        activityMinutes,
        meals: dayFoods.length,
      }
    })

    const todayData = daily.find((d) => d.date === todayStr)!

    // Meal-wise breakdown for today's pie chart
    const mealBreakdown = ['breakfast', 'lunch', 'dinner', 'snack'].map((meal) => ({
      meal,
      calories: foods
        .filter((f) => f.date === todayStr && f.mealType === meal)
        .reduce((sum, f) => sum + f.calories, 0),
    }))

    const topFoods = foods
      .filter((f) => f.date === todayStr)
      .map((f) => ({ name: f.name, mealType: f.mealType, calories: f.calories, time: f.time }))

    return NextResponse.json({
      today: todayStr,
      todayStats: todayData,
      mealBreakdown,
      topFoods,
      weekly: daily,
    })
  } catch (error) {
    console.error('GET /api/summary error:', error)
    return NextResponse.json({ error: 'Failed to build summary' }, { status: 500 })
  }
}
