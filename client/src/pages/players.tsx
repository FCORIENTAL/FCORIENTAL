import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import PlayerForm from "@/components/players/player-form";
import type { Player } from "@shared/schema";

export default function Players() {
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const { toast } = useToast();

  const { data: players = [], isLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const deletePlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      await apiRequest("DELETE", `/api/players/${playerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players/stats"] });
      toast({
        title: "선수 삭제 완료",
        description: "선수가 성공적으로 삭제되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "삭제 실패",
        description: "선수 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === "all" || player.position === positionFilter;
    return matchesSearch && matchesPosition;
  });

  const handleDeletePlayer = (playerId: string) => {
    if (confirm("정말로 이 선수를 삭제하시겠습니까?")) {
      deletePlayerMutation.mutate(playerId);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <Card>
            <CardContent className="p-4">
              <div className="h-10 bg-muted rounded"></div>
            </CardContent>
          </Card>
          <Card>
            <div className="h-64 bg-muted rounded"></div>
          </Card>
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
            <DialogHeader>
              <DialogTitle>새 선수 추가</DialogTitle>
            </DialogHeader>
            <PlayerForm 
              onSuccess={() => setIsAddModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                data-testid="input-search-players"
                type="text"
                placeholder="선수명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger data-testid="select-position-filter" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 포지션</SelectItem>
                  <SelectItem value="골키퍼">골키퍼</SelectItem>
                  <SelectItem value="수비수">수비수</SelectItem>
                  <SelectItem value="미드필더">미드필더</SelectItem>
                  <SelectItem value="공격수">공격수</SelectItem>
                </SelectContent>
              </Select>
              <Button data-testid="button-filter" variant="secondary">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Players Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">선수명</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">포지션</th>
                <th className="text-center py-3 px-6 font-medium text-muted-foreground">번호</th>
                <th className="text-center py-3 px-6 font-medium text-muted-foreground">가입일</th>
                <th className="text-center py-3 px-6 font-medium text-muted-foreground">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-muted/50">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                          {player.name.charAt(0)}
                        </div>
                        <div>
                          <p data-testid={`text-player-name-${player.id}`} className="font-medium text-foreground">
                            {player.name}
                          </p>
                          {player.number && (
                            <p data-testid={`text-player-number-${player.id}`} className="text-sm text-muted-foreground">
                              #{player.number}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span data-testid={`text-player-position-${player.id}`} className={`text-xs font-medium px-2 py-1 rounded-full ${
                        player.position === '골키퍼' ? 'bg-red-100 text-red-800' :
                        player.position === '수비수' ? 'bg-blue-100 text-blue-800' :
                        player.position === '미드필더' ? 'bg-green-100 text-green-800' :
                        player.position === '공격수' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {player.position}
                      </span>
                    </td>
                    <td data-testid={`text-player-number-display-${player.id}`} className="py-4 px-6 text-center text-foreground font-medium">
                      {player.number || '-'}
                    </td>
                    <td data-testid={`text-player-join-date-${player.id}`} className="py-4 px-6 text-center text-muted-foreground">
                      {player.joinDate}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          data-testid={`button-edit-player-${player.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingPlayer(player)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          data-testid={`button-delete-player-${player.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePlayer(player.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 px-6 text-center text-muted-foreground">
                    {searchTerm || positionFilter !== "all" 
                      ? "검색 결과가 없습니다." 
                      : "등록된 선수가 없습니다."
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Player Dialog */}
      <Dialog open={!!editingPlayer} onOpenChange={() => setEditingPlayer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>선수 정보 수정</DialogTitle>
          </DialogHeader>
          {editingPlayer && (
            <PlayerForm 
              player={editingPlayer}
              onSuccess={() => setEditingPlayer(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
