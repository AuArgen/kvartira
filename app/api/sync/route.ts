import { NextResponse } from 'next/server'
import { syncLalafo } from '@/lib/sync'

export async function POST() {
  try {
    const result = await syncLalafo()
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    )
  }
}
