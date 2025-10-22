import { writeFileSync, readFileSync, existsSync } from 'fs';

// In-memory database structure
interface User {
  id: number;
  mac_address: string;
  session_start: string;
  session_end: string;
  bottles_deposited: number;
  status: 'active' | 'expired';
}

interface BottleLog {
  id: number;
  timestamp: string;
  weight: number;
  size: number;
  material_confirmed: boolean;
  mac_address: string;
}

interface SystemStats {
  id: number;
  date: string;
  total_bottles: number;
  total_sessions: number;
  co2_saved: number;
}

class InMemoryDatabase {
  private users: User[] = [];
  private bottleLogs: BottleLog[] = [];
  private systemStats: SystemStats[] = [];
  private nextUserId = 1;
  private nextBottleLogId = 1;
  private nextSystemStatsId = 1;
  private dataFile = './data.json';

  constructor() {
    this.loadData();
    this.initializeDefaultStats();
  }

  // Load data from JSON file if exists
  private loadData() {
    try {
      if (existsSync(this.dataFile)) {
        const data = JSON.parse(readFileSync(this.dataFile, 'utf8'));
        this.users = data.users || [];
        this.bottleLogs = data.bottleLogs || [];
        this.systemStats = data.systemStats || [];
        this.nextUserId = data.nextUserId || 1;
        this.nextBottleLogId = data.nextBottleLogId || 1;
        this.nextSystemStatsId = data.nextSystemStatsId || 1;
        console.log('Data loaded from file');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  // Save data to JSON file
  private saveData() {
    try {
      const data = {
        users: this.users,
        bottleLogs: this.bottleLogs,
        systemStats: this.systemStats,
        nextUserId: this.nextUserId,
        nextBottleLogId: this.nextBottleLogId,
        nextSystemStatsId: this.nextSystemStatsId
      };
      writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // Initialize default stats for today
  private initializeDefaultStats() {
    const today = new Date().toISOString().split('T')[0];
    const existingStats = this.systemStats.find(s => s.date === today);
    if (!existingStats) {
      this.systemStats.push({
        id: this.nextSystemStatsId++,
        date: today,
        total_bottles: 0,
        total_sessions: 0,
        co2_saved: 0.0
      });
      this.saveData();
    }
  }

  // User operations
  createUser(macAddress: string): User {
    const now = new Date();
    const sessionEnd = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
    
    const user: User = {
      id: this.nextUserId++,
      mac_address: macAddress,
      session_start: now.toISOString(),
      session_end: sessionEnd.toISOString(),
      bottles_deposited: 1,
      status: 'active'
    };
    
    this.users.push(user);
    this.saveData();
    return user;
  }

  findActiveUser(macAddress: string): User | undefined {
    const now = new Date();
    return this.users.find(user => 
      user.mac_address === macAddress && 
      user.status === 'active' && 
      new Date(user.session_end) > now
    );
  }

  extendUserSession(macAddress: string): boolean {
    const user = this.findActiveUser(macAddress);
    if (user) {
      const currentEnd = new Date(user.session_end);
      user.session_end = new Date(currentEnd.getTime() + 15 * 60 * 1000).toISOString();
      user.bottles_deposited++;
      this.saveData();
      return true;
    }
    return false;
  }

  getActiveUsers(): User[] {
    const now = new Date();
    return this.users.filter(user => 
      user.status === 'active' && 
      new Date(user.session_end) > now
    );
  }

  cleanupExpiredSessions(): number {
    const now = new Date();
    let expiredCount = 0;
    
    this.users.forEach(user => {
      if (user.status === 'active' && new Date(user.session_end) <= now) {
        user.status = 'expired';
        expiredCount++;
      }
    });
    
    if (expiredCount > 0) {
      this.saveData();
    }
    
    return expiredCount;
  }

  getDistinctUserCount(): number {
    const uniqueMacs = new Set(this.users.map(user => user.mac_address));
    return uniqueMacs.size;
  }

  // Bottle log operations
  addBottleLog(weight: number, size: number, macAddress: string): BottleLog {
    const log: BottleLog = {
      id: this.nextBottleLogId++,
      timestamp: new Date().toISOString(),
      weight,
      size,
      material_confirmed: false,
      mac_address: macAddress
    };
    
    this.bottleLogs.push(log);
    this.saveData();
    return log;
  }

  getBottleHistory(limit: number = 100): BottleLog[] {
    return this.bottleLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  getRecentBottleCount(seconds: number): number {
    const cutoff = new Date(Date.now() - seconds * 1000);
    return this.bottleLogs.filter(log => new Date(log.timestamp) > cutoff).length;
  }

  getTotalBottleCount(): number {
    return this.bottleLogs.length;
  }

  getBottlesInLastHour(): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.bottleLogs.filter(log => new Date(log.timestamp) > oneHourAgo).length;
  }

  // System stats operations
  updateTodayStats(bottlesAdded: number = 1, sessionsAdded: number = 0, co2Added: number = 0.082): void {
    const today = new Date().toISOString().split('T')[0];
    let stats = this.systemStats.find(s => s.date === today);
    
    if (!stats) {
      stats = {
        id: this.nextSystemStatsId++,
        date: today,
        total_bottles: 0,
        total_sessions: 0,
        co2_saved: 0.0
      };
      this.systemStats.push(stats);
    }
    
    stats.total_bottles += bottlesAdded;
    stats.total_sessions += sessionsAdded;
    stats.co2_saved += co2Added;
    this.saveData();
  }

  getTodayStats(): SystemStats | null {
    const today = new Date().toISOString().split('T')[0];
    return this.systemStats.find(s => s.date === today) || null;
  }

  getStatsHistory(days: number): SystemStats[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffString = cutoffDate.toISOString().split('T')[0];
    
    return this.systemStats
      .filter(s => s.date >= cutoffString)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  getTodayTotalBottles(): number {
    const today = this.getTodayStats();
    return today ? today.total_bottles : 0;
  }

  resetTodayStats(): void {
    const today = new Date().toISOString().split('T')[0];
    this.systemStats = this.systemStats.filter(s => s.date !== today);
    this.saveData();
  }
}

// Export singleton instance
export const db = new InMemoryDatabase();
export type { User, BottleLog, SystemStats };