import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get('date')
    const walks = await db.walkEntry.findMany({
      where: date ? { date } : undefined,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(walks)
  } catch (error) {
    console.error('GET /api/walks error:', error)
    return NextResponse.json({ error: 'Failed to fetch walks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, steps, minutes, distanceKm } = body

    if (!date || steps === undefined || steps === null) {
      return NextResponse.json({ error: 'date and steps are required' }, { status: 400 })
    }

    const stepsNum = Number(steps)
    const minutesNum = Number(minutes ?? 0)
    const distanceNum = Number(distanceKm ?? 0)

    if (!Number.isFinite(stepsNum) || stepsNum < 0) {
      return NextResponse.json({ error: 'steps must be a non-negative number' }, { status: 400 })
    }

    const walk = await db.walkEntry.create({
      data: {
        date,
        steps: Math.round(stepsNum),
        minutes: Math.max(0, Math.round(minutesNum)),
        distanceKm: Math.max(0, distanceNum),
      },
    })
    return NextResponse.json(walk, { status: 201 })
  } catch (error) {
    console.error('POST /api/walks error:', error)
    return NextResponse.json({ error: 'Failed to create walk entry' }, { status: 500 })
  }
}
