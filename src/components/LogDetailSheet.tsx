import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { Activity, LogEntry } from "@/lib/baby-log-types";
import { ActivityIcon } from "./ActivityIcon";
import { format, differenceInMinutes } from "date-fns";
import { deleteLog } from "@/lib/baby-log.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

export function LogDetailSheet({
  log,
  activity,
  open,
  onOpenChange,
  onEdit,
}: {
  log: LogEntry | null;
  activity: Activity | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit: () => void;
}) {
  const qc = useQueryClient();
  const del = useServerFn(deleteLog);
  if (!log || !activity) return null;

  const duration =
    log.ended_at ? differenceInMinutes(new Date(log.ended_at), new Date(log.started_at)) : null;

  const doDelete = async () => {
    try {
      await del({ data: { id: log.id } });
      qc.invalidateQueries({ queryKey: ["logs"] });
      toast.success("Deleted");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: activity.color }}
            >
              <ActivityIcon name={activity.icon} className="w-4 h-4" />
            </span>
            {activity.name}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-3 py-4">
          <div className="text-sm">
            <div className="text-muted-foreground text-xs">Started</div>
            <div>{format(new Date(log.started_at), "PPP p")}</div>
          </div>
          {log.ended_at && (
            <div className="text-sm">
              <div className="text-muted-foreground text-xs">Ended</div>
              <div>{format(new Date(log.ended_at), "PPP p")}</div>
              {duration != null && activity.kind === "timed" && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  Duration: {formatDuration(duration)}
                </div>
              )}
            </div>
          )}
          {activity.fields.map((f) => {
            const v = log.values?.[f.key];
            if (v == null || v === "") return null;
            return (
              <div key={f.key} className="text-sm">
                <div className="text-muted-foreground text-xs">{f.label}</div>
                <div>{String(v)}{f.unit ? ` ${f.unit}` : ""}</div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 pb-4">
          <Button variant="outline" className="flex-1" onClick={onEdit}>
            <Pencil className="w-4 h-4 mr-2" /> Edit
          </Button>
          <Button variant="destructive" className="flex-1" onClick={doDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
