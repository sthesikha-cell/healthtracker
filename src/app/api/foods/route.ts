import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get('date')
    const foods = await db.foodEntry.findMany({
      where: date ? { date } : undefined,
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
    })
    return NextResponse.json(foods)
  } catch (error) {
    console.error('GET /api/foods error:', error)
    return NextResponse.json({ error: 'Failed to fetch foods' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, name, mealType, time, calories } = body

    if (!date || !name || !mealType || !time || calories === undefined || calories === null) {
      return NextResponse.json(
        { error: 'date, name, mealType, time and calories are required' },
        { status: 400 }
      )
    }

    const caloriesNum = Number(calories)
    if (!Number.isFinite(caloriesNum) || caloriesNum < 0) {
      return NextResponse.json({ error: 'calories must be a non-negative number' }, { status: 400 })
    }

    const food = await db.foodEntry.create({
      data: {
        date,
        name: String(name).trim(),
        mealType,
        time,
        calories: Math.round(caloriesNum),
      },
    })
    return NextResponse.json(food, { status: 201 })
  } catch (error) {
    console.error('POST /api/foods error:', error)
    return NextResponse.json({ error: 'Failed to create food entry' }, { status: 500 })
  }
}
