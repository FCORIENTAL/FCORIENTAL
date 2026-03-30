import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getPlayers, addMatch } from "@/lib/firebase";
import { insertMatchSchema } from "@shared/schema";
import type { Player } from "@shared/schema";
import { z } from "zod";
import { useState } from "react";

const matchFormSchema = insertMatchSchema.extend({
  ourScore: z.coerce.number().min(0),
  theirScore: z.coerce.number().min(0),
});

interface MatchFormProps {
  onSuccess?: () => void;
}

export default function MatchForm({ onSuccess }: MatchFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [playerGoals, setPlayerGoals] = useState<Record<string, number>>({});
  const [playerAssists, setPlayerAssists] = useState<Record<string, number>>({});

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["players"],
    queryFn: () => getPlayers(),
  });

  const form = useForm<z.infer<typeof matchFormSchema>>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      opponent: "",
      ourScore: 0,
      theirScore: 0,
      notes: "",
      season: "2025",
      participants: [],
      playerGoals: [],
    },
  });

  const createMatchMutation = useMutation({
    mutationFn: (data: z.infer<typeof matchFormSchema>) => {
      const goals = Object.entries(playerGoals)
        .map(([playerId, count]) => ({
          playerId,
          count,
          assists: playerAssists[playerId] || 0,
        }));

      return addMatch({
        date: data.date,
        opponent: data.opponent,
        ourScore: data.ourScore,
        theirScore: data.theirScore,
        notes: data.notes || null,
        season: data.season,
        participants: data.participants,
        goals,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matchesWithDetails"] });
      queryClient.invalidateQueries({ queryKey: ["playerStats"] });
      queryClient.invalidateQueries({ queryKey: ["seasonStats"] });
      toast({ title: "경기 기록 완료", description: "새 경기가 성공적으로 기록되었습니다." });
      form.reset();
      setPlayerGoals({});
      setPlayerAssists({});
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "기록 실패", description: "경기 기록 중 오류가 발생했습니다.", variant: "destructive" });
    },
  });

  const handleGoalChange = (playerId: string, goals: number) => {
    setPlayerGoals((prev) => ({ ...prev, [playerId]: Math.max(0, goals) }));
  };

  const handleAssistChange = (playerId: string, assists: number) => {
    setPlayerAssists((prev) => ({ ...prev, [playerId]: Math.max(0, assists) }));
  };

  const selectedParticipants = form.watch("participants") || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => createMatchMutation.mutate(data))} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>경기 날짜</FormLabel>
                <FormControl>
                  <Input data-testid="input-match-date" type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="opponent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>상대팀</FormLabel>
                <FormControl>
                  <Input data-testid="input-opponent" placeholder="상대팀명" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ourScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>우리팀 득점</FormLabel>
                <FormControl>
                  <Input data-testid="input-our-score" type="number" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="theirScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>상대팀 득점</FormLabel>
                <FormControl>
                  <Input data-testid="input-their-score" type="number" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="season"
          render={({ field }) => (
            <FormItem>
              <FormLabel>시즌</FormLabel>
              <FormControl>
                <Input data-testid="input-season" placeholder="예: 2025" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="participants"
          render={() => (
            <FormItem>
              <FormLabel>출전 선수</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border border-input rounded-lg bg-muted/30">
                {players.map((player) => (
                  <FormField
                    key={player.id}
                    control={form.control}
                    name="participants"
                    render={({ field }) => (
                      <FormItem
                        key={player.id}
                        className="flex flex-row items-center space-x-3 space-y-0 p-2 hover:bg-background rounded cursor-pointer"
                      >
                        <FormControl>
                          <Checkbox
                            data-testid={`checkbox-participant-${player.id}`}
                            checked={field.value?.includes(player.id)}
                            onCheckedChange={(checked) => {
                              const currentValue = field.value || [];
                              if (checked) {
                                field.onChange([...currentValue, player.id]);
                              } else {
                                field.onChange(currentValue.filter((v) => v !== player.id));
                                setPlayerGoals((prev) => { const u = { ...prev }; delete u[player.id]; return u; });
                                setPlayerAssists((prev) => { const u = { ...prev }; delete u[player.id]; return u; });
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm cursor-pointer">{player.name}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedParticipants.length > 0 && (
          <div>
            <FormLabel>득점 및 어시스트 기록</FormLabel>
            <div className="space-y-3 p-4 border border-input rounded-lg bg-muted/30 mt-2">
              {selectedParticipants.map((playerId) => {
                const player = players.find((p) => p.id === playerId);
                if (!player) return null;
                return (
                  <div key={playerId} className="flex items-center space-x-3 pb-3 border-b border-input last:border-b-0">
                    <label className="text-sm font-medium min-w-32">{player.name}</label>
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="flex items-center space-x-1">
                        <Label className="text-xs text-muted-foreground">득점</Label>
                        <Input
                          data-testid={`input-goals-${playerId}`}
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-16 h-8"
                          value={playerGoals[playerId] || 0}
                          onChange={(e) => handleGoalChange(playerId, parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <Label className="text-xs text-muted-foreground">어시스트</Label>
                        <Input
                          data-testid={`input-assists-${playerId}`}
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-16 h-8"
                          value={playerAssists[playerId] || 0}
                          onChange={(e) => handleAssistChange(playerId, parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>경기 메모</FormLabel>
              <FormControl>
                <Textarea
                  data-testid="textarea-match-notes"
                  placeholder="경기에 대한 메모나 특이사항을 기록하세요..."
                  rows={3}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3">
          <Button data-testid="button-cancel-match" type="button" variant="outline" onClick={() => onSuccess?.()}>
            취소
          </Button>
          <Button
            data-testid="button-save-match"
            type="submit"
            disabled={createMatchMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-accent"
          >
            {createMatchMutation.isPending ? "저장 중..." : "경기 저장"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
