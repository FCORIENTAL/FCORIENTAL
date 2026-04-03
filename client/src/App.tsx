import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { YearProvider } from "@/contexts/YearContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Players from "@/pages/players";
import Matches from "@/pages/matches";
import History from "@/pages/history";
import PublicDashboard from "@/pages/public-dashboard";
import PublicPlayers from "@/pages/public-players";
import PublicHistory from "@/pages/public-history";
import Login from "@/pages/login";
import Sidebar from "@/components/layout/sidebar";
import PublicSidebar from "@/components/layout/public-sidebar";
import Header from "@/components/layout/header";
import { useState } from "react";

function AdminRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/players" component={Players} />
      <Route path="/matches" component={Matches} />
      <Route path="/history" component={History} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PublicRouter() {
  return (
    <Switch>
      <Route path="/" component={PublicDashboard} />
      <Route path="/players" component={PublicPlayers} />
      <Route path="/history" component={PublicHistory} />
      <Route path="/login" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  const isAdminUser = user && isAdmin();
  const SidebarComponent = isAdminUser ? Sidebar : PublicSidebar;
  const RouterComponent = isAdminUser ? AdminRouter : PublicRouter;

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <SidebarComponent isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <main>
          <RouterComponent />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <YearProvider>
          <TooltipProvider>
            <Router hook={useHashLocation}>
              <AppContent />
            </Router>
            <Toaster />
          </TooltipProvider>
        </YearProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
