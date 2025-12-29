import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertPlayerSchema } from "@shared/schema";
import type { Player, InsertPlayer } from "@shared/schema";
import { z } from "zod";

const playerFormSchema = insertPlayerSchema.extend({
  number: z.coerce.number().optional(),
});

interface PlayerFormProps {
  player?: Player;
  onSuccess?: () => void;
}

export default function PlayerForm({ player, onSuccess }: PlayerFormProps) {
  const { toast } = useToast();
  const isEditing = !!player;

  const form = useForm<z.infer<typeof playerFormSchema>>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: player?.name || "",
      position: player?.position || undefined,
      number: player?.number || undefined,
      joinDate: player?.joinDate || new Date().toISOString().split('T')[0],
    },
  });

  const createPlayerMutation = useMutation({
    mutationFn: async (data: InsertPlayer) => {
      const response = await apiRequest("POST", "/api/players", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players/stats"] });
      toast({
        title: "선수 추가 완료",
        description: "새 선수가 성공적으로 추가되었습니다.",
      });
      form.reset();
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "추가 실패",
        description: "선수 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const updatePlayerMutation = useMutation({
    mutationFn: async (data: Partial<InsertPlayer>) => {
      const response = await apiRequest("PUT", `/api/players/${player!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players/stats"] });
      toast({
        title: "선수 정보 수정 완료",
        description: "선수 정보가 성공적으로 수정되었습니다.",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "수정 실패",
        description: "선수 정보 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof playerFormSchema>) => {
    const playerData: InsertPlayer = {
      name: data.name,
      position: data.position || undefined,
      number: data.number || null,
      joinDate: data.joinDate,
    };

    if (isEditing) {
      updatePlayerMutation.mutate(playerData);
    } else {
      createPlayerMutation.mutate(playerData);
    }
  };

  const isPending = createPlayerMutation.isPending || updatePlayerMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>선수명</FormLabel>
              <FormControl>
                <Input 
                  data-testid="input-player-name"
                  placeholder="선수명을 입력하세요" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>등번호 (선택사항)</FormLabel>
              <FormControl>
                <Input
                  data-testid="input-player-number"
                  type="number"
                  placeholder="등번호"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="joinDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>가입일</FormLabel>
              <FormControl>
                <Input
                  data-testid="input-player-join-date"
                  type="date"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            data-testid="button-cancel-player"
            type="button" 
            variant="outline"
            onClick={() => onSuccess?.()}
          >
            취소
          </Button>
          <Button 
            data-testid="button-save-player"
            type="submit" 
            disabled={isPending}
            className="bg-primary text-primary-foreground hover:bg-accent"
          >
            {isPending ? "저장 중..." : isEditing ? "수정" : "추가"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
