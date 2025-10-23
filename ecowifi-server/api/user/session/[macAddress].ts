import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '../../_lib/database-service.js';

export async function GET(
  request: NextRequest,
  { params }: { params: { macAddress: string } }
) {
  try {
    const macAddress = params.macAddress;

    const user = await databaseService.findActiveUser(macAddress);

    if (!user) {
      return NextResponse.json({ error: 'No active session found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}