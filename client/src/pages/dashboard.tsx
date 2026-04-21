import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Trophy, Target, TrendingUp, ChevronUp, ChevronDown, ChevronsUpDown, Shield, Zap } from "lucide-react";
import { getPlayerStats, getSeasonStats, getMatchesWithDetails } from "@/lib/firebase";
import { useYear } from "@/contexts/YearContext";
import PlayerChartDialog from "@/components/matches/player-chart-dialog";
import type { PlayerStats, MatchWithDetails } from "@shared/schema";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";

type SortKey = "appearances" | "goals" | "assists" | "attackPoints";
type SortDir = "desc" | "asc";
type ChartType = "goals" | "winRate" | "avgGoals" | "conceded" | "assists" | null;

const MOBILE_TABS: { key: SortKey; label: string }[] = [
  { key: "appearances", label: "출석" },
  { key: "goals", label: "득점" },
  { key: "assists", label: "어시스트" },
  { key: "attackPoints", label: "공격P" },
];

function attackPoints(player: PlayerStats): number {
  if (player.appearances === 0) return 0;
  return Math.round(((player.goals + player.assists) / player.appearances) * 10) / 10;
}

function buildChartData(matches: MatchWithDetails[], year: string) {
  return [...matches]
    .filter((m) => m.season === year && !m.civilWar)
    .reverse()
    .map((m, i, arr) => {
      const wins = arr.slice(0, i + 1).filter((x) => x.result === "win").length;
      const totalAssists = m.goalDetails.reduce((s, g) => s + g.assists, 0);
      return {
        date: m.date.slice(5),
        득점: m.ourScore,
        실점: m.theirScore,
        어시스트: totalAssists,
        누적승률: Math.round((wins / (i + 1)) * 100),
        평균득점: Math.round((arr.slice(0, i + 1).reduce((s, x) => s + x.ourScore, 0) / (i + 1)) * 10) / 10,
      };
    });
}

const CHART_META: Record<NonNullable<ChartType>, { title: string; key: string; color: string; type: "bar" | "line" }> = {
  goals:    { title: "경기별 득점", key: "득점", color: "#f59e0b", type: "bar" },
  winRate:  { title: "누적 승률 (%)", key: "누적승률", color: "#22c55e", type: "line" },
  avgGoals: { title: "평균 득점 추이", key: "평균득점", color: "#3b82f6", type: "line" },
  conceded: { title: "경기별 실점", key: "실점", color: "#ef4444", type: "bar" },
  assists:  { title: "경기별 어시스트", key: "어시스트", color: "#8b5cf6", type: "bar" },
};

export default function Dashboard() {
  const { selectedYear, availableYears } = useYear();
  const [sortKey, setSortKey] = useState<SortKey>("goals");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [mobileCol, setMobileCol] = useState<SortKey>("appearances");
  const [includeCivilWar, setIncludeCivilWar] = useState(false);
  const [activeChart, setActiveChart] = useState<ChartType>(null);
  const [selectedPlayerForChart, setSelectedPlayerForChart] = useState<PlayerStats | null>(null);

  const { data: playerStats, isLoading: isLoadingStats } = useQuery<PlayerStats[]>({
    queryKey: ["playerStats", selectedYear, includeCivilWar],
    queryFn: () => getPlayerStats(selectedYear, includeCivilWar),
  });

  const { data: seasonStats, isLoading: isLoadingSeasonStats } = useQuery({
    queryKey: ["seasonStats", selectedYear],
    queryFn: () => getSeasonStats(selectedYear),
  });

  const { data: allMatches = [] } = useQuery<MatchWithDetails[]>({
    queryKey: ["matchesWithDetails"],
    queryFn: () => getMatchesWithDetails(),
  });

  const chartData = useMemo(() => buildChartData(allMatches, selectedYear), [allMatches, selectedYear]);

  const winRate = seasonStats && seasonStats.totalMatches > 0
    ? Math.round((seasonStats.wins / seasonStats.totalMatches) * 100)
    : 0;

  const sortedStats = useMemo(() => {
    if (!playerStats) return [];
    return [...playerStats].sort((a, b) => {
      const aVal = sortKey === "attackPoints" ? attackPoints(a) : a[sortKey];
      const bVal = sortKey === "attackPoints" ? attackPoints(b) : b[sortKey];
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [playerStats, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 inline ml-1 opacity-40" />;
    return sortDir === "desc" ? <ChevronDown className="w-3 h-3 inline ml-1" /> : <ChevronUp className="w-3 h-3 inline ml-1" />;
  }

  function colClass(key: SortKey) {
    return `text-center py-3 px-3 sm:px-6 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground ${mobileCol === key ? "table-cell" : "hidden"} sm:table-cell`;
  }
  function cellClass(key: SortKey) {
    return `py-3 px-3 sm:py-4 sm:px-6 text-center text-muted-foreground text-sm ${mobileCol === key ? "table-cell" : "hidden"} sm:table-cell`;
  }

  if (isLoadingStats || isLoadingSeasonStats) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-8 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const StatCard = ({
    label, value, icon, iconBg, textColor, chartKey, pcOnly = false,
  }: {
    label: string; value: string | number; icon: React.ReactNode;
    iconBg: string; textColor: string; chartKey?: ChartType; pcOnly?: boolean;
  }) => (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow ${pcOnly ? "hidden lg:block" : ""}`}
      onClick={() => chartKey && setActiveChart(chartKey)}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
          </div>
          <div className={`${iconBg} p-3 rounded-full`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );

  const chartMeta = activeChart ? CHART_META[activeChart] : null;

  return (
    <div className="p-6 space-y-6">
      {/* 상단 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard label="총 경기" value={seasonStats?.totalMatches || 0}
          icon={<Calendar className="w-5 h-5 text-primary" />} iconBg="bg-primary/10" textColor="text-foreground" />
        <StatCard label="승률" value={`${winRate}%`}
          icon={<Trophy className="w-5 h-5 text-green-600" />} iconBg="bg-green-100" textColor="text-green-600"
          chartKey="winRate" />
        <StatCard label="총 득점" value={seasonStats?.totalGoals || 0}
          icon={<Target className="w-5 h-5 text-yellow-600" />} iconBg="bg-yellow-100" textColor="text-foreground"
          chartKey="goals" />
        <StatCard label="평균 득점" value={seasonStats?.averageGoals || 0}
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-100" textColor="text-foreground"
          chartKey="avgGoals" />
        <StatCard label="총 실점" value={seasonStats?.totalConceded || 0}
          icon={<Shield className="w-5 h-5 text-red-500" />} iconBg="bg-red-100" textColor="text-red-500"
          chartKey="conceded" pcOnly />
        <StatCard label="총 어시스트" value={seasonStats?.totalAssists || 0}
          icon={<Zap className="w-5 h-5 text-purple-500" />} iconBg="bg-purple-100" textColor="text-purple-500"
          chartKey="assists" pcOnly />
      </div>

      {/* 선수 기록 테이블 */}
      <Card>
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">선수 기록</h2>
            <p className="text-sm text-muted-foreground mt-1">{selectedYear} 시즌 개인 기록</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
            <Checkbox
              checked={includeCivilWar}
              onCheckedChange={(v) => setIncludeCivilWar(!!v)}
            />
            내전 경기 포함
          </label>
        </div>

        <div className="flex sm:hidden gap-2 px-4 py-3 border-b border-border overflow-x-auto">
          {MOBILE_TABS.map(({ key, label }) => (
            <button key={key} onClick={() => { setMobileCol(key); setSortKey(key); setSortDir("desc"); }}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                mobileCol === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >{label}</button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-3 px-3 sm:px-6 font-medium text-muted-foreground">순위</th>
                <th className="text-left py-3 px-3 sm:px-6 font-medium text-muted-foreground">선수명</th>
                <th className={colClass("appearances")} onClick={() => handleSort("appearances")}>출석<SortIcon col="appearances" /></th>
                <th className={colClass("goals")} onClick={() => handleSort("goals")}>득점<SortIcon col="goals" /></th>
                <th className={colClass("assists")} onClick={() => handleSort("assists")}>어시스트<SortIcon col="assists" /></th>
                <th className={colClass("attackPoints")} onClick={() => handleSort("attackPoints")}>경기당 공격P<SortIcon col="attackPoints" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedStats.length > 0 ? sortedStats.map((player, index) => (
                <tr key={player.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedPlayerForChart(player)}>
                  <td className="py-3 px-3 sm:py-4 sm:px-6">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      index === 0 ? "bg-yellow-100 text-yellow-800" :
                      index === 1 ? "bg-gray-100 text-gray-800" :
                      index === 2 ? "bg-orange-100 text-orange-800" : "text-muted-foreground font-medium"
                    }`}>{index + 1}</span>
                  </td>
                  <td className="py-3 px-3 sm:py-4 sm:px-6">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        index === 0 ? "bg-primary text-primary-foreground" :
                        index === 1 ? "bg-secondary text-secondary-foreground" :
                        index === 2 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                      }`}>{player.name.charAt(0)}</div>
                      <span className="font-medium text-foreground text-sm sm:text-base">{player.name}</span>
                    </div>
                  </td>
                  <td className={cellClass("appearances")}>{player.appearances}</td>
                  <td className={`${cellClass("goals")} !text-primary font-bold text-base sm:text-lg`}>{player.goals}</td>
                  <td className={cellClass("assists")}>{player.assists}</td>
                  <td className={cellClass("attackPoints")}>{attackPoints(player).toFixed(1)}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="py-8 px-6 text-center text-muted-foreground">아직 등록된 선수가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <PlayerChartDialog
        player={selectedPlayerForChart}
        matches={allMatches}
        availableYears={availableYears}
        onClose={() => setSelectedPlayerForChart(null)}
      />

      {/* 차트 다이얼로그 */}
      <Dialog open={!!activeChart} onOpenChange={(open) => { if (!open) setActiveChart(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{chartMeta?.title}</DialogTitle>
          </DialogHeader>
          {chartData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">데이터가 없습니다.</p>
          ) : chartMeta?.type === "bar" ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey={chartMeta.key} fill={chartMeta.color} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={chartMeta?.key}
                  stroke={chartMeta?.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
