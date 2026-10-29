import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get('date')
    const activities = await db.activityEntry.findMany({
      where: date ? { date } : undefined,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(activities)
  } catch (error) {
    console.error('GET /api/activities error:', error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, name, minutes, caloriesBurned } = body

    if (!date || !name) {
      return NextResponse.json({ error: 'date and name are required' }, { status: 400 })
    }

    const minutesNum = Number(minutes ?? 0)
    const caloriesNum = Number(caloriesBurned ?? 0)

    const activity = await db.activityEntry.create({
      data: {
        date,
        name: String(name).trim(),
        minutes: Math.max(0, Math.round(minutesNum)),
        caloriesBurned: Math.max(0, Math.round(caloriesNum)),
      },
    })
    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('POST /api/activities error:', error)
    return NextResponse.json({ error: 'Failed to create activity entry' }, { status: 500 })
  }
}
