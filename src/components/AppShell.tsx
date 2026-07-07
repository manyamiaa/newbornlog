import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, Baby, Calendar as CalIcon, LineChart, ListChecks, LogOut, Home } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { JungleDecor } from "@/components/JungleDecor";

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
    <div className="relative min-h-screen bg-jungle">
      <JungleDecor />
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border/60">
        <div className="max-w-2xl mx-auto flex items-center gap-2 px-4 h-16">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu" className="rounded-xl">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-jungle">
              <SheetHeader className="p-4 border-b border-border/60">
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-leaf">
                    <Baby className="w-4 h-4" />
                  </div>
                  <span className="font-semibold tracking-tight">Baby Log</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="p-3 space-y-1">
                {NAV.map((item) => {
                  const active = pathname === item.to;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/80 hover:bg-secondary/60",
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium hover:bg-secondary/60 text-muted-foreground"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Link to="/" className="w-8 h-8 rounded-xl bg-primary/90 text-primary-foreground flex items-center justify-center shadow-leaf shrink-0 hover:bg-primary transition-colors">
              <Baby className="w-4 h-4" />
            </Link>
            <h1 className="text-base font-semibold tracking-tight truncate">{title ?? "Baby Log"}</h1>
          </div>
          {right}
        </div>
      </header>
      <main className="relative max-w-2xl mx-auto px-4 pb-24 pt-6">{children}</main>
    </div>
  );
}
