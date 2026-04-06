import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { X, UserPlus, Youtube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPlayers, addMatch, updateMatch, type FirebaseMatch } from "@/lib/firebase";
import { insertMatchSchema } from "@shared/schema";
import type { Player } from "@shared/schema";
import { z } from "zod";
import { useState } from "react";

const matchFormSchema = insertMatchSchema.extend({
  ourScore: z.coerce.number().min(0),
  theirScore: z.coerce.number().min(0),
  youtubeUrl: z.string().optional(),
});

interface Mercenary {
  id: string;
  name: string;
}

interface MatchFormProps {
  onSuccess?: () => void;
  initialMatch?: FirebaseMatch;
}

export default function MatchForm({ onSuccess, initialMatch }: MatchFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditMode = !!initialMatch;

  const [playerGoals, setPlayerGoals] = useState<Record<string, number>>(() => {
    if (!initialMatch) return {};
    return Object.fromEntries(initialMatch.goals.map((g) => [g.playerId, g.count]));
  });
  const [playerAssists, setPlayerAssists] = useState<Record<string, number>>(() => {
    if (!initialMatch) return {};
    return Object.fromEntries(initialMatch.goals.map((g) => [g.playerId, g.assists]));
  });
  const [mercenaries, setMercenaries] = useState<Mercenary[]>(
    () => initialMatch?.mercenaries ?? []
  );

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["players"],
    queryFn: () => getPlayers(),
  });

  const form = useForm<z.infer<typeof matchFormSchema>>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: initialMatch
      ? {
          date: initialMatch.date,
          opponent: initialMatch.opponent,
          ourScore: initialMatch.ourScore,
          theirScore: initialMatch.theirScore,
          notes: initialMatch.notes ?? "",
          season: initialMatch.season,
          participants: initialMatch.participants,
          playerGoals: [],
          youtubeUrl: initialMatch.youtubeUrl ?? "",
        }
      : {
          date: new Date().toISOString().split("T")[0],
          opponent: "",
          ourScore: 0,
          theirScore: 0,
          notes: "",
          season: String(new Date().getFullYear()),
          participants: [],
          playerGoals: [],
          youtubeUrl: "",
        },
  });

  const buildGoals = () => {
    const allIds = new Set([...Object.keys(playerGoals), ...Object.keys(playerAssists)]);
    return Array.from(allIds).map((playerId) => ({
      playerId,
      count: playerGoals[playerId] || 0,
      assists: playerAssists[playerId] || 0,
    }));
  };

  const saveMatchMutation = useMutation({
    mutationFn: (data: z.infer<typeof matchFormSchema>) => {
      const payload = {
        date: data.date,
        opponent: data.opponent,
        ourScore: data.ourScore,
        theirScore: data.theirScore,
        notes: data.notes || null,
        season: data.season,
        participants: data.participants,
        goals: buildGoals(),
        mercenaries: mercenaries.length > 0 ? mercenaries : undefined,
        youtubeUrl: data.youtubeUrl || null,
      };
      if (isEditMode) return updateMatch(initialMatch.id, payload);
      return addMatch(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matchesWithDetails"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["playerStats"] });
      queryClient.invalidateQueries({ queryKey: ["seasonStats"] });
      toast({
        title: isEditMode ? "경기 수정 완료" : "경기 기록 완료",
        description: isEditMode
          ? "경기가 성공적으로 수정되었습니다."
          : "새 경기가 성공적으로 기록되었습니다.",
      });
      if (!isEditMode) {
        form.reset();
        setPlayerGoals({});
        setPlayerAssists({});
        setMercenaries([]);
      }
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: isEditMode ? "수정 실패" : "기록 실패",
        description: "경기 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleGoalChange = (playerId: string, goals: number) => {
    setPlayerGoals((prev) => ({ ...prev, [playerId]: Math.max(0, goals) }));
  };

  const handleAssistChange = (playerId: string, assists: number) => {
    setPlayerAssists((prev) => ({ ...prev, [playerId]: Math.max(0, assists) }));
  };

  const addMercenary = () => {
    if (mercenaries.length >= 10) return;
    const num = mercenaries.length + 1;
    setMercenaries((prev) => [...prev, { id: `merc_${Date.now()}`, name: `용병${num}` }]);
  };

  const removeMercenary = (id: string) => {
    setMercenaries((prev) => prev.filter((m) => m.id !== id));
    const current = form.getValues("participants");
    form.setValue("participants", current.filter((pid) => pid !== id));
    setPlayerGoals((prev) => { const u = { ...prev }; delete u[id]; return u; });
    setPlayerAssists((prev) => { const u = { ...prev }; delete u[id]; return u; });
  };

  const updateMercenaryName = (id: string, name: string) => {
    setMercenaries((prev) => prev.map((m) => (m.id === id ? { ...m, name } : m)));
  };

  const toggleMercParticipant = (id: string, checked: boolean) => {
    const current = form.getValues("participants");
    if (checked) {
      form.setValue("participants", [...current, id]);
    } else {
      form.setValue("participants", current.filter((pid) => pid !== id));
      setPlayerGoals((prev) => { const u = { ...prev }; delete u[id]; return u; });
      setPlayerAssists((prev) => { const u = { ...prev }; delete u[id]; return u; });
    }
  };

  const selectedParticipants = form.watch("participants") || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => saveMatchMutation.mutate(data))} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>경기 날짜</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
                  <Input placeholder="상대팀명" {...field} />
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
                  <Input type="number" min="0" {...field} />
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
                  <Input type="number" min="0" {...field} />
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
                <Input placeholder="예: 2025" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 출전 선수 */}
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

        {/* 용병 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel>용병</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMercenary}
              disabled={mercenaries.length >= 10}
              className="flex items-center gap-1.5 text-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              용병 추가 ({mercenaries.length}/10)
            </Button>
          </div>

          {mercenaries.length > 0 && (
            <div className="space-y-2 p-4 border border-input rounded-lg bg-muted/30">
              {mercenaries.map((merc) => (
                <div key={merc.id} className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedParticipants.includes(merc.id)}
                    onCheckedChange={(checked) => toggleMercParticipant(merc.id, !!checked)}
                  />
                  <Input
                    value={merc.name}
                    onChange={(e) => updateMercenaryName(merc.id, e.target.value)}
                    className="h-8 flex-1 max-w-44 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMercenary(merc.id)}
                    className="text-muted-foreground hover:text-destructive h-8 w-8 p-0 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 득점 및 어시스트 */}
        {selectedParticipants.length > 0 && (
          <div>
            <FormLabel>득점 및 어시스트 기록</FormLabel>
            <div className="space-y-3 p-4 border border-input rounded-lg bg-muted/30 mt-2">
              {selectedParticipants.map((playerId) => {
                const player = players.find((p) => p.id === playerId);
                const merc = mercenaries.find((m) => m.id === playerId);
                const name = player?.name ?? merc?.name;
                if (!name) return null;
                return (
                  <div key={playerId} className="flex items-center space-x-3 pb-3 border-b border-input last:border-b-0">
                    <label className="text-sm font-medium min-w-32 truncate">{name}</label>
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="flex items-center space-x-1">
                        <Label className="text-xs text-muted-foreground">득점</Label>
                        <Input
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
          name="youtubeUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Youtube className="w-4 h-4 text-red-500" />
                YouTube 링크
              </FormLabel>
              <FormControl>
                <Input placeholder="https://youtube.com/watch?v=..." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>경기 메모</FormLabel>
              <FormControl>
                <Textarea
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
          <Button type="button" variant="outline" onClick={() => onSuccess?.()}>
            취소
          </Button>
          <Button
            type="submit"
            disabled={saveMatchMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-accent"
          >
            {saveMatchMutation.isPending
              ? "저장 중..."
              : isEditMode
              ? "수정 저장"
              : "경기 저장"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
