import { NextResponse } from 'next/server';
import { databaseService } from '../_lib/database-service.js';

export async function GET() {
  try {
    const today = await databaseService.getTodayStats() || { totalBottles: 0, totalSessions: 0 };
    const totalBottles = await databaseService.getTotalBottleCount();
    const activeSessions = (await databaseService.getActiveUsers()).length;
    const totalUsers = await databaseService.getDistinctUserCount();

    return NextResponse.json({
      today,
      totalBottles,
      activeSessions,
      totalUsers
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}