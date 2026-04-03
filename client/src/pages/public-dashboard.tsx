import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Trophy, Target, TrendingUp, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { getPlayerStats, getSeasonStats } from "@/lib/firebase";
import { useYear } from "@/contexts/YearContext";
import type { PlayerStats } from "@shared/schema";

type SortKey = "appearances" | "goals" | "assists" | "attackPoints";
type SortDir = "desc" | "asc";

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

export default function PublicDashboard() {
  const { selectedYear } = useYear();
  const [sortKey, setSortKey] = useState<SortKey>("goals");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [mobileCol, setMobileCol] = useState<SortKey>("appearances");

  const { data: playerStats, isLoading: isLoadingStats } = useQuery<PlayerStats[]>({
    queryKey: ["playerStats", selectedYear],
    queryFn: () => getPlayerStats(selectedYear),
  });

  const { data: seasonStats, isLoading: isLoadingSeasonStats } = useQuery({
    queryKey: ["seasonStats", selectedYear],
    queryFn: () => getSeasonStats(selectedYear),
  });

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
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 inline ml-1 opacity-40" />;
    return sortDir === "desc"
      ? <ChevronDown className="w-3 h-3 inline ml-1" />
      : <ChevronUp className="w-3 h-3 inline ml-1" />;
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">총 경기</p>
                <p data-testid="text-total-matches" className="text-2xl font-bold text-foreground">
                  {seasonStats?.totalMatches || 0}
                </p>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">승률</p>
                <p data-testid="text-win-rate" className="text-2xl font-bold text-green-600">
                  {winRate}%
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Trophy className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">총 득점</p>
                <p data-testid="text-total-goals" className="text-2xl font-bold text-foreground">
                  {seasonStats?.totalGoals || 0}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Target className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">평균 득점</p>
                <p data-testid="text-average-goals" className="text-2xl font-bold text-foreground">
                  {seasonStats?.averageGoals || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="p-4 sm:p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">선수 기록</h2>
          <p className="text-sm text-muted-foreground mt-1">{selectedYear} 시즌 개인 기록</p>
        </div>

        {/* 모바일 탭 */}
        <div className="flex sm:hidden gap-2 px-4 py-3 border-b border-border overflow-x-auto">
          {MOBILE_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMobileCol(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                mobileCol === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-3 px-3 sm:px-6 font-medium text-muted-foreground">순위</th>
                <th className="text-left py-3 px-3 sm:px-6 font-medium text-muted-foreground">선수명</th>
                <th className={colClass("appearances")} onClick={() => handleSort("appearances")}>
                  출석<SortIcon col="appearances" />
                </th>
                <th className={colClass("goals")} onClick={() => handleSort("goals")}>
                  득점<SortIcon col="goals" />
                </th>
                <th className={colClass("assists")} onClick={() => handleSort("assists")}>
                  어시스트<SortIcon col="assists" />
                </th>
                <th className={colClass("attackPoints")} onClick={() => handleSort("attackPoints")}>
                  경기당 공격P<SortIcon col="attackPoints" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedStats.length > 0 ? (
                sortedStats.map((player, index) => (
                  <tr key={player.id} className="hover:bg-muted/50">
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <span
                        data-testid={`text-rank-${index + 1}`}
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          index === 0 ? "bg-yellow-100 text-yellow-800" :
                          index === 1 ? "bg-gray-100 text-gray-800" :
                          index === 2 ? "bg-orange-100 text-orange-800" :
                          "text-muted-foreground font-medium"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:py-4 sm:px-6">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          index === 0 ? "bg-primary text-primary-foreground" :
                          index === 1 ? "bg-secondary text-secondary-foreground" :
                          index === 2 ? "bg-accent text-accent-foreground" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {player.name.charAt(0)}
                        </div>
                        <span data-testid={`text-player-name-${player.id}`} className="font-medium text-foreground text-sm sm:text-base">
                          {player.name}
                        </span>
                      </div>
                    </td>
                    <td data-testid={`text-appearances-${player.id}`} className={cellClass("appearances")}>
                      {player.appearances}
                    </td>
                    <td className={`${cellClass("goals")} !text-primary font-bold text-base sm:text-lg`}>
                      <span data-testid={`text-goals-${player.id}`}>{player.goals}</span>
                    </td>
                    <td data-testid={`text-assists-${player.id}`} className={cellClass("assists")}>
                      {player.assists}
                    </td>
                    <td data-testid={`text-attack-points-${player.id}`} className={cellClass("attackPoints")}>
                      {attackPoints(player).toFixed(1)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 px-6 text-center text-muted-foreground">
                    아직 등록된 선수가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
