import { NextResponse } from 'next/server';
import { databaseService } from '../_lib/database-service.js';

export async function GET() {
  try {
    const history = await databaseService.getBottleHistory(100);
    return NextResponse.json(history);
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}