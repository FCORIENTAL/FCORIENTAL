import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, Youtube } from "lucide-react";
import { getMatchesWithDetails } from "@/lib/firebase";
import MatchDetailDialog from "@/components/matches/match-detail-dialog";
import type { MatchWithDetails } from "@shared/schema";

const currentYear = String(new Date().getFullYear());

export default function PublicHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [seasonFilter, setSeason] = useState("all");
  const [selectedMatch, setSelectedMatch] = useState<MatchWithDetails | null>(null);

  const { data: matches = [], isLoading } = useQuery<MatchWithDetails[]>({
    queryKey: ["matchesWithDetails"],
    queryFn: () => getMatchesWithDetails(),
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
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-24 bg-muted rounded"></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-semibold text-foreground">경기 이력</h2>
        <div className="flex items-center gap-2">
          <Select value={seasonFilter} onValueChange={setSeason}>
            <SelectTrigger className="w-28 sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 시즌</SelectItem>
              <SelectItem value={currentYear}>{currentYear} 시즌</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="text"
            placeholder="상대팀 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 sm:w-48"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <Card
              key={match.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedMatch(match)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={getResultBadge(match.result)}>{getResultText(match.result)}</div>
                  <div>
                    <div className="font-semibold text-foreground">
                      FC ORIENTAL {match.ourScore} - {match.theirScore} {match.opponent}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {match.date} · {match.season} 시즌 · {match.participants.length}명 출전
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {match.goalDetails.length > 0 && (
                    <span className="text-xs text-primary font-medium hidden sm:block mr-1">
                      ⚽ {match.goalDetails.reduce((s, g) => s + g.goals, 0)}골
                    </span>
                  )}
                  {match.youtubeUrl && (
                    <a
                      href={match.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center h-8 w-8 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Youtube className="w-4 h-4" />
                    </a>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
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

      <MatchDetailDialog match={selectedMatch} onClose={() => setSelectedMatch(null)} />
    </div>
  );
}
