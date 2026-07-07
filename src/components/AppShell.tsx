import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, Baby, Calendar as CalIcon, LineChart, ListChecks, LogOut, Home } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/" as const, label: "Home", icon: Home },
  { to: "/calendar" as const, label: "Calendar", icon: CalIcon },
  { to: "/insights" as const, label: "Insights", icon: LineChart },
  { to: "/activities" as const, label: "Activities", icon: ListChecks },
];

export function AppShell({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-rose-50/40 dark:from-slate-950 dark:to-slate-900">
      <header className="sticky top-0 z-30 backdrop-blur bg-background/80 border-b">
        <div className="max-w-2xl mx-auto flex items-center gap-2 px-4 h-14">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                    <Baby className="w-4 h-4" />
                  </div>
                  Baby Log
                </SheetTitle>
              </SheetHeader>
              <nav className="p-2">
                {NAV.map((item) => {
                  const active = pathname === item.to;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium",
                        active ? "bg-primary/10 text-primary" : "hover:bg-muted",
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </nav>
            </SheetContent>
          </Sheet>
          <h1 className="text-base font-semibold flex-1 truncate">{title ?? "Baby Log"}</h1>
          {right}
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 pb-24 pt-4">{children}</main>
    </div>
  );
}
