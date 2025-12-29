import { type Player, type InsertPlayer, type Match, type InsertMatch, type MatchParticipant, type InsertMatchParticipant, type Goal, type InsertGoal, type PlayerStats, type MatchWithDetails, type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Player operations
  getPlayer(id: string): Promise<Player | undefined>;
  getPlayers(): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: string, player: Partial<InsertPlayer>): Promise<Player | undefined>;
  deletePlayer(id: string): Promise<boolean>;

  // Match operations
  getMatch(id: string): Promise<Match | undefined>;
  getMatches(): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: string, match: Partial<Match>): Promise<Match | undefined>;
  deleteMatch(id: string): Promise<boolean>;

  // Match participants
  getMatchParticipants(matchId: string): Promise<MatchParticipant[]>;
  addMatchParticipant(participant: InsertMatchParticipant): Promise<MatchParticipant>;

  // Goals
  getMatchGoals(matchId: string): Promise<Goal[]>;
  addGoal(goal: InsertGoal): Promise<Goal>;
  
  // Statistics
  getPlayerStats(): Promise<PlayerStats[]>;
  getMatchesWithDetails(): Promise<MatchWithDetails[]>;
  getSeasonStats(season: string): Promise<{
    totalMatches: number;
    wins: number;
    draws: number;
    losses: number;
    totalGoals: number;
    averageGoals: number;
  }>;

  // User operations
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyUser(username: string, password: string): Promise<User | null>;
}

export class MemStorage implements IStorage {
  private players: Map<string, Player>;
  private matches: Map<string, Match>;
  private matchParticipants: Map<string, MatchParticipant>;
  private goals: Map<string, Goal>;
  private users: Map<string, User>;

  constructor() {
    this.players = new Map();
    this.matches = new Map();
    this.matchParticipants = new Map();
    this.goals = new Map();
    this.users = new Map();
    
    // 기본 관리자 계정 생성
    const adminId = randomUUID();
    this.users.set(adminId, {
      id: adminId,
      username: "admin",
      password: "admin123", // 실제 배포시에는 해싱 필요
      role: "admin"
    });
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async getPlayers(): Promise<Player[]> {
    return Array.from(this.players.values());
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const player: Player = { 
      ...insertPlayer, 
      id,
      position: insertPlayer.position ?? null,
      number: insertPlayer.number ?? null
    };
    this.players.set(id, player);
    return player;
  }

  async updatePlayer(id: string, playerUpdate: Partial<InsertPlayer>): Promise<Player | undefined> {
    const existing = this.players.get(id);
    if (!existing) return undefined;
    
    const updated: Player = { ...existing, ...playerUpdate };
    this.players.set(id, updated);
    return updated;
  }

  async deletePlayer(id: string): Promise<boolean> {
    return this.players.delete(id);
  }

  async getMatch(id: string): Promise<Match | undefined> {
    return this.matches.get(id);
  }

  async getMatches(): Promise<Match[]> {
    return Array.from(this.matches.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = randomUUID();
    const { participants, playerGoals, ...matchData } = insertMatch;
    const match: Match = { 
      ...matchData, 
      id,
      ourScore: matchData.ourScore ?? 0,
      theirScore: matchData.theirScore ?? 0,
      notes: matchData.notes ?? null,
      season: matchData.season ?? "2024"
    };
    this.matches.set(id, match);

    // Add participants
    for (const playerId of participants) {
      const participantId = randomUUID();
      const participant: MatchParticipant = {
        id: participantId,
        matchId: id,
        playerId,
      };
      this.matchParticipants.set(participantId, participant);
    }

    // Add goals if provided
    if (playerGoals) {
      for (const playerGoal of playerGoals) {
        if (playerGoal.goals > 0 || (playerGoal.assists && playerGoal.assists > 0)) {
          const goalId = randomUUID();
          const goal: Goal = {
            id: goalId,
            matchId: id,
            playerId: playerGoal.playerId,
            count: playerGoal.goals,
            assists: playerGoal.assists ?? 0,
          };
          this.goals.set(goalId, goal);
        }
      }
    }

    return match;
  }

  async updateMatch(id: string, matchUpdate: Partial<Match>): Promise<Match | undefined> {
    const existing = this.matches.get(id);
    if (!existing) return undefined;
    
    const updated: Match = { ...existing, ...matchUpdate };
    this.matches.set(id, updated);
    return updated;
  }

  async deleteMatch(id: string): Promise<boolean> {
    // Delete related participants and goals
    Array.from(this.matchParticipants.values())
      .filter(p => p.matchId === id)
      .forEach(p => this.matchParticipants.delete(p.id));
    
    Array.from(this.goals.values())
      .filter(g => g.matchId === id)
      .forEach(g => this.goals.delete(g.id));

    return this.matches.delete(id);
  }

  async getMatchParticipants(matchId: string): Promise<MatchParticipant[]> {
    return Array.from(this.matchParticipants.values())
      .filter(p => p.matchId === matchId);
  }

  async addMatchParticipant(participant: InsertMatchParticipant): Promise<MatchParticipant> {
    const id = randomUUID();
    const newParticipant: MatchParticipant = { ...participant, id };
    this.matchParticipants.set(id, newParticipant);
    return newParticipant;
  }

  async getMatchGoals(matchId: string): Promise<Goal[]> {
    return Array.from(this.goals.values())
      .filter(g => g.matchId === matchId);
  }

  async addGoal(goal: InsertGoal): Promise<Goal> {
    const id = randomUUID();
    const newGoal: Goal = { 
      ...goal, 
      id,
      count: goal.count ?? 1,
      assists: goal.assists ?? 0
    };
    this.goals.set(id, newGoal);
    return newGoal;
  }

  async getPlayerStats(): Promise<PlayerStats[]> {
    const players = await this.getPlayers();
    const stats: PlayerStats[] = [];

    for (const player of players) {
      // Count appearances
      const appearances = Array.from(this.matchParticipants.values())
        .filter(p => p.playerId === player.id).length;

      // Count goals
      const goals = Array.from(this.goals.values())
        .filter(g => g.playerId === player.id)
        .reduce((sum, goal) => sum + goal.count, 0);

      // Count assists
      const assists = Array.from(this.goals.values())
        .filter(g => g.playerId === player.id)
        .reduce((sum, goal) => sum + goal.assists, 0);

      const goalRatio = appearances > 0 ? Number((goals / appearances).toFixed(1)) : 0;

      stats.push({
        id: player.id,
        name: player.name,
        position: player.position ?? null,
        number: player.number,
        appearances,
        goals,
        assists,
        goalRatio,
      });
    }

    return stats.sort((a, b) => b.goals - a.goals || b.goalRatio - a.goalRatio);
  }

  async getMatchesWithDetails(): Promise<MatchWithDetails[]> {
    const matches = await this.getMatches();
    const results: MatchWithDetails[] = [];

    for (const match of matches) {
      const participants = await this.getMatchParticipants(match.id);
      const playerDetails = await Promise.all(
        participants.map(async p => {
          const player = await this.getPlayer(p.playerId);
          return player!;
        })
      );

      const matchGoals = await this.getMatchGoals(match.id);
      const goalDetails = matchGoals.map(goal => {
        const player = playerDetails.find(p => p.id === goal.playerId);
        return {
          playerId: goal.playerId,
          playerName: player?.name || 'Unknown',
          goals: goal.count,
        };
      });

      let result: 'win' | 'loss' | 'draw';
      if (match.ourScore > match.theirScore) result = 'win';
      else if (match.ourScore < match.theirScore) result = 'loss';
      else result = 'draw';

      results.push({
        ...match,
        participants: playerDetails,
        goalDetails,
        result,
      });
    }

    return results;
  }

  async getSeasonStats(season: string): Promise<{
    totalMatches: number;
    wins: number;
    draws: number;
    losses: number;
    totalGoals: number;
    averageGoals: number;
  }> {
    const seasonMatches = Array.from(this.matches.values())
      .filter(m => m.season === season);

    const totalMatches = seasonMatches.length;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let totalGoals = 0;

    for (const match of seasonMatches) {
      totalGoals += match.ourScore;
      if (match.ourScore > match.theirScore) wins++;
      else if (match.ourScore < match.theirScore) losses++;
      else draws++;
    }

    const averageGoals = totalMatches > 0 ? Number((totalGoals / totalMatches).toFixed(1)) : 0;

    return {
      totalMatches,
      wins,
      draws,
      losses,
      totalGoals,
      averageGoals,
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role ?? "user"
    };
    this.users.set(id, user);
    return user;
  }

  async verifyUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user || user.password !== password) {
      return null;
    }
    return user;
  }
}

export const storage = new MemStorage();
