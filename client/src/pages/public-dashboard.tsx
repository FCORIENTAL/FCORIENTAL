import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Trophy, Target, TrendingUp } from "lucide-react";
import type { PlayerStats } from "@shared/schema";

export default function PublicDashboard() {
  const { data: playerStats, isLoading: isLoadingStats } = useQuery<PlayerStats[]>({
    queryKey: ["/api/players/stats"],
  });

  const { data: seasonStats, isLoading: isLoadingSeasonStats } = useQuery<{
    totalMatches: number;
    wins: number;
    draws: number;
    losses: number;
    totalGoals: number;
    averageGoals: number;
  }>({
    queryKey: ["/api/season/2024/stats"],
  });

  const winRate = seasonStats?.totalMatches > 0 
    ? Math.round((seasonStats.wins / seasonStats.totalMatches) * 100)
    : 0;

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
      {/* Stats Cards */}
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

      {/* Scoring Rankings */}
      <Card>
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">득점 순위</h2>
          <p className="text-sm text-muted-foreground mt-1">2024 시즌 개인 득점 기록</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">순위</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">선수명</th>
                <th className="text-center py-3 px-6 font-medium text-muted-foreground">출전</th>
                <th className="text-center py-3 px-6 font-medium text-muted-foreground">득점</th>
                <th className="text-center py-3 px-6 font-medium text-muted-foreground">경기당 득점</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {playerStats && playerStats.length > 0 ? (
                playerStats.map((player, index) => (
                  <tr key={player.id} className="hover:bg-muted/50">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <span 
                          data-testid={`text-rank-${index + 1}`}
                          className={`text-xs font-bold px-2 py-1 rounded-full mr-2 ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'text-muted-foreground font-medium'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-primary text-primary-foreground' :
                          index === 1 ? 'bg-secondary text-secondary-foreground' :
                          index === 2 ? 'bg-accent text-accent-foreground' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {player.name.charAt(0)}
                        </div>
                        <span data-testid={`text-player-name-${player.id}`} className="font-medium text-foreground">
                          {player.name}
                        </span>
                      </div>
                    </td>
                    <td data-testid={`text-appearances-${player.id}`} className="py-4 px-6 text-center text-muted-foreground">
                      {player.appearances}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span data-testid={`text-goals-${player.id}`} className="font-bold text-primary text-lg">
                        {player.goals}
                      </span>
                    </td>
                    <td data-testid={`text-goal-ratio-${player.id}`} className="py-4 px-6 text-center text-muted-foreground">
                      {player.goalRatio}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 px-6 text-center text-muted-foreground">
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