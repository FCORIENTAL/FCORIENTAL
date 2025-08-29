import { Menu, Settings } from "lucide-react";
import { useLocation } from "wouter";

interface HeaderProps {
  onMenuToggle: () => void;
}

const pageTitles: Record<string, string> = {
  "/": "대시보드",
  "/players": "선수 관리",
  "/matches": "경기 기록", 
  "/history": "경기 이력"
};

export default function Header({ onMenuToggle }: HeaderProps) {
  const [location] = useLocation();
  const pageTitle = pageTitles[location] || "FC ORIENTAL";

  return (
    <header className="bg-card border-b border-border h-16 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <button 
          data-testid="button-menu-toggle"
          onClick={onMenuToggle}
          className="lg:hidden text-muted-foreground hover:text-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 data-testid="text-page-title" className="text-xl font-semibold text-foreground">
          {pageTitle}
        </h1>
      </div>
      <div className="flex items-center space-x-3">
        <div className="bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">
          2024 시즌
        </div>
        <button 
          data-testid="button-settings"
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
