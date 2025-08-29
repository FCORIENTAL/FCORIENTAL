import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPlayerSchema, insertMatchSchema } from "@shared/schema";
import { z } from "zod";

import type { Request, Response, NextFunction } from "express";

// 세션 사용자 타입 확장
declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      role: string;
    };
  }
}

// 간단한 인증 미들웨어
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: "인증이 필요합니다." });
  }
  next();
};

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "관리자 권한이 필요합니다." });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.verifyUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "잘못된 사용자명 또는 비밀번호입니다." });
      }
      
      req.session.user = { id: user.id, username: user.username, role: user.role };
      res.json({ user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
      res.status(500).json({ message: "로그인 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "로그아웃 중 오류가 발생했습니다." });
      }
      res.json({ message: "로그아웃 되었습니다." });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.session?.user) {
      res.json({ user: req.session.user });
    } else {
      res.status(401).json({ message: "인증되지 않은 사용자입니다." });
    }
  });

  // Player routes
  app.get("/api/players", async (req, res) => {
    try {
      const players = await storage.getPlayers();
      res.json(players);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  app.get("/api/players/stats", async (req, res) => {
    try {
      const stats = await storage.getPlayerStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch player stats" });
    }
  });

  app.post("/api/players", requireAdmin, async (req, res) => {
    try {
      const playerData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(playerData);
      res.status(201).json(player);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid player data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create player" });
      }
    }
  });

  app.put("/api/players/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const playerData = insertPlayerSchema.partial().parse(req.body);
      const player = await storage.updatePlayer(id, playerData);
      
      if (!player) {
        res.status(404).json({ message: "Player not found" });
        return;
      }
      
      res.json(player);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid player data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update player" });
      }
    }
  });

  app.delete("/api/players/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePlayer(id);
      
      if (!deleted) {
        res.status(404).json({ message: "Player not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete player" });
    }
  });

  // Match routes
  app.get("/api/matches", async (req, res) => {
    try {
      const matches = await storage.getMatches();
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.get("/api/matches/details", async (req, res) => {
    try {
      const matches = await storage.getMatchesWithDetails();
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch match details" });
    }
  });

  app.post("/api/matches", requireAdmin, async (req, res) => {
    try {
      const matchData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(matchData);
      res.status(201).json(match);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid match data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create match" });
      }
    }
  });

  app.delete("/api/matches/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteMatch(id);
      
      if (!deleted) {
        res.status(404).json({ message: "Match not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete match" });
    }
  });

  // Season stats
  app.get("/api/season/:season/stats", async (req, res) => {
    try {
      const { season } = req.params;
      const stats = await storage.getSeasonStats(season);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch season stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
