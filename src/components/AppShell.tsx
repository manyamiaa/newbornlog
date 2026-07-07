import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Menu, Baby, Calendar as CalIcon, LineChart, ListChecks, LogOut, Home, Heart } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { JungleDecor } from "@/components/JungleDecor";
import { toast } from "sonner";
import { useAppPaths, useDataClient } from "@/lib/data-client";

export function AppShell({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();
  const client = useDataClient();
  const paths = useAppPaths();

  const NAV = [
    { to: paths.home, label: "Home", icon: Home },
    { to: paths.calendar, label: "Calendar", icon: CalIcon },
    { to: paths.insights, label: "Insights", icon: LineChart },
    { to: paths.activities, label: "Activities", icon: ListChecks },
  ];

  const { data: profile } = useQuery({
    queryKey: [client.mode, "profile"],
    queryFn: () => client.getProfile(),
  });

  const [nameOpen, setNameOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    // Only prompt in auth mode — the demo always ships with a baby name.
    if (client.mode === "auth" && profile && !profile.baby_name) {
      setNameOpen(true);
    }
  }, [profile, client.mode]);

  const saveName = useMutation({
    mutationFn: (baby_name: string) => client.updateBabyName({ data: { baby_name } }),
    onSuccess: (row) => {
      qc.setQueryData([client.mode, "profile"], row);
      setNameOpen(false);
      setNameInput("");
      toast.success("Saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const signOut = async () => {
    if (client.mode === "auth") {
      await supabase.auth.signOut();
    }
    navigate({ to: "/auth" });
  };

  return (
    <div className="relative min-h-screen bg-jungle">
      <JungleDecor />
      {client.mode === "demo" && (
        <div className="sticky top-0 z-40 bg-emerald-600 text-white text-xs font-medium text-center py-1.5 px-3">
          Demo mode — changes won't be saved.{" "}
          <Link to="/auth" className="underline underline-offset-2">
            Sign up to keep your data
          </Link>
        </div>
      )}
      <header className={cn("sticky z-30 backdrop-blur-md bg-background/70 border-b border-border/60", client.mode === "demo" ? "top-7" : "top-0")}>
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
                  onClick={() => {
                    setOpen(false);
                    setNameInput(profile?.baby_name ?? "");
                    setNameOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium hover:bg-secondary/60 text-foreground/80"
                >
                  <Heart className="w-4 h-4 text-emerald-500" fill="currentColor" />
                  {profile?.baby_name ? "Edit baby's name" : "Set baby's name"}
                </button>
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium hover:bg-secondary/60 text-muted-foreground"
                >
                  <LogOut className="w-4 h-4" />
                  {client.mode === "demo" ? "Exit demo" : "Sign out"}
                </button>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Link to={paths.home} className="w-8 h-8 rounded-xl bg-primary/90 text-primary-foreground flex items-center justify-center shadow-leaf shrink-0 hover:bg-primary transition-colors">
              <Baby className="w-4 h-4" />
            </Link>
            <h1 className="text-base font-semibold tracking-tight truncate">{title ?? "Baby Log"}</h1>
          </div>
          {profile?.baby_name && (
            <button
              type="button"
              onClick={() => {
                setNameInput(profile.baby_name ?? "");
                setNameOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary/60 hover:bg-secondary transition-colors text-sm font-medium max-w-[45%]"
              aria-label="Edit baby's name"
            >
              <Heart className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" />
              <span className="truncate">{profile.baby_name}</span>
            </button>
          )}
          {right}
        </div>
      </header>
      <main className="relative max-w-2xl mx-auto px-4 pb-24 pt-6">{children}</main>

      <Dialog open={nameOpen} onOpenChange={(v) => { if (!saveName.isPending) setNameOpen(v); }}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-emerald-500" fill="currentColor" />
              {profile?.baby_name ? "Edit baby's name" : "What's your baby's name?"}
            </DialogTitle>
            <DialogDescription>
              We'll show it at the top so this log feels a bit more like theirs.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = nameInput.trim();
              if (!v) return;
              saveName.mutate(v);
            }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label htmlFor="baby-name">Baby's name</Label>
              <Input
                id="baby-name"
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Noa"
                maxLength={60}
                className="rounded-xl"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saveName.isPending || !nameInput.trim()} className="rounded-xl">
                {saveName.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
