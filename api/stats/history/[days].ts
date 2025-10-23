import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '../../_lib/database-service.js';

export async function GET(
  request: NextRequest,
  { params }: { params: { days: string } }
) {
  try {
    const days = parseInt(params.days) || 7;
    const history = await databaseService.getStatsHistory(days);
    return NextResponse.json(history);
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}