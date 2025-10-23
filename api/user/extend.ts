import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '../_lib/database-service.js';

export async function POST(request: NextRequest) {
  try {
    const { macAddress } = await request.json();

    if (!macAddress) {
      return NextResponse.json({ error: 'MAC address is required' }, { status: 400 });
    }

    const success = await databaseService.extendUserSession(macAddress);

    if (!success) {
      return NextResponse.json({ error: 'User not found or session expired' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Session extended by 5 minutes' });
  } catch (error) {
    console.error('Session extend error:', error);
    return NextResponse.json({ error: 'Failed to extend session' }, { status: 500 });
  }
}