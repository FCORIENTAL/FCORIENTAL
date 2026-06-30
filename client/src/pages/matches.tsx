import { Card, CardContent } from "@/components/ui/card";
import MatchForm from "@/components/matches/match-form";

export default function Matches() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-foreground">경기 기록</h2>

      <Card>
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">새 경기 기록</h3>
          <p className="text-sm text-muted-foreground mt-1">경기 결과와 출전 선수, 득점자를 기록하세요</p>
        </div>
        <CardContent className="p-6">
          <MatchForm />
        </CardContent>
      </Card>
    </div>
  );
}
