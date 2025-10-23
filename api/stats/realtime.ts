import { NextResponse } from 'next/server';
import { databaseService } from '../_lib/database-service.js';

export async function GET() {
  try {
    const bottlesLastHour = await databaseService.getBottlesInLastHour();
    const activeNow = (await databaseService.getActiveUsers()).length;
    const todayTotal = await databaseService.getTodayTotalBottles();

    return NextResponse.json({
      bottlesLastHour,
      activeNow,
      todayTotal,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Realtime metrics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch realtime metrics' }, { status: 500 });
  }
}