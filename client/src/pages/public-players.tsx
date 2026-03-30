import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { getPlayers } from "@/lib/firebase";
import type { Player } from "@shared/schema";

export default function PublicPlayers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("all");

  const { data: players = [], isLoading } = useQuery<Player[]>({
    queryKey: ["players"],
    queryFn: () => getPlayers(),
  });

  const filteredPlayers = players.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === "all" || player.position === positionFilter;
    return matchesSearch && matchesPosition;
  });

  if (isLoading) {
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
        <h2 className="text-xl font-semibold text-foreground">선수 목록</h2>
      </div>

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

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">선수명</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">포지션</th>
                <th className="text-center py-3 px-6 font-medium text-muted-foreground">번호</th>
                <th className="text-center py-3 px-6 font-medium text-muted-foreground">가입일</th>
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
                      <span
                        data-testid={`text-player-position-${player.id}`}
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          player.position === "골키퍼" ? "bg-red-100 text-red-800" :
                          player.position === "수비수" ? "bg-blue-100 text-blue-800" :
                          player.position === "미드필더" ? "bg-green-100 text-green-800" :
                          player.position === "공격수" ? "bg-purple-100 text-purple-800" :
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {player.position || "-"}
                      </span>
                    </td>
                    <td data-testid={`text-player-number-display-${player.id}`} className="py-4 px-6 text-center text-foreground font-medium">
                      {player.number || "-"}
                    </td>
                    <td data-testid={`text-player-join-date-${player.id}`} className="py-4 px-6 text-center text-muted-foreground">
                      {player.joinDate}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 px-6 text-center text-muted-foreground">
                    {searchTerm || positionFilter !== "all"
                      ? "검색 결과가 없습니다."
                      : "등록된 선수가 없습니다."}
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
