import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type EntryType = 'food' | 'walk' | 'activity'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const type = request.nextUrl.searchParams.get('type') as EntryType | null

    if (!type || !['food', 'walk', 'activity'].includes(type)) {
      return NextResponse.json(
        { error: "type query param must be one of: food, walk, activity" },
        { status: 400 }
      )
    }

    if (type === 'food') {
      await db.foodEntry.delete({ where: { id } })
    } else if (type === 'walk') {
      await db.walkEntry.delete({ where: { id } })
    } else {
      await db.activityEntry.delete({ where: { id } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/entries/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
  }
}
