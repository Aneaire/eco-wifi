import { NextResponse } from 'next/server';
import { databaseService } from '../_lib/database-service.js';

export async function GET() {
  try {
    const count = await databaseService.getRecentBottleCount(30);
    return NextResponse.json({ bottleDetected: count > 0 });
  } catch (error) {
    console.error('Status fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}