import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { ActivityIcon } from "@/components/ActivityIcon";
import { ActivityEditorSheet } from "@/components/ActivityEditorSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import type { Activity } from "@/lib/baby-log-types";
import { useDataClient } from "@/lib/data-client";

export function ActivitiesPage() {
  const qc = useQueryClient();
  const client = useDataClient();
  const { data: activities = [] } = useQuery({
    queryKey: [client.mode, "activities"],
    queryFn: () => client.listActivities(),
  });

  const [editor, setEditor] = useState<{ open: boolean; activity: Activity | null }>({
    open: false, activity: null,
  });

  const toggleVisible = async (a: Activity) => {
    await client.updateActivity({ data: { id: a.id, patch: { visible: !a.visible } } });
    qc.invalidateQueries({ queryKey: [client.mode, "activities"] });
  };

  return (
    <AppShell
      title="Activities"
      right={
        <Button size="sm" onClick={() => setEditor({ open: true, activity: null })}>
          <Plus className="w-4 h-4 mr-1" /> New
        </Button>
      }
    >
      <Card className="divide-y">
        {activities.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setEditor({ open: true, activity: a })}
            className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40 transition-colors"
          >
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: a.color }}
            >
              <ActivityIcon name={a.icon} className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{a.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {a.fields.length === 0 ? "No fields" : a.fields.map((f) => f.label).join(", ")}
              </div>
            </div>
            <div
              className="flex items-center gap-2 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Badge
                variant="secondary"
                className="text-xs px-2.5 py-1 rounded-full font-medium"
              >
                {a.kind === "timed" ? "Timed" : "Instant"}
              </Badge>
              <Switch
                checked={a.visible}
                onCheckedChange={() => toggleVisible(a)}
                aria-label="Visible"
              />
            </div>
          </button>
        ))}
        {activities.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No activities yet.</div>
        )}
      </Card>

      <ActivityEditorSheet
        activity={editor.activity}
        open={editor.open}
        onOpenChange={(o) => setEditor((s) => ({ ...s, open: o }))}
      />
    </AppShell>
  );
}
