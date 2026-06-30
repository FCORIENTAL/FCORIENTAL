import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPlayers, getPlayerStats, deletePlayer } from "@/lib/firebase";
import { useYear } from "@/contexts/YearContext";
import PlayerForm from "@/components/players/player-form";
import type { Player, PlayerStats } from "@shared/schema";

type SortKey = "name" | "goals" | "assists" | "saves" | "appearances";
type SortDir = "desc" | "asc";

export default function Players() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("goals");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedYear } = useYear();

  const { data: playerStats = [], isLoading: isLoadingStats } = useQuery<PlayerStats[]>({
    queryKey: ["playerStats", selectedYear],
    queryFn: () => getPlayerStats(selectedYear),
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["players"],
    queryFn: () => getPlayers(),
  });

  const deletePlayerMutation = useMutation({
    mutationFn: (playerId: string) => deletePlayer(playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      queryClient.invalidateQueries({ queryKey: ["playerStats"] });
      toast({ title: "선수 삭제 완료", description: "선수가 성공적으로 삭제되었습니다." });
    },
    onError: () => {
      toast({ title: "삭제 실패", description: "선수 삭제 중 오류가 발생했습니다.", variant: "destructive" });
    },
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 inline ml-1 opacity-40" />;
    return sortDir === "desc"
      ? <ChevronDown className="w-3 h-3 inline ml-1" />
      : <ChevronUp className="w-3 h-3 inline ml-1" />;
  }

  const sortedStats = useMemo(() => {
    const filtered = playerStats.filter((stat) =>
      stat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      if (sortKey === "name") {
        return sortDir === "desc"
          ? b.name.localeCompare(a.name, "ko")
          : a.name.localeCompare(b.name, "ko");
      }
      return sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey];
    });
  }, [playerStats, searchTerm, sortKey, sortDir]);

  function thClass(col: SortKey) {
    return `text-center py-3 px-6 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground ${sortKey === col ? "text-foreground" : ""}`;
  }

  const handleDeletePlayer = (playerId: string) => {
    if (confirm("정말로 이 선수를 삭제하시겠습니까?")) {
      deletePlayerMutation.mutate(playerId);
    }
  };

  if (isLoadingStats) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <Card><CardContent className="p-4"><div className="h-10 bg-muted rounded"></div></CardContent></Card>
          <Card><div className="h-64 bg-muted rounded"></div></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">선수 관리</h2>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-player" className="bg-primary text-primary-foreground hover:bg-accent">
              <Plus className="w-4 h-4 mr-2" />
              선수 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>새 선수 추가</DialogTitle></DialogHeader>
            <PlayerForm onSuccess={() => setIsAddModalOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <Input
            data-testid="input-search-players"
            type="text"
            placeholder="선수명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th
                  className={`text-left py-3 px-6 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground ${sortKey === "name" ? "text-foreground" : ""}`}
                  onClick={() => handleSort("name")}
                >
                  선수명<SortIcon col="name" />
                </th>
                <th className={thClass("goals")} onClick={() => handleSort("goals")}>
                  득점<SortIcon col="goals" />
                </th>
                <th className={thClass("assists")} onClick={() => handleSort("assists")}>
                  어시스트<SortIcon col="assists" />
                </th>
                <th className={thClass("saves")} onClick={() => handleSort("saves")}>
                  선방<SortIcon col="saves" />
                </th>
                <th className={thClass("appearances")} onClick={() => handleSort("appearances")}>
                  출석<SortIcon col="appearances" />
                </th>
                <th className="text-center py-3 px-6 font-medium text-muted-foreground">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedStats.length > 0 ? (
                sortedStats.map((stat) => {
                  const player = players.find((p) => p.id === stat.id);
                  return (
                    <tr key={stat.id} className="hover:bg-muted/50">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                            {stat.name.charAt(0)}
                          </div>
                          <div>
                            <p data-testid={`text-player-name-${stat.id}`} className="font-medium text-foreground">
                              {stat.name}
                            </p>
                            {stat.number && (
                              <p data-testid={`text-player-number-${stat.id}`} className="text-sm text-muted-foreground">
                                #{stat.number}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td data-testid={`text-player-goals-${stat.id}`} className="py-4 px-6 text-center font-bold text-primary">
                        {stat.goals}
                      </td>
                      <td data-testid={`text-player-assists-${stat.id}`} className="py-4 px-6 text-center font-bold text-blue-600">
                        {stat.assists}
                      </td>
                      <td data-testid={`text-player-saves-${stat.id}`} className="py-4 px-6 text-center font-bold text-green-600">
                        {stat.saves}
                      </td>
                      <td data-testid={`text-player-appearances-${stat.id}`} className="py-4 px-6 text-center font-medium text-foreground">
                        {stat.appearances}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            data-testid={`button-edit-player-${stat.id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => player && setEditingPlayer(player)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            data-testid={`button-delete-player-${stat.id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePlayer(stat.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 px-6 text-center text-muted-foreground">
                    {searchTerm ? "검색 결과가 없습니다." : "등록된 선수가 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!editingPlayer} onOpenChange={() => setEditingPlayer(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>선수 정보 수정</DialogTitle></DialogHeader>
          {editingPlayer && (
            <PlayerForm player={editingPlayer} onSuccess={() => setEditingPlayer(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
