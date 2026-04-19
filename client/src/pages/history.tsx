import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Pencil, ChevronRight, Youtube } from "lucide-react";
import { getMatchesWithDetails, getMatches, deleteMatch, type FirebaseMatch } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import MatchForm from "@/components/matches/match-form";
import MatchDetailDialog from "@/components/matches/match-detail-dialog";
import type { MatchWithDetails } from "@shared/schema";

const currentYear = String(new Date().getFullYear());

export default function History() {
  const [searchTerm, setSearchTerm] = useState("");
  const [seasonFilter, setSeason] = useState("all");
  const [badMannersOnly, setBadMannersOnly] = useState(false);
  const [editingMatch, setEditingMatch] = useState<FirebaseMatch | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchWithDetails | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: matches = [], isLoading } = useQuery<MatchWithDetails[]>({
    queryKey: ["matchesWithDetails"],
    queryFn: () => getMatchesWithDetails(),
  });

  const { data: rawMatches = [] } = useQuery<FirebaseMatch[]>({
    queryKey: ["matches"],
    queryFn: () => getMatches(),
  });

  const deleteMatchMutation = useMutation({
    mutationFn: (matchId: string) => deleteMatch(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matchesWithDetails"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["playerStats"] });
      queryClient.invalidateQueries({ queryKey: ["seasonStats"] });
      toast({ title: "경기 삭제 완료", description: "경기가 성공적으로 삭제되었습니다." });
    },
    onError: () => {
      toast({ title: "삭제 실패", description: "경기 삭제 중 오류가 발생했습니다.", variant: "destructive" });
    },
  });

  const handleEditClick = (e: React.MouseEvent, matchId: string) => {
    e.stopPropagation();
    const raw = rawMatches.find((m) => m.id === matchId);
    if (raw) setEditingMatch(raw);
  };

  const handleDeleteClick = (e: React.MouseEvent, matchId: string) => {
    e.stopPropagation();
    if (confirm("이 경기를 삭제하시겠습니까?")) {
      deleteMatchMutation.mutate(matchId);
    }
  };

  const filteredMatches = matches.filter((match) => {
    const matchesSearch = match.opponent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeason = seasonFilter === "all" || match.season === seasonFilter;
    const matchesBadManners = !badMannersOnly || !!match.badManners;
    return matchesSearch && matchesSeason && matchesBadManners;
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setBadMannersOnly((v) => !v)}
            className={`flex items-center gap-1.5 h-9 px-3 shrink-0 ${badMannersOnly ? "border-red-600 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" : ""}`}
            title="비매너 팀 필터"
          >
            <div className={`h-4 w-3 rounded-sm shrink-0 ${badMannersOnly ? "bg-red-600" : "bg-muted-foreground/40"}`} />
          </Button>
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
              className="relative p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedMatch(match)}
            >
              {match.badManners && (
                <div
                  className="absolute top-2 right-2 h-5 w-4 rounded-sm bg-red-600 shadow-sm"
                  title="비매너 팀"
                />
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={getResultBadge(match.result)}>{getResultText(match.result)}</div>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">
                      FC ORIENTAL {match.ourScore} - {match.theirScore} {match.opponent}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {match.date} · {match.season} 시즌 · {match.participants.length}명 출전
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  {match.goalDetails.length > 0 && (
                    <span className="text-xs text-primary font-medium hidden sm:block mr-1">
                      ⚽ {match.goalDetails.reduce((s, g) => s + g.goals, 0)}골
                    </span>
                  )}
                  {match.youtubeUrl ? (
                    <a
                      href={match.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center h-7 w-7 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors shrink-0"
                    >
                      <Youtube className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="flex items-center justify-center h-7 w-7 rounded-md bg-muted text-muted-foreground/40 shrink-0 cursor-not-allowed">
                      <Youtube className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleEditClick(e, match.id)}
                    className="text-muted-foreground hover:text-primary h-8 w-8 p-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteClick(e, match.id)}
                    className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
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

      {/* 상세보기 다이얼로그 */}
      <MatchDetailDialog match={selectedMatch} onClose={() => setSelectedMatch(null)} />

      {/* 수정 다이얼로그 */}
      <Dialog open={!!editingMatch} onOpenChange={(open) => { if (!open) setEditingMatch(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>경기 수정</DialogTitle>
          </DialogHeader>
          {editingMatch && (
            <MatchForm
              initialMatch={editingMatch}
              onSuccess={() => setEditingMatch(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
