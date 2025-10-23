import { eq, and, gte, lte, desc, count } from 'drizzle-orm';
import { db, schema } from './db.js';
import type { User, NewUser, Bottle, NewBottle, Stats, NewStats } from './schema.js';

export class DatabaseService {
  // User operations
  async createUser(macAddress: string): Promise<User> {
    const now = new Date();
    const sessionEnd = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
    
    const newUser: NewUser = {
      macAddress,
      sessionStart: now.toISOString(),
      sessionEnd: sessionEnd.toISOString(),
      bottlesDeposited: 1,
    };
    
    const [user] = await db.insert(schema.users).values(newUser).returning();
    await this.updateTodayStats(1, 1); // Add bottle and session
    return user;
  }

  async findActiveUser(macAddress: string): Promise<User | undefined> {
    const now = new Date().toISOString();
    const [user] = await db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.macAddress, macAddress),
          gte(schema.users.sessionEnd, now)
        )
      )
      .limit(1);
    
    return user;
  }

  async extendUserSession(macAddress: string): Promise<boolean> {
    const user = await this.findActiveUser(macAddress);
    if (user) {
      const currentEnd = new Date(user.sessionEnd);
      const newEnd = new Date(currentEnd.getTime() + 5 * 60 * 1000);
      
      await db
        .update(schema.users)
        .set({ 
          sessionEnd: newEnd.toISOString(),
          bottlesDeposited: user.bottlesDeposited + 1
        })
        .where(eq(schema.users.id, user.id));
      
      await this.updateTodayStats(1, 0); // Add bottle only
      return true;
    }
    return false;
  }

  async getActiveUsers(): Promise<User[]> {
    const now = new Date().toISOString();
    return await db
      .select()
      .from(schema.users)
      .where(gte(schema.users.sessionEnd, now));
  }

  async getDistinctUserCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(schema.users);
    
    return result.count;
  }

  // Bottle operations
  async addBottleLog(macAddress: string): Promise<Bottle> {
    const newBottle: NewBottle = {
      timestamp: new Date().toISOString(),
      materialConfirmed: false,
      macAddress,
    };
    
    const [bottle] = await db.insert(schema.bottles).values(newBottle).returning();
    return bottle;
  }

  async getBottleHistory(limit: number = 100): Promise<Bottle[]> {
    return await db
      .select()
      .from(schema.bottles)
      .orderBy(desc(schema.bottles.timestamp))
      .limit(limit);
  }

  async getRecentBottleCount(seconds: number): Promise<number> {
    const cutoff = new Date(Date.now() - seconds * 1000).toISOString();
    const [result] = await db
      .select({ count: count() })
      .from(schema.bottles)
      .where(gte(schema.bottles.timestamp, cutoff));
    
    return result.count;
  }

  async getTotalBottleCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(schema.bottles);
    
    return result.count;
  }

  async getBottlesInLastHour(): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const [result] = await db
      .select({ count: count() })
      .from(schema.bottles)
      .where(gte(schema.bottles.timestamp, oneHourAgo));
    
    return result.count;
  }

  // Stats operations
  async updateTodayStats(bottlesAdded: number = 1, sessionsAdded: number = 0): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    // Try to update existing stats
    const existingStats = await db
      .select()
      .from(schema.stats)
      .where(eq(schema.stats.date, today))
      .limit(1);

    if (existingStats.length > 0) {
      await db
        .update(schema.stats)
        .set({
          totalBottles: existingStats[0].totalBottles + bottlesAdded,
          totalSessions: existingStats[0].totalSessions + sessionsAdded,
        })
        .where(eq(schema.stats.id, existingStats[0].id));
    } else {
      // Create new stats for today
      const newStats: NewStats = {
        date: today,
        totalBottles: bottlesAdded,
        totalSessions: sessionsAdded,
      };
      
      await db.insert(schema.stats).values(newStats);
    }
  }

  async getTodayStats(): Promise<Stats | null> {
    const today = new Date().toISOString().split('T')[0];
    const [stats] = await db
      .select()
      .from(schema.stats)
      .where(eq(schema.stats.date, today))
      .limit(1);
    
    return stats || null;
  }

  async getStatsHistory(days: number): Promise<Stats[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffString = cutoffDate.toISOString().split('T')[0];
    
    return await db
      .select()
      .from(schema.stats)
      .where(gte(schema.stats.date, cutoffString))
      .orderBy(desc(schema.stats.date));
  }

  async getTodayTotalBottles(): Promise<number> {
    const todayStats = await this.getTodayStats();
    return todayStats ? todayStats.totalBottles : 0;
  }

  async resetTodayStats(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await db.delete(schema.stats).where(eq(schema.stats.date, today));
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export type { User, Bottle, Stats };