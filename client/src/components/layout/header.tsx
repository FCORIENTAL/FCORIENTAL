import { Menu, LogOut, User } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useYear } from "@/contexts/YearContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onMenuToggle: () => void;
}

const pageTitles: Record<string, string> = {
  "/": "대시보드",
  "/players": "선수 관리",
  "/matches": "경기 기록", 
  "/history": "경기 이력"
};

const publicPageTitles: Record<string, string> = {
  "/": "대시보드",
  "/players": "선수 목록",
  "/history": "경기 이력"
};

export default function Header({ onMenuToggle }: HeaderProps) {
  const [location] = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const { selectedYear, setSelectedYear, availableYears } = useYear();

  const isAdminUser = user && isAdmin();
  const titles = isAdminUser ? pageTitles : publicPageTitles;
  const pageTitle = titles[location] || "FC ORIENTAL";

  const handleLogout = () => {
    logout();
  };

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
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year} className="text-xs">
                {year} 시즌
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {isAdminUser ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                data-testid="button-user-menu"
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
              >
                <User className="w-4 h-4" />
                <span data-testid="text-username" className="hidden sm:inline">{user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                data-testid="button-logout"
                onClick={handleLogout}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <User className="w-4 h-4" />
            <span className="text-sm">일반 사용자</span>
          </div>
        )}
      </div>
    </header>
  );
}
