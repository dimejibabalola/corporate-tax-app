import { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  BookOpen, 
  BrainCircuit, 
  BarChart2, 
  Settings, 
  Menu, 
  X,
  GraduationCap,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Textbook", icon: BookOpen, path: "/textbook" },
  { label: "Practice", icon: BrainCircuit, path: "/quiz" },
  { label: "Progress", icon: BarChart2, path: "/progress" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
      if (!session) navigate("/login");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) navigate("/login");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!session) return null;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-neutral-950 text-foreground overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <GraduationCap size={20} />
            </div>
            <span className="font-bold text-lg">TaxPrep</span>
          </div>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <X size={20} />
            </Button>
          )}
        </div>

        <nav className="p-4 space-y-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => isMobile && setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-neutral-800 space-y-4">
          <div className="bg-gray-50 dark:bg-neutral-800 p-3 rounded-lg border border-gray-100 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Exam Readiness</span>
              <span className="text-xs font-bold text-primary">0%</span>
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[0%]" />
            </div>
          </div>
          
          <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleSignOut}>
            <LogOut size={18} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <header className="flex items-center p-4 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 lg:hidden">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu size={20} />
            </Button>
            <span className="ml-3 font-semibold">TaxPrep</span>
          </header>
        )}
        
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet context={{ userId: session.user.id }} />
        </div>
      </main>
    </div>
  );
};