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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [filterId, setFilterId] = useState<string>("all");

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
        <div className="mb-2">
          <Select value={filterId} onValueChange={setFilterId}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="All activities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All activities</SelectItem>
              {visible.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <TimeGrid
          logs={logs.filter((l) => {
            const a = activityById.get(l.activity_id);
            if (!a || !a.visible) return false;
            if (filterId !== "all" && a.id !== filterId) return false;
            return true;
          })}
          activityById={activityById}
          onSelect={(log) => setDetail({ open: true, log })}
        />
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

function TimeGrid({
  logs,
  activityById,
  onSelect,
}: {
  logs: LogEntry[];
  activityById: Map<string, Activity>;
  onSelect: (log: LogEntry) => void;
}) {
  const HOUR_H = 48;
  const total = 24 * HOUR_H;
  const pos = (iso: string) => {
    const d = new Date(iso);
    return ((d.getHours() * 60 + d.getMinutes()) / 60) * HOUR_H;
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="relative" style={{ height: total }}>
        {Array.from({ length: 24 }).map((_, h) => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-border/60 flex"
            style={{ top: h * HOUR_H }}
          >
            <span className="text-[10px] text-muted-foreground w-10 pl-1 -mt-1.5">
              {h === 0 ? "" : `${h}:00`}
            </span>
          </div>
        ))}

        {logs.map((log) => {
          const act = activityById.get(log.activity_id);
          if (!act) return null;
          const top = pos(log.started_at);
          const isTimed = act.kind === "timed" && log.ended_at;
          if (isTimed && log.ended_at) {
            const bottom = pos(log.ended_at);
            const height = Math.max(bottom - top, 16);
            return (
              <button
                key={log.id}
                onClick={() => onSelect(log)}
                className="absolute left-12 right-2 rounded-md text-white text-xs px-2 py-1 text-left overflow-hidden shadow-sm"
                style={{ top, height, backgroundColor: act.color }}
              >
                <div className="flex items-center gap-1 font-medium">
                  <ActivityIcon name={act.icon} className="w-3 h-3" />
                  {act.name}
                </div>
                <div className="text-[10px] opacity-90">
                  {format(new Date(log.started_at), "p")} – {format(new Date(log.ended_at), "p")}
                </div>
              </button>
            );
          }
          return (
            <button
              key={log.id}
              onClick={() => onSelect(log)}
              className="absolute left-12 flex items-center gap-1.5 text-xs text-white rounded-full px-2 py-0.5 shadow-sm"
              style={{ top: top - 8, backgroundColor: act.color }}
            >
              <ActivityIcon name={act.icon} className="w-3 h-3" />
              <span>{act.name}</span>
              <span className="opacity-80 text-[10px]">
                {format(new Date(log.started_at), "p")}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

