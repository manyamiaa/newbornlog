import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listActivities, listLogs } from "@/lib/baby-log.functions";
import { AppShell } from "@/components/AppShell";
import { ActivityIcon } from "@/components/ActivityIcon";
import { LogDetailSheet } from "@/components/LogDetailSheet";
import { LogSheet } from "@/components/LogSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfDay, endOfDay, addDays, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Activity, LogEntry } from "@/lib/baby-log-types";

export const Route = createFileRoute("/_authenticated/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const activitiesFn = useServerFn(listActivities);
  const logsFn = useServerFn(listLogs);
  const [day, setDay] = useState(() => startOfDay(new Date()));
  const [filter, setFilter] = useState<Set<string>>(new Set()); // hidden ids
  const [detail, setDetail] = useState<{ open: boolean; log: LogEntry | null }>({ open: false, log: null });
  const [logSheet, setLogSheet] = useState<{ open: boolean; activity: Activity | null; editLog?: LogEntry | null }>({
    open: false, activity: null,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: () => activitiesFn(),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["logs", day.toISOString(), "day"],
    queryFn: () => logsFn({ data: { from: startOfDay(day).toISOString(), to: endOfDay(day).toISOString() } }),
  });

  const activityById = new Map(activities.map((a) => [a.id, a]));
  const visibleLogs = logs.filter((l) => {
    const a = activityById.get(l.activity_id);
    if (!a || !a.visible) return false;
    if (filter.has(a.id)) return false;
    return true;
  });

  return (
    <AppShell title="Calendar">
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon" onClick={() => setDay((d) => addDays(d, -1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-sm font-medium">
          {format(day, "EEE, MMM d")}
          {isSameDay(day, new Date()) && <span className="ml-2 text-xs text-primary">Today</span>}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setDay((d) => addDays(d, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {activities.filter((a) => a.visible).map((a) => {
          const hidden = filter.has(a.id);
          return (
            <button
              key={a.id}
              onClick={() =>
                setFilter((f) => {
                  const n = new Set(f);
                  if (n.has(a.id)) n.delete(a.id); else n.add(a.id);
                  return n;
                })
              }
            >
              <Badge
                variant={hidden ? "outline" : "default"}
                className="text-xs"
                style={hidden ? undefined : { backgroundColor: a.color, color: "white" }}
              >
                {a.name}
              </Badge>
            </button>
          );
        })}
      </div>

      <TimeGrid
        logs={visibleLogs}
        activityById={activityById}
        onSelect={(log) => setDetail({ open: true, log })}
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
      <LogSheet
        activity={logSheet.activity}
        open={logSheet.open}
        onOpenChange={(o) => setLogSheet((s) => ({ ...s, open: o }))}
        editLog={logSheet.editLog}
      />
    </AppShell>
  );
}

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
    return (d.getHours() * 60 + d.getMinutes()) / 60 * HOUR_H;
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="relative" style={{ height: total }}>
        {Array.from({ length: 24 }).map((_, h) => (
          <div key={h} className="absolute left-0 right-0 border-t border-border/60 flex" style={{ top: h * HOUR_H }}>
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
              <span className="opacity-80 text-[10px]">{format(new Date(log.started_at), "p")}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
