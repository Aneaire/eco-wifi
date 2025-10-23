import { NextResponse } from 'next/server';
import { databaseService } from '../_lib/database-service.js';

export async function GET() {
  try {
    const activeUsers = await databaseService.getActiveUsers();
    
    const sortedUsers = activeUsers
      .sort((a, b) => new Date(b.sessionEnd).getTime() - new Date(a.sessionEnd).getTime())
      .map(({ macAddress, sessionStart, sessionEnd, bottlesDeposited }) => ({
        mac_address: macAddress,
        session_start: sessionStart,
        session_end: sessionEnd,
        bottles_deposited: bottlesDeposited
      }));
    
    return NextResponse.json(sortedUsers);
  } catch (error) {
    console.error('Active users fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch active users' }, { status: 500 });
  }
}