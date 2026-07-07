import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { Activity, ActivityField, ActivityKind } from "@/lib/baby-log-types";
import { ICON_CHOICES, COLOR_CHOICES } from "@/lib/baby-log-types";
import { ActivityIcon } from "./ActivityIcon";
import { createActivity, updateActivity, deleteActivity } from "@/lib/baby-log.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const emptyDraft = (): Draft => ({
  name: "",
  icon: "Baby",
  color: COLOR_CHOICES[0],
  kind: "instant",
  fields: [],
});

interface Draft {
  name: string;
  icon: string;
  color: string;
  kind: ActivityKind;
  fields: ActivityField[];
}

export function ActivityEditorSheet({
  activity,
  open,
  onOpenChange,
}: {
  activity: Activity | null; // null = create new
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const qc = useQueryClient();
  const create = useServerFn(createActivity);
  const update = useServerFn(updateActivity);
  const del = useServerFn(deleteActivity);

  useEffect(() => {
    if (!open) return;
    setDraft(
      activity
        ? {
            name: activity.name,
            icon: activity.icon,
            color: activity.color,
            kind: activity.kind,
            fields: activity.fields,
          }
        : emptyDraft(),
    );
  }, [open, activity]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["activities"] });

  const save = async () => {
    if (!draft.name.trim()) return toast.error("Name required");
    try {
      if (activity) {
        await update({ data: { id: activity.id, patch: draft } });
      } else {
        await create({ data: draft });
      }
      toast.success("Saved");
      invalidate();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const doDelete = async () => {
    if (!activity) return;
    try {
      await del({ data: { id: activity.id } });
      toast.success("Deleted");
      invalidate();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const addField = () =>
    setDraft((d) => ({
      ...d,
      fields: [...d.fields, { key: `field_${d.fields.length + 1}`, label: "New field", type: "text" }],
    }));

  const updateField = (i: number, patch: Partial<ActivityField>) =>
    setDraft((d) => ({ ...d, fields: d.fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) }));

  const removeField = (i: number) =>
    setDraft((d) => ({ ...d, fields: d.fields.filter((_, idx) => idx !== i) }));

  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const reorderFields = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setDraft((d) => {
      const next = d.fields.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...d, fields: next };
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{activity ? "Edit activity" : "New activity"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 py-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-7 gap-2">
              {ICON_CHOICES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDraft({ ...draft, icon: n })}
                  className={`aspect-square rounded-lg border flex items-center justify-center ${
                    draft.icon === n ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  <ActivityIcon name={n} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_CHOICES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDraft({ ...draft, color: c })}
                  className={`w-8 h-8 rounded-full border-2 ${draft.color === c ? "border-foreground" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Timed activity</Label>
              <p className="text-xs text-muted-foreground">Uses a start/stop timer instead of instant log.</p>
            </div>
            <Switch
              checked={draft.kind === "timed"}
              onCheckedChange={(v) => setDraft({ ...draft, kind: v ? "timed" : "instant" })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Fields</Label>
              <Button size="sm" variant="ghost" onClick={addField}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            {draft.fields.length === 0 && (
              <p className="text-xs text-muted-foreground">No fields yet.</p>
            )}
            {draft.fields.map((f, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Label"
                    value={f.label}
                    onChange={(e) => updateField(i, { label: e.target.value, key: slugify(e.target.value) || f.key })}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeField(i)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Select value={f.type} onValueChange={(v) => updateField(i, { type: v as ActivityField["type"] })}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="textarea">Long text</SelectItem>
                      <SelectItem value="select">Choice</SelectItem>
                    </SelectContent>
                  </Select>
                  {f.type === "number" && (
                    <Input
                      placeholder="Unit"
                      value={f.unit ?? ""}
                      onChange={(e) => updateField(i, { unit: e.target.value })}
                      className="w-24"
                    />
                  )}
                </div>
                {f.type === "select" && (
                  <Input
                    placeholder="Options (comma-separated)"
                    value={(f.options ?? []).join(", ")}
                    onChange={(e) =>
                      updateField(i, {
                        options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={save}>
              Save
            </Button>
            {activity && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete activity?</AlertDialogTitle>
                    <AlertDialogDescription>
                      All logs for this activity will also be deleted. This can't be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={doDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}
