import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Activity, ActivityField, LogEntry } from "@/lib/baby-log-types";
import { ActivityIcon } from "./ActivityIcon";
import { createLog, updateLog } from "@/lib/baby-log.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Values = Record<string, string | number | null>;

export function LogSheet({
  activity,
  open,
  onOpenChange,
  editLog,
}: {
  activity: Activity | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editLog?: LogEntry | null;
}) {
  const [values, setValues] = useState<Values>({});
  const qc = useQueryClient();
  const create = useServerFn(createLog);
  const update = useServerFn(updateLog);

  useEffect(() => {
    if (open) setValues(editLog?.values ?? {});
  }, [open, editLog]);

  if (!activity) return null;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["logs"] });
    qc.invalidateQueries({ queryKey: ["timer"] });
  };

  const saveInstant = async () => {
    try {
      if (editLog) {
        await update({ data: { id: editLog.id, patch: { values } } });
      } else {
        await create({
          data: {
            activity_id: activity.id,
            kind: activity.kind,
            values,
          },
        });
      }
      toast.success(`${activity.name} logged`);
      invalidate();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const startTimer = async () => {
    try {
      await create({
        data: {
          activity_id: activity.id,
          kind: "timed",
          values,
          start_timer: true,
        },
      });
      toast.success(`${activity.name} timer started`);
      invalidate();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: activity.color }}
            >
              <ActivityIcon name={activity.icon} className="w-4 h-4" />
            </span>
            {editLog ? "Edit" : "Log"} {activity.name}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4">
          {activity.fields.map((f) => (
            <FieldInput
              key={f.key}
              field={f}
              value={values[f.key] ?? ""}
              onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
            />
          ))}
          {activity.fields.length === 0 && (
            <p className="text-sm text-muted-foreground">No fields — just tap save.</p>
          )}
        </div>
        <div className="flex gap-2 pb-4">
          {activity.kind === "instant" || editLog ? (
            <Button className="flex-1" onClick={saveInstant}>
              Save
            </Button>
          ) : (
            <>
              <Button className="flex-1" onClick={startTimer}>
                Start timer
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: ActivityField;
  value: string | number | null;
  onChange: (v: string | number | null) => void;
}) {
  const strVal = value == null ? "" : String(value);
  return (
    <div className="space-y-1.5">
      <Label>
        {field.label}
        {field.unit ? <span className="text-muted-foreground ml-1">({field.unit})</span> : null}
      </Label>
      {field.type === "text" && (
        <Input value={strVal} onChange={(e) => onChange(e.target.value)} />
      )}
      {field.type === "number" && (
        <Input
          type="number"
          inputMode="decimal"
          value={strVal}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
      )}
      {field.type === "textarea" && (
        <Textarea value={strVal} onChange={(e) => onChange(e.target.value)} />
      )}
      {field.type === "select" && (
        <Select value={strVal} onValueChange={(v) => onChange(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
