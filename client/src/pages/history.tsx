import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Trash2 } from "lucide-react";
import { getMatchesWithDetails, deleteMatch } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { MatchWithDetails } from "@shared/schema";

export default function History() {
  const [searchTerm, setSearchTerm] = useState("");
  const [seasonFilter, setSeason] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: matches = [], isLoading } = useQuery<MatchWithDetails[]>({
    queryKey: ["matchesWithDetails"],
    queryFn: () => getMatchesWithDetails(),
  });

  const deleteMatchMutation = useMutation({
    mutationFn: (matchId: string) => deleteMatch(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matchesWithDetails"] });
      queryClient.invalidateQueries({ queryKey: ["playerStats"] });
      queryClient.invalidateQueries({ queryKey: ["seasonStats"] });
      toast({ title: "경기 삭제 완료", description: "경기가 성공적으로 삭제되었습니다." });
    },
    onError: () => {
      toast({ title: "삭제 실패", description: "경기 삭제 중 오류가 발생했습니다.", variant: "destructive" });
    },
  });

  const filteredMatches = matches.filter((match) => {
    const matchesSearch = match.opponent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeason = seasonFilter === "all" || match.season === seasonFilter;
    return matchesSearch && matchesSeason;
  });

  const getResultBadge = (result: string) => {
    switch (result) {
      case "win": return "win-indicator px-3 py-1 rounded-full text-xs font-bold";
      case "loss": return "loss-indicator px-3 py-1 rounded-full text-xs font-bold";
      case "draw": return "draw-indicator px-3 py-1 rounded-full text-xs font-bold";
      default: return "bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-bold";
    }
  };

  const getResultText = (result: string) => {
    switch (result) {
      case "win": return "승리";
      case "loss": return "패배";
      case "draw": return "무승부";
      default: return "경기";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-48 bg-muted rounded"></Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">경기 이력</h2>
        <div className="flex items-center space-x-2">
          <Select value={seasonFilter} onValueChange={setSeason}>
            <SelectTrigger data-testid="select-season-filter" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 시즌</SelectItem>
              <SelectItem value="2024">2024 시즌</SelectItem>
              <SelectItem value="2025">2025 시즌</SelectItem>
            </SelectContent>
          </Select>
          <Input
            data-testid="input-search-opponent"
            type="text"
            placeholder="상대팀 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <Card key={match.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div data-testid={`text-match-date-${match.id}`} className="text-sm text-muted-foreground">
                    {match.date}
                  </div>
                  <div data-testid={`badge-match-result-${match.id}`} className={getResultBadge(match.result)}>
                    {getResultText(match.result)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm("이 경기를 삭제하시겠습니까?")) {
                      deleteMatchMutation.mutate(match.id);
                    }
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-center space-x-8 mb-4">
                <div className="text-center">
                  <div className="font-bold text-foreground text-lg">FC ORIENTAL</div>
                  <div data-testid={`text-our-score-${match.id}`} className="text-3xl font-bold text-primary mt-2">
                    {match.ourScore}
                  </div>
                </div>
                <div className="text-muted-foreground">VS</div>
                <div className="text-center">
                  <div data-testid={`text-opponent-${match.id}`} className="font-bold text-foreground text-lg">
                    {match.opponent}
                  </div>
                  <div data-testid={`text-their-score-${match.id}`} className="text-3xl font-bold text-muted-foreground mt-2">
                    {match.theirScore}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  출전 선수: <span data-testid={`text-participant-count-${match.id}`}>{match.participants.length}명</span>
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {match.participants.map((player) => (
                    <span
                      key={player.id}
                      data-testid={`text-participant-${match.id}-${player.id}`}
                      className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full"
                    >
                      {player.name}
                    </span>
                  ))}
                </div>
                {match.goalDetails.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">득점자:</p>
                    <div className="flex flex-wrap gap-2">
                      {match.goalDetails.map((goal) => (
                        <span
                          key={goal.playerId}
                          data-testid={`text-goal-scorer-${match.id}-${goal.playerId}`}
                          className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                        >
                          {goal.playerName} ({goal.goals}골)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {match.notes && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-1">메모:</p>
                    <p data-testid={`text-match-notes-${match.id}`} className="text-sm text-foreground">
                      {match.notes}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              {searchTerm || seasonFilter !== "all"
                ? "검색 결과가 없습니다."
                : "아직 기록된 경기가 없습니다."}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
