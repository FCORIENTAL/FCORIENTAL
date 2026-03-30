import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import type { Player, PlayerStats, MatchWithDetails } from "@shared/schema";

export type { FirebaseUser };

const firebaseConfig = {
  apiKey: "AIzaSyCPPGhktwgXCCEgASRD2YxOvTmWC7llv8k",
  authDomain: "fcoriental-7a2f3.firebaseapp.com",
  projectId: "fcoriental-7a2f3",
  storageBucket: "fcoriental-7a2f3.firebasestorage.app",
  messagingSenderId: "913160977794",
  appId: "1:913160977794:web:d3a73519c05e6eafa5239b",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export { onAuthStateChanged, type FirebaseUser };

export async function fbSignIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function fbSignOut() {
  return firebaseSignOut(auth);
}

export async function getPlayers(): Promise<Player[]> {
  const q = query(collection(db, "players"), orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Player));
}

export async function addPlayer(data: Omit<Player, "id">): Promise<Player> {
  const ref = await addDoc(collection(db, "players"), data);
  return { id: ref.id, ...data };
}

export async function updatePlayer(id: string, data: Partial<Omit<Player, "id">>) {
  await updateDoc(doc(db, "players", id), data as Record<string, unknown>);
}

export async function deletePlayer(id: string) {
  await deleteDoc(doc(db, "players", id));
}

export interface FirebaseMatch {
  id: string;
  date: string;
  opponent: string;
  ourScore: number;
  theirScore: number;
  notes?: string | null;
  season: string;
  participants: string[];
  goals: { playerId: string; count: number; assists: number }[];
}

export async function getMatches(): Promise<FirebaseMatch[]> {
  const q = query(collection(db, "matches"), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FirebaseMatch));
}

export async function addMatch(data: Omit<FirebaseMatch, "id">): Promise<FirebaseMatch> {
  const ref = await addDoc(collection(db, "matches"), data);
  return { id: ref.id, ...data };
}

export async function deleteMatch(id: string) {
  await deleteDoc(doc(db, "matches", id));
}

function calcResult(ourScore: number, theirScore: number): "win" | "loss" | "draw" {
  if (ourScore > theirScore) return "win";
  if (ourScore < theirScore) return "loss";
  return "draw";
}

export async function getMatchesWithDetails(): Promise<MatchWithDetails[]> {
  const [matches, players] = await Promise.all([getMatches(), getPlayers()]);
  const playerMap = new Map(players.map((p) => [p.id, p]));

  return matches.map((m) => ({
    id: m.id,
    date: m.date,
    opponent: m.opponent,
    ourScore: m.ourScore,
    theirScore: m.theirScore,
    notes: m.notes ?? null,
    season: m.season,
    result: calcResult(m.ourScore, m.theirScore),
    participants: m.participants
      .map((pid) => playerMap.get(pid))
      .filter(Boolean) as Player[],
    goalDetails: m.goals
      .filter((g) => g.count > 0)
      .map((g) => ({
        playerId: g.playerId,
        playerName: playerMap.get(g.playerId)?.name ?? "알 수 없음",
        goals: g.count,
      })),
  }));
}

export async function getPlayerStats(): Promise<PlayerStats[]> {
  const [players, matches] = await Promise.all([getPlayers(), getMatches()]);

  return players
    .map((player) => {
      const appearances = matches.filter((m) =>
        m.participants.includes(player.id)
      ).length;
      const goals = matches.reduce((sum, m) => {
        const g = m.goals.find((g) => g.playerId === player.id);
        return sum + (g?.count ?? 0);
      }, 0);
      const assists = matches.reduce((sum, m) => {
        const g = m.goals.find((g) => g.playerId === player.id);
        return sum + (g?.assists ?? 0);
      }, 0);
      const goalRatio =
        appearances > 0 ? Math.round((goals / appearances) * 100) / 100 : 0;

      return {
        id: player.id,
        name: player.name,
        position: player.position ?? null,
        number: player.number ?? null,
        appearances,
        goals,
        assists,
        goalRatio,
      };
    })
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists);
}

export async function getSeasonStats(season: string) {
  const matches = await getMatches();
  const seasonMatches = season === "all" ? matches : matches.filter((m) => m.season === season);

  const wins = seasonMatches.filter((m) => m.ourScore > m.theirScore).length;
  const draws = seasonMatches.filter((m) => m.ourScore === m.theirScore).length;
  const losses = seasonMatches.filter((m) => m.ourScore < m.theirScore).length;
  const totalGoals = seasonMatches.reduce((sum, m) => sum + m.ourScore, 0);
  const totalMatches = seasonMatches.length;
  const averageGoals =
    totalMatches > 0 ? Math.round((totalGoals / totalMatches) * 10) / 10 : 0;

  return { totalMatches, wins, draws, losses, totalGoals, averageGoals };
}
