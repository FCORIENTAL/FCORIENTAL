import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPlayers, addPlayer, addMatch, getMatches } from "@/lib/firebase";
import type { Player } from "@shared/schema";

const PLAYERS_2023: { name: string; number: number | null }[] = [
  { name: "김경운", number: 0 },
  { name: "김다현", number: 8 },
  { name: "김민수", number: 17 },
  { name: "김민준", number: 1 },
  { name: "김어진", number: 18 },
  { name: "김영우", number: 6 },
  { name: "김정현", number: 11 },
  { name: "김준", number: 66 },
  { name: "김지환", number: 10 },
  { name: "김태현", number: 12 },
  { name: "박범기", number: 3 },
  { name: "손성진", number: 13 },
  { name: "심현섭", number: 20 },
  { name: "우대웅", number: 19 },
  { name: "이성헌", number: 4 },
  { name: "이영조", number: 89 },
  { name: "이종민", number: 2 },
  { name: "이종호", number: 9 },
  { name: "이혁주", number: 5 },
  { name: "임성준", number: 30 },
  { name: "전상우", number: 7 },
  { name: "전승헌", number: 93 },
  { name: "조상준", number: 46 },
  { name: "지성배", number: 98 },
  { name: "최문기", number: 1 },
  { name: "최세중", number: 23 },
  { name: "최원배", number: 25 },
  { name: "최윤성", number: 14 },
  { name: "한성현", number: 26 },
  { name: "홍민기", number: 15 },
  { name: "황병준", number: 77 },
];

const MATCHES_2023: { date: string; players: Record<string, { goals: number; assists: number }> }[] = [
  {
    date: "2023-01-08",
    players: {
      "김경운": { goals: 4, assists: 5 },
      "김민준": { goals: 0, assists: 0 },
      "김정현": { goals: 5, assists: 0 },
      "우대웅": { goals: 0, assists: 0 },
      "이영조": { goals: 1, assists: 0 },
      "임성준": { goals: 4, assists: 4 },
      "최세중": { goals: 1, assists: 0 },
      "최원배": { goals: 6, assists: 2 },
      "한성현": { goals: 4, assists: 4 },
    },
  },
  {
    date: "2023-01-15",
    players: {
      "김민준": { goals: 0, assists: 0 },
      "김정현": { goals: 1, assists: 0 },
      "박범기": { goals: 1, assists: 0 },
      "손성진": { goals: 3, assists: 3 },
      "이영조": { goals: 0, assists: 0 },
      "이종호": { goals: 7, assists: 2 },
      "전상우": { goals: 3, assists: 5 },
      "최세중": { goals: 1, assists: 0 },
      "한성현": { goals: 3, assists: 6 },
    },
  },
  {
    date: "2023-01-29",
    players: {
      "김경운": { goals: 0, assists: 1 },
      "김어진": { goals: 4, assists: 0 },
      "김정현": { goals: 0, assists: 1 },
      "박범기": { goals: 0, assists: 1 },
      "손성진": { goals: 1, assists: 1 },
      "이종호": { goals: 4, assists: 0 },
      "임성준": { goals: 1, assists: 1 },
      "전상우": { goals: 0, assists: 2 },
      "최원배": { goals: 3, assists: 3 },
      "최윤성": { goals: 0, assists: 0 },
      "한성현": { goals: 1, assists: 3 },
    },
  },
  {
    date: "2023-02-12",
    players: {
      "박범기": { goals: 0, assists: 0 },
      "임성준": { goals: 3, assists: 1 },
      "전상우": { goals: 0, assists: 1 },
      "전승헌": { goals: 0, assists: 3 },
      "조상준": { goals: 2, assists: 1 },
      "최원배": { goals: 6, assists: 4 },
      "한성현": { goals: 5, assists: 2 },
      "황병준": { goals: 2, assists: 2 },
    },
  },
  {
    date: "2023-02-19",
    players: {
      "김어진": { goals: 3, assists: 5 },
      "박범기": { goals: 0, assists: 0 },
      "이종호": { goals: 9, assists: 1 },
      "전상우": { goals: 1, assists: 1 },
      "전승헌": { goals: 1, assists: 1 },
      "조상준": { goals: 4, assists: 1 },
      "한성현": { goals: 4, assists: 7 },
    },
  },
  {
    date: "2023-03-12",
    players: {
      "박범기": { goals: 0, assists: 0 },
      "이성헌": { goals: 0, assists: 1 },
      "임성준": { goals: 0, assists: 1 },
      "전상우": { goals: 0, assists: 0 },
      "전승헌": { goals: 1, assists: 2 },
      "조상준": { goals: 1, assists: 0 },
      "최세중": { goals: 2, assists: 1 },
      "최원배": { goals: 4, assists: 1 },
      "한성현": { goals: 2, assists: 4 },
      "황병준": { goals: 5, assists: 2 },
    },
  },
  {
    date: "2023-03-19",
    players: {
      "김민수": { goals: 0, assists: 0 },
      "김정현": { goals: 0, assists: 0 },
      "박범기": { goals: 0, assists: 0 },
      "손성진": { goals: 0, assists: 0 },
      "우대웅": { goals: 0, assists: 0 },
      "이성헌": { goals: 0, assists: 0 },
      "이종민": { goals: 0, assists: 0 },
      "이종호": { goals: 0, assists: 0 },
      "전승헌": { goals: 0, assists: 0 },
      "조상준": { goals: 0, assists: 0 },
      "최세중": { goals: 0, assists: 0 },
      "한성현": { goals: 0, assists: 0 },
      "홍민기": { goals: 0, assists: 0 },
      "황병준": { goals: 0, assists: 0 },
    },
  },
  {
    date: "2023-03-26",
    players: {
      "김정현": { goals: 1, assists: 0 },
      "박범기": { goals: 1, assists: 0 },
      "이종호": { goals: 9, assists: 3 },
      "임성준": { goals: 2, assists: 3 },
      "전승헌": { goals: 0, assists: 0 },
      "최세중": { goals: 1, assists: 2 },
      "한성현": { goals: 2, assists: 5 },
    },
  },
  {
    date: "2023-04-02",
    players: {
      "박범기": { goals: 1, assists: 2 },
      "이성헌": { goals: 3, assists: 0 },
      "이영조": { goals: 2, assists: 3 },
      "전상우": { goals: 2, assists: 0 },
      "조상준": { goals: 1, assists: 1 },
      "최윤성": { goals: 2, assists: 0 },
      "한성현": { goals: 4, assists: 5 },
      "황병준": { goals: 3, assists: 6 },
    },
  },
  {
    date: "2023-04-09",
    players: {
      "김민준": { goals: 0, assists: 0 },
      "김정현": { goals: 0, assists: 0 },
      "박범기": { goals: 0, assists: 1 },
      "임성준": { goals: 2, assists: 1 },
      "전상우": { goals: 1, assists: 1 },
      "전승헌": { goals: 0, assists: 0 },
      "조상준": { goals: 1, assists: 3 },
      "최원배": { goals: 4, assists: 1 },
      "이혁주": { goals: 3, assists: 2 },
    },
  },
  {
    date: "2023-04-16",
    players: {
      "김민수": { goals: 0, assists: 0 },
      "김민준": { goals: 0, assists: 0 },
      "김정현": { goals: 0, assists: 0 },
      "박범기": { goals: 0, assists: 0 },
      "손성진": { goals: 0, assists: 0 },
      "우대웅": { goals: 0, assists: 0 },
      "임성준": { goals: 0, assists: 0 },
      "전상우": { goals: 0, assists: 0 },
      "조상준": { goals: 0, assists: 0 },
      "최세중": { goals: 0, assists: 0 },
      "한성현": { goals: 0, assists: 0 },
      "홍민기": { goals: 0, assists: 0 },
    },
  },
  {
    date: "2023-04-23",
    players: {
      "김경운": { goals: 1, assists: 1 },
      "김정현": { goals: 1, assists: 0 },
      "박범기": { goals: 0, assists: 0 },
      "우대웅": { goals: 0, assists: 0 },
      "이성헌": { goals: 1, assists: 0 },
      "임성준": { goals: 0, assists: 0 },
      "전상우": { goals: 0, assists: 1 },
      "조상준": { goals: 1, assists: 0 },
      "최세중": { goals: 1, assists: 0 },
      "최원배": { goals: 2, assists: 3 },
      "한성현": { goals: 6, assists: 3 },
      "황병준": { goals: 2, assists: 0 },
    },
  },
  {
    date: "2023-04-30",
    players: {
      "김민준": { goals: 0, assists: 0 },
      "김정현": { goals: 1, assists: 0 },
      "박범기": { goals: 0, assists: 1 },
      "우대웅": { goals: 0, assists: 2 },
      "이영조": { goals: 0, assists: 0 },
      "이종호": { goals: 9, assists: 0 },
      "전상우": { goals: 1, assists: 0 },
      "전승헌": { goals: 1, assists: 2 },
      "최세중": { goals: 0, assists: 2 },
    },
  },
  {
    date: "2023-05-14",
    players: {
      "김민수": { goals: 1, assists: 1 },
      "김민준": { goals: 0, assists: 0 },
      "박범기": { goals: 0, assists: 1 },
      "이영조": { goals: 0, assists: 1 },
      "임성준": { goals: 1, assists: 1 },
      "전상우": { goals: 2, assists: 0 },
      "전승헌": { goals: 3, assists: 1 },
      "최세중": { goals: 1, assists: 0 },
      "최원배": { goals: 8, assists: 3 },
      "한성현": { goals: 7, assists: 6 },
      "이혁주": { goals: 0, assists: 3 },
    },
  },
  {
    date: "2023-05-21",
    players: {
      "김민준": { goals: 0, assists: 0 },
      "이영조": { goals: 1, assists: 4 },
      "이종호": { goals: 12, assists: 2 },
      "임성준": { goals: 5, assists: 1 },
      "전상우": { goals: 1, assists: 3 },
      "전승헌": { goals: 1, assists: 2 },
      "최세중": { goals: 1, assists: 1 },
      "최원배": { goals: 4, assists: 3 },
      "한성현": { goals: 5, assists: 3 },
      "황병준": { goals: 5, assists: 10 },
    },
  },
  {
    date: "2023-06-04",
    players: {
      "김다현": { goals: 0, assists: 0 },
      "김민준": { goals: 0, assists: 0 },
      "김영우": { goals: 0, assists: 0 },
      "김정현": { goals: 0, assists: 0 },
      "김태현": { goals: 0, assists: 0 },
      "이영조": { goals: 0, assists: 0 },
      "전승헌": { goals: 0, assists: 0 },
      "이혁주": { goals: 0, assists: 0 },
      "최문기": { goals: 0, assists: 0 },
    },
  },
  {
    date: "2023-06-11",
    players: {
      "김민준": { goals: 0, assists: 0 },
      "박범기": { goals: 1, assists: 1 },
      "이영조": { goals: 1, assists: 1 },
      "이종호": { goals: 2, assists: 3 },
      "전승헌": { goals: 0, assists: 1 },
      "최원배": { goals: 4, assists: 3 },
      "한성현": { goals: 6, assists: 2 },
      "황병준": { goals: 3, assists: 2 },
      "이혁주": { goals: 3, assists: 2 },
    },
  },
  {
    date: "2023-06-18",
    players: {
      "김민준": { goals: 0, assists: 0 },
      "이종호": { goals: 2, assists: 2 },
      "전상우": { goals: 1, assists: 0 },
      "전승헌": { goals: 1, assists: 1 },
      "최세중": { goals: 2, assists: 3 },
      "한성현": { goals: 4, assists: 2 },
      "황병준": { goals: 2, assists: 2 },
    },
  },
  {
    date: "2023-06-25",
    players: {
      "김민수": { goals: 3, assists: 2 },
      "김민준": { goals: 0, assists: 1 },
      "이종민": { goals: 0, assists: 0 },
      "이종호": { goals: 7, assists: 3 },
      "전상우": { goals: 0, assists: 4 },
      "전승헌": { goals: 1, assists: 1 },
      "최세중": { goals: 0, assists: 0 },
      "최윤성": { goals: 0, assists: 2 },
      "한성현": { goals: 7, assists: 1 },
      "황병준": { goals: 7, assists: 8 },
      "이혁주": { goals: 3, assists: 1 },
    },
  },
];

type LogEntry = { type: "info" | "success" | "error"; message: string };

export default function Import2023() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  async function downloadBackup() {
    setBackingUp(true);
    try {
      const [players, matches] = await Promise.all([getPlayers(), getMatches()]);
      const backup = { exportedAt: new Date().toISOString(), players, matches };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fcoriental-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBackingUp(false);
    }
  }

  function log(type: LogEntry["type"], message: string) {
    setLogs((prev) => [...prev, { type, message }]);
  }

  async function runImport() {
    setRunning(true);
    setLogs([]);
    setDone(false);

    try {
      log("info", "기존 선수 데이터 조회 중...");
      const existingPlayers = await getPlayers();
      const nameToId = new Map<string, string>(existingPlayers.map((p) => [p.name, p.id]));
      log("info", `기존 선수 ${existingPlayers.length}명 확인`);

      log("info", "신규 선수 추가 중...");
      for (const p of PLAYERS_2023) {
        if (!nameToId.has(p.name)) {
          const newPlayer: Omit<Player, "id"> = {
            name: p.name,
            number: p.number,
            position: null,
            joinDate: "2023",
          };
          const created = await addPlayer(newPlayer);
          nameToId.set(p.name, created.id);
          log("success", `신규 선수 추가: ${p.name} (#${p.number ?? "-"})`);
        } else {
          log("info", `기존 선수 확인: ${p.name}`);
        }
      }

      log("info", `경기 데이터 입력 시작 (총 ${MATCHES_2023.length}경기)...`);
      let matchCount = 0;

      for (const match of MATCHES_2023) {
        const participants: string[] = [];
        const goals: { playerId: string; count: number; assists: number }[] = [];

        for (const [playerName, stats] of Object.entries(match.players)) {
          const pid = nameToId.get(playerName);
          if (!pid) {
            log("error", `선수 ID 없음: ${playerName} (${match.date})`);
            continue;
          }
          participants.push(pid);
          goals.push({ playerId: pid, count: stats.goals, assists: stats.assists });
        }

        await addMatch({
          date: match.date,
          opponent: "기록 없음",
          ourScore: 0,
          theirScore: 0,
          notes: "2023 상반기 기록 가져오기",
          season: "2023",
          participants,
          goals,
          mercenaries: [],
          youtubeUrl: null,
          badManners: false,
          civilWar: false,
          teamAPlayers: [],
        });

        matchCount++;
        log("success", `경기 입력 완료: ${match.date} (${participants.length}명 참가)`);
      }

      log("success", `✓ 완료! 선수 ${PLAYERS_2023.length}명, 경기 ${matchCount}경기 입력 완료`);
      setDone(true);
    } catch (err) {
      log("error", `오류 발생: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">2023 데이터 가져오기 (임시)</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">데이터 백업</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            입력 전에 현재 Firebase 데이터를 JSON 파일로 백업합니다.
          </p>
          <Button variant="outline" onClick={downloadBackup} disabled={backingUp}>
            {backingUp ? "백업 중..." : "백업 다운로드"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2023 상반기 데이터</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>선수: {PLAYERS_2023.length}명</p>
            <p>경기: {MATCHES_2023.length}경기 (2023-01-08 ~ 2023-06-25)</p>
            <p className="text-destructive font-medium">⚠ 한 번만 실행하세요. 중복 실행 시 데이터가 중복됩니다.</p>
          </div>
          <Button
            onClick={runImport}
            disabled={running || done}
            className="bg-primary text-primary-foreground hover:bg-accent"
          >
            {running ? "입력 중..." : done ? "완료됨" : "데이터 입력 시작"}
          </Button>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
              {logs.map((entry, i) => (
                <div
                  key={i}
                  className={
                    entry.type === "success"
                      ? "text-green-600"
                      : entry.type === "error"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }
                >
                  {entry.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
