import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listActivities, listLogs, getRunningTimer, stopTimer } from "@/lib/baby-log.functions";
import { AppShell } from "@/components/AppShell";
import { ActivityIcon } from "@/components/ActivityIcon";
import { LogSheet } from "@/components/LogSheet";
import { ActivityEditorSheet } from "@/components/ActivityEditorSheet";
import { LogDetailSheet } from "@/components/LogDetailSheet";
import type { Activity, LogEntry } from "@/lib/baby-log-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format, startOfDay, endOfDay, differenceInSeconds } from "date-fns";
import { Square, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  const qc = useQueryClient();
  const activitiesFn = useServerFn(listActivities);
  const logsFn = useServerFn(listLogs);
  const timerFn = useServerFn(getRunningTimer);
  const stopFn = useServerFn(stopTimer);

  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: () => activitiesFn(),
  });

  const now = new Date();
  const from = startOfDay(now).toISOString();
  const to = endOfDay(now).toISOString();

  const { data: logs = [] } = useQuery({
    queryKey: ["logs", from, to],
    queryFn: () => logsFn({ data: { from, to } }),
  });

  const { data: timer } = useQuery({
    queryKey: ["timer"],
    queryFn: () => timerFn(),
    refetchInterval: 5000,
  });

  const [logSheet, setLogSheet] = useState<{ open: boolean; activity: Activity | null; editLog?: LogEntry | null }>({
    open: false,
    activity: null,
  });
  const [editor, setEditor] = useState<{ open: boolean; activity: Activity | null }>({ open: false, activity: null });
  const [detail, setDetail] = useState<{ open: boolean; log: LogEntry | null }>({ open: false, log: null });

  const visible = activities.filter((a) => a.visible);
  const activityById = new Map(activities.map((a) => [a.id, a]));
  const timerActivity = timer ? activityById.get(timer.activity_id) : null;

  const handleStop = async () => {
    if (!timer) return;
    try {
      await stopFn({ data: { id: timer.id } });
      qc.invalidateQueries({ queryKey: ["timer"] });
      qc.invalidateQueries({ queryKey: ["logs"] });
      toast.success("Timer stopped");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <AppShell title="Baby Log">
      {timer && timerActivity && (
        <Card className="mb-4 p-4 flex items-center gap-3" style={{ borderColor: timerActivity.color }}>
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: timerActivity.color }}
          >
            <ActivityIcon name={timerActivity.icon} className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">Running</div>
            <div className="font-medium">{timerActivity.name}</div>
            <LiveElapsed start={timer.started_at} />
          </div>
          <Button size="sm" variant="destructive" onClick={handleStop}>
            <Square className="w-4 h-4 mr-1 fill-current" /> Stop
          </Button>
        </Card>
      )}

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Log</h2>
        <div className="grid grid-cols-3 gap-3">
          {visible.map((a) => (
            <TileButton
              key={a.id}
              activity={a}
              onTap={() => setLogSheet({ open: true, activity: a })}
              onLongPress={() => setEditor({ open: true, activity: a })}
            />
          ))}
          {visible.length === 0 && (
            <p className="col-span-3 text-sm text-muted-foreground text-center py-8">
              No activities visible. <Link to="/activities" className="underline">Manage activities</Link>.
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-sm font-semibold text-muted-foreground">Today</h2>
          <Link to="/calendar" className="text-xs text-primary flex items-center">
            View all days <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <Card className="divide-y">
          {logs.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No logs yet today. Tap an activity above to start.
            </div>
          )}
          {logs.map((log) => {
            const act = activityById.get(log.activity_id);
            if (!act) return null;
            return (
              <button
                key={log.id}
                onClick={() => setDetail({ open: true, log })}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40 transition-colors"
              >
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: act.color }}
                >
                  <ActivityIcon name={act.icon} className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{act.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {summarize(log, act)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground shrink-0">
                  {format(new Date(log.started_at), "p")}
                </div>
              </button>
            );
          })}
        </Card>
      </section>

      <LogSheet
        activity={logSheet.activity}
        open={logSheet.open}
        onOpenChange={(o) => setLogSheet((s) => ({ ...s, open: o }))}
        editLog={logSheet.editLog}
      />
      <ActivityEditorSheet
        activity={editor.activity}
        open={editor.open}
        onOpenChange={(o) => setEditor((s) => ({ ...s, open: o }))}
      />
      <LogDetailSheet
        log={detail.log}
        activity={detail.log ? activityById.get(detail.log.activity_id) ?? null : null}
        open={detail.open}
        onOpenChange={(o) => setDetail((s) => ({ ...s, open: o }))}
        onEdit={() => {
          if (!detail.log) return;
          const act = activityById.get(detail.log.activity_id) ?? null;
          setDetail({ open: false, log: null });
          setLogSheet({ open: true, activity: act, editLog: detail.log });
        }}
      />
    </AppShell>
  );
}

function TileButton({
  activity,
  onTap,
  onLongPress,
}: {
  activity: Activity;
  onTap: () => void;
  onLongPress: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longFired = useRef(false);

  const start = () => {
    longFired.current = false;
    timerRef.current = setTimeout(() => {
      longFired.current = true;
      onLongPress();
    }, 500);
  };
  const cancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };
  const end = () => {
    cancel();
    if (!longFired.current) onTap();
  };

  return (
    <button
      onPointerDown={start}
      onPointerUp={end}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      className="aspect-square rounded-3xl flex flex-col items-center justify-center gap-3 text-white active:scale-95 transition-transform shadow-leaf p-4"
      style={{ backgroundColor: activity.color }}
    >
      <ActivityIcon name={activity.icon} className="w-12 h-12" strokeWidth={1.75} />
      <span className="text-sm font-semibold text-center px-1 leading-tight tracking-tight">
        {activity.name}
      </span>
    </button>
  );
}

function LiveElapsed({ start }: { start: string }) {
  const [secs, setSecs] = useState(() => differenceInSeconds(new Date(), new Date(start)));
  useEffect(() => {
    const id = setInterval(() => setSecs(differenceInSeconds(new Date(), new Date(start))), 1000);
    return () => clearInterval(id);
  }, [start]);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return (
    <div className="text-lg font-mono tabular-nums">
      {h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`}
    </div>
  );
}
const pad = (n: number) => n.toString().padStart(2, "0");

function summarize(log: LogEntry, act: Activity): string {
  const parts: string[] = [];
  for (const f of act.fields) {
    const v = log.values?.[f.key];
    if (v == null || v === "" || f.type === "textarea") continue;
    parts.push(`${v}${f.unit ? f.unit : ""}`);
    if (parts.length >= 2) break;
  }
  if (act.kind === "timed" && log.ended_at) {
    const mins = Math.round((new Date(log.ended_at).getTime() - new Date(log.started_at).getTime()) / 60000);
    parts.push(`${mins}m`);
  }
  return parts.join(" · ") || "Logged";
}
