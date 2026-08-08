import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Baby } from "lucide-react";
import { JungleDecor } from "@/components/JungleDecor";

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Baby Log" },
      { name: "description", content: "Sign in to Baby Log to track feedings, sleep, diapers, and more." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const nextPath = safeNext(next);
  const goNext = () => {
    if (nextPath) window.location.href = nextPath;
    else navigate({ to: "/" });
  };
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) goNext();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, nextPath]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${nextPath ?? "/"}` },
        });
        if (error) throw error;
        toast.success("Account created — you're in!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      goNext();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}${nextPath ?? "/"}`,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    goNext();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-jungle">
      <JungleDecor />
      <Card className="relative w-full max-w-sm p-7 space-y-5 rounded-3xl border-border/60 shadow-leaf backdrop-blur-sm bg-card/85">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-leaf">
            <Baby className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Baby Log</h1>
          <p className="text-sm text-muted-foreground text-center">
            A calm little place to track feeds, sleep &amp; diapers.
          </p>
        </div>

        <Button variant="outline" className="w-full rounded-xl" onClick={handleGoogle}>
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl" />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={loading}>
            {loading ? "..." : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="w-full text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>

        <div className="relative pt-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">just looking?</span>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full rounded-xl"
          onClick={() => navigate({ to: "/demo" })}
        >
          See demo
        </Button>
      </Card>
    </div>
  );
}
