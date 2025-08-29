import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import MatchForm from "@/components/matches/match-form";

export default function Matches() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">경기 기록</h2>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-match" className="bg-primary text-primary-foreground hover:bg-accent">
              <Plus className="w-4 h-4 mr-2" />
              경기 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>새 경기 기록</DialogTitle>
            </DialogHeader>
            <MatchForm onSuccess={() => setIsAddModalOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Match Recording Form */}
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
