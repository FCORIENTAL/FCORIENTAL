import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { PlayerStats, MatchWithDetails } from "@shared/schema";

function getSeasonData(matches: MatchWithDetails[], playerId: string) {
  const seasons = [...new Set(matches.filter((m) => !m.civilWar).map((m) => m.season))].sort();
  return seasons.map((season) => {
    const played = matches.filter(
      (m) => !m.civilWar && m.season === season && m.participants.some((p) => p.id === playerId),
    );
    const goals = played.reduce(
      (s, m) => s + (m.goalDetails.find((g) => g.playerId === playerId)?.goals ?? 0),
      0,
    );
    const assists = played.reduce(
      (s, m) => s + (m.goalDetails.find((g) => g.playerId === playerId)?.assists ?? 0),
      0,
    );
    return { label: season, 출석: played.length, 득점: goals, 어시스트: assists };
  });
}

function getMonthData(matches: MatchWithDetails[], playerId: string, yearFilter: string) {
  const filtered =
    yearFilter === "all"
      ? matches.filter((m) => !m.civilWar)
      : matches.filter((m) => !m.civilWar && m.season === yearFilter);
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const played = filtered.filter(
      (m) =>
        parseInt(m.date.split("-")[1]) === month &&
        m.participants.some((p) => p.id === playerId),
    );
    const goals = played.reduce(
      (s, m) => s + (m.goalDetails.find((g) => g.playerId === playerId)?.goals ?? 0),
      0,
    );
    const assists = played.reduce(
      (s, m) => s + (m.goalDetails.find((g) => g.playerId === playerId)?.assists ?? 0),
      0,
    );
    return { label: `${month}월`, 출석: played.length, 득점: goals, 어시스트: assists };
  });
}

interface Props {
  player: PlayerStats | null;
  matches: MatchWithDetails[];
  availableYears: string[];
  onClose: () => void;
}

export default function PlayerChartDialog({ player, matches, availableYears, onClose }: Props) {
  const [tab, setTab] = useState<"season" | "month">("season");
  const [monthYear, setMonthYear] = useState("all");

  const seasonData = player ? getSeasonData(matches, player.id) : [];
  const monthData = player ? getMonthData(matches, player.id, monthYear) : [];

  return (
    <Dialog open={!!player} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{player?.name} 선수 통계</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          {(["season", "month"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t === "season" ? "시즌별" : "월별"}
            </button>
          ))}
        </div>

        {tab === "month" && (
          <div className="flex flex-wrap gap-2">
            {(["all", ...availableYears] as const).map((y) => (
              <button
                key={y}
                onClick={() => setMonthYear(y)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  monthYear === y
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {y === "all" ? "전체" : y}
              </button>
            ))}
          </div>
        )}

        {tab === "season" ? (
          seasonData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">데이터가 없습니다.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={seasonData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="출석" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                <Bar dataKey="득점" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="어시스트" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="출석" fill="#94a3b8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="득점" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="어시스트" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </DialogContent>
    </Dialog>
  );
}
