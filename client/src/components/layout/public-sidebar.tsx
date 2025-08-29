import { Link, useLocation } from "wouter";
import { BarChart3, Users, History, X, Trophy, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/FC오리엔탈_배경1_1756466321842.png";

interface PublicSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  {
    href: "/",
    label: "대시보드",
    icon: BarChart3,
    testId: "nav-dashboard"
  },
  {
    href: "/players",
    label: "선수 목록", 
    icon: Users,
    testId: "nav-players"
  },
  {
    href: "/history",
    label: "경기 이력",
    icon: History,
    testId: "nav-history"
  }
];

export default function PublicSidebar({ isOpen, onClose }: PublicSidebarProps) {
  const [location] = useLocation();

  const handleAdminLogin = () => {
    window.location.href = "/login";
  };

  return (
    <aside 
      className={`fixed left-0 top-0 z-50 h-screen w-64 menu-bg border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <img 
            src={logoImage} 
            alt="FC ORIENTAL Logo" 
            className="w-7 h-7 rounded-full object-cover"
          />
          <span className="font-bold text-lg text-sidebar-foreground">FC ORIENTAL</span>
        </div>
        <button 
          data-testid="button-close-sidebar"
          onClick={onClose}
          className="lg:hidden text-sidebar-foreground hover:text-sidebar-accent-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <nav className="mt-6">
        {navigationItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <div 
                data-testid={item.testId}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors cursor-pointer ${
                  isActive 
                    ? 'sidebar-active text-sidebar-foreground' 
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground'
                }`}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-6 left-6 right-6 space-y-4">
        <Button
          data-testid="button-admin-login"
          onClick={handleAdminLogin}
          className="w-full bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground"
          size="sm"
        >
          <LogIn className="w-4 h-4 mr-2" />
          관리자 로그인
        </Button>
        
        <div className="bg-sidebar-accent/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-1">
            <Trophy className="w-4 h-4 text-sidebar-foreground" />
            <h4 className="font-medium text-sm text-sidebar-foreground">2024 시즌</h4>
          </div>
          <p className="text-xs text-sidebar-foreground/80" data-testid="text-season-stats">
            시즌 기록을 확인하세요
          </p>
        </div>
      </div>
    </aside>
  );
}