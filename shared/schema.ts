import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  position: text("position").notNull(),
  number: integer("number"),
  joinDate: date("join_date").notNull(),
});

export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  opponent: text("opponent").notNull(),
  ourScore: integer("our_score").notNull().default(0),
  theirScore: integer("their_score").notNull().default(0),
  notes: text("notes"),
  season: text("season").notNull().default("2024"),
});

export const matchParticipants = pgTable("match_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").notNull(),
  playerId: varchar("player_id").notNull(),
});

export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").notNull(),
  playerId: varchar("player_id").notNull(),
  count: integer("count").notNull().default(1),
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
}).extend({
  participants: z.array(z.string()),
  playerGoals: z.array(z.object({
    playerId: z.string(),
    goals: z.number().min(0),
  })).optional(),
});

export const insertMatchParticipantSchema = createInsertSchema(matchParticipants).omit({
  id: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
});

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;

export type InsertMatchParticipant = z.infer<typeof insertMatchParticipantSchema>;
export type MatchParticipant = typeof matchParticipants.$inferSelect;

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

export interface PlayerStats {
  id: string;
  name: string;
  position: string;
  number: number | null;
  appearances: number;
  goals: number;
  goalRatio: number;
}

export interface MatchWithDetails extends Match {
  participants: Player[];
  goalDetails: Array<{
    playerId: string;
    playerName: string;
    goals: number;
  }>;
  result: 'win' | 'loss' | 'draw';
}

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // "admin" or "user"
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
