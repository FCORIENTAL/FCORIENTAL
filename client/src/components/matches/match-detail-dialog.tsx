import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Target, Calendar, Trophy } from "lucide-react";
import type { MatchWithDetails } from "@shared/schema";

interface MatchDetailDialogProps {
  match: MatchWithDetails | null;
  onClose: () => void;
}

const resultConfig = {
  win:  { label: "승리",  className: "bg-green-100 text-green-800 border-green-200" },
  loss: { label: "패배",  className: "bg-red-100 text-red-800 border-red-200" },
  draw: { label: "무승부", className: "bg-gray-100 text-gray-800 border-gray-200" },
};

export default function MatchDetailDialog({ match, onClose }: MatchDetailDialogProps) {
  if (!match) return null;

  const result = resultConfig[match.result] ?? resultConfig.draw;

  return (
    <Dialog open={!!match} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            경기 상세 정보
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* 날짜 / 시즌 / 결과 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{match.date}</p>
              <p className="text-xs text-muted-foreground">{match.season} 시즌</p>
            </div>
            <Badge className={`text-sm px-3 py-1 ${result.className}`}>
              {result.label}
            </Badge>
          </div>

          {/* 스코어 */}
          <div className="bg-muted/40 rounded-xl p-5 flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-sm font-bold text-foreground mb-1">FC ORIENTAL</p>
              <p className="text-5xl font-extrabold text-primary">{match.ourScore}</p>
            </div>
            <p className="text-xl font-bold text-muted-foreground">VS</p>
            <div className="text-center">
              <p className="text-sm font-bold text-foreground mb-1">{match.opponent}</p>
              <p className="text-5xl font-extrabold text-muted-foreground">{match.theirScore}</p>
            </div>
          </div>

          {/* 출전 선수 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">
                출전 선수 <span className="text-muted-foreground font-normal">({match.participants.length}명)</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[...match.participants].sort((a, b) => a.name.localeCompare(b.name, "ko")).map((player) => (
                <span
                  key={player.id}
                  className="bg-muted text-muted-foreground text-xs px-2.5 py-1 rounded-full"
                >
                  {player.name}
                </span>
              ))}
            </div>
          </div>

          {/* 득점 / 어시스트 */}
          {match.goalDetails.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">득점 기록</p>
              </div>
              <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                {match.goalDetails.map((g) => (
                  <div key={g.playerId} className="flex items-center justify-between px-3 py-2 bg-background">
                    <span className="text-sm font-medium text-foreground">{g.playerName}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {g.goals > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="text-primary font-bold text-sm">{g.goals}</span> 골
                        </span>
                      )}
                      {g.assists > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="text-blue-500 font-bold text-sm">{g.assists}</span> 어시스트
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 메모 */}
          {match.notes && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">메모</p>
              </div>
              <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-3">{match.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
