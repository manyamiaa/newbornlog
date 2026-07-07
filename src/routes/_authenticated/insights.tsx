import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listActivities, listLogs, listCharts, createChart, deleteChart } from "@/lib/baby-log.functions";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, Trash2 } from "lucide-react";
import { format, subDays, startOfDay, differenceInMinutes, differenceInHours } from "date-fns";
import type { Activity, InsightChart, LogEntry } from "@/lib/baby-log-types";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/insights")({
  component: InsightsPage,
});

const METRICS = [
  { value: "count", label: "Count per day", needsField: false, needsActivity: true },
  { value: "total_duration_min", label: "Total duration (min) per day", needsField: false, needsActivity: true, timedOnly: true },
  { value: "avg_duration_min", label: "Avg duration (min) per event", needsField: false, needsActivity: true, timedOnly: true },
  { value: "sum_field", label: "Sum of field per day", needsField: true, needsActivity: true },
  { value: "avg_field", label: "Avg of field per day", needsField: true, needsActivity: true },
  { value: "gap_hours", label: "Avg gap between events (hours)", needsField: false, needsActivity: true },
];

interface Suggestion {
  title: string;
  activityName: string;
  metric: string;
  timeframe_days: number;
  chart_type: "bar" | "line" | "area";
  field_key?: string | null;
}
const SUGGESTIONS: Suggestion[] = [
  { title: "Feedings per day (14d)", activityName: "Feeding", metric: "count", timeframe_days: 14, chart_type: "bar" },
  { title: "Total ounces per day (14d)", activityName: "Feeding", metric: "sum_field", field_key: "amount", timeframe_days: 14, chart_type: "line" },
  { title: "Sleep minutes per day (14d)", activityName: "Sleep", metric: "total_duration_min", timeframe_days: 14, chart_type: "area" },
  { title: "Diapers per day (7d)", activityName: "Diaper", metric: "count", timeframe_days: 7, chart_type: "bar" },
  { title: "Avg hours between feeds (7d)", activityName: "Feeding", metric: "gap_hours", timeframe_days: 7, chart_type: "line" },
  { title: "Avg feed size (14d)", activityName: "Feeding", metric: "avg_field", field_key: "amount", timeframe_days: 14, chart_type: "bar" },
  { title: "Avg sleep length (14d)", activityName: "Sleep", metric: "avg_duration_min", timeframe_days: 14, chart_type: "line" },
  { title: "Sleep sessions per day (7d)", activityName: "Sleep", metric: "count", timeframe_days: 7, chart_type: "bar" },
  { title: "Avg hours between diapers (7d)", activityName: "Diaper", metric: "gap_hours", timeframe_days: 7, chart_type: "line" },
  { title: "Diapers per day (14d)", activityName: "Diaper", metric: "count", timeframe_days: 14, chart_type: "area" },
  { title: "Pumping minutes per day (14d)", activityName: "Pumping", metric: "total_duration_min", timeframe_days: 14, chart_type: "bar" },
  { title: "Total pumped ounces per day (14d)", activityName: "Pumping", metric: "sum_field", field_key: "amount", timeframe_days: 14, chart_type: "line" },
  { title: "Tummy time minutes per day (7d)", activityName: "Tummy time", metric: "total_duration_min", timeframe_days: 7, chart_type: "area" },
  { title: "Feedings per day (7d)", activityName: "Feeding", metric: "count", timeframe_days: 7, chart_type: "line" },
];

const SUGGESTIONS_VISIBLE = 5;

function SuggestedRow({
  suggestions,
  existingTitles,
  onAdd,
}: {
  suggestions: Suggestion[];
  existingTitles: Set<string>;
  onAdd: (s: Suggestion) => void;
}) {
  const remaining = suggestions.filter((s) => !existingTitles.has(s.title)).slice(0, SUGGESTIONS_VISIBLE);
  if (remaining.length === 0) return null;
  return (
    <section className="mb-6">
      <h2 className="text-xs font-semibold text-muted-foreground mb-2 px-1">Suggested</h2>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {remaining.map((s) => (
          <button
            key={s.title}
            onClick={() => onAdd(s)}
            className="shrink-0 rounded-xl border bg-card px-3 py-2 text-xs text-left hover:bg-muted"
          >
            <div className="font-medium mb-0.5">+ {s.title}</div>
          </button>
        ))}
      </div>
    </section>
  );
}


function InsightsPage() {
  const qc = useQueryClient();
  const activitiesFn = useServerFn(listActivities);
  const chartsFn = useServerFn(listCharts);
  const create = useServerFn(createChart);
  const del = useServerFn(deleteChart);

  const { data: activities = [] } = useQuery({ queryKey: ["activities"], queryFn: () => activitiesFn() });
  const { data: charts = [] } = useQuery({ queryKey: ["charts"], queryFn: () => chartsFn() });

  const [builderOpen, setBuilderOpen] = useState(false);

  const addSuggestion = async (s: Suggestion) => {
    const act = activities.find((a) => a.name === s.activityName);
    if (!act) return toast.error(`No activity named "${s.activityName}"`);
    try {
      await create({
        data: {
          title: s.title,
          activity_id: act.id,
          metric: s.metric,
          field_key: s.field_key ?? null,
          timeframe_days: s.timeframe_days,
          chart_type: s.chart_type,
        },
      });
      qc.invalidateQueries({ queryKey: ["charts"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const doDelete = async (id: string) => {
    await del({ data: { id } });
    qc.invalidateQueries({ queryKey: ["charts"] });
  };

  return (
    <AppShell
      title="Insights"
      right={
        <Sheet open={builderOpen} onOpenChange={setBuilderOpen}>
          <SheetTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" /> Chart
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>New chart</SheetTitle>
            </SheetHeader>
            <ChartBuilder
              activities={activities}
              onSave={async (draft) => {
                await create({ data: draft });
                qc.invalidateQueries({ queryKey: ["charts"] });
                setBuilderOpen(false);
              }}
            />
          </SheetContent>
        </Sheet>
      }
    >
      <SuggestedRow
        suggestions={SUGGESTIONS}
        existingTitles={new Set(charts.map((c) => c.title))}
        onAdd={addSuggestion}
      />


      <section className="space-y-4">
        {charts.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No charts yet. Add a suggested chart or build your own.
          </Card>
        )}
        {charts.map((c) => (
          <ChartCard key={c.id} chart={c} activities={activities} onDelete={() => doDelete(c.id)} />
        ))}
      </section>
    </AppShell>
  );
}

function ChartBuilder({
  activities,
  onSave,
}: {
  activities: Activity[];
  onSave: (draft: {
    title: string;
    activity_id: string | null;
    metric: string;
    field_key: string | null;
    timeframe_days: number;
    chart_type: "bar" | "line" | "area";
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [activityId, setActivityId] = useState<string>("");
  const [metric, setMetric] = useState<string>("count");
  const [fieldKey, setFieldKey] = useState<string>("");
  const [timeframe, setTimeframe] = useState(14);
  const [chartType, setChartType] = useState<"bar" | "line" | "area">("bar");

  const act = activities.find((a) => a.id === activityId);
  const metricInfo = METRICS.find((m) => m.value === metric);
  const numericFields = act?.fields.filter((f) => f.type === "number") ?? [];

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My chart" />
      </div>
      <div className="space-y-1.5">
        <Label>Activity</Label>
        <Select value={activityId} onValueChange={setActivityId}>
          <SelectTrigger><SelectValue placeholder="Select activity" /></SelectTrigger>
          <SelectContent>
            {activities.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Metric</Label>
        <Select value={metric} onValueChange={setMetric}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {METRICS.filter((m) => !m.timedOnly || act?.kind === "timed").map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {metricInfo?.needsField && (
        <div className="space-y-1.5">
          <Label>Field</Label>
          <Select value={fieldKey} onValueChange={setFieldKey}>
            <SelectTrigger><SelectValue placeholder="Number field" /></SelectTrigger>
            <SelectContent>
              {numericFields.map((f) => (
                <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Days</Label>
          <Input
            type="number"
            min={1}
            max={365}
            value={timeframe}
            onChange={(e) => setTimeframe(Math.max(1, Number(e.target.value) || 1))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Chart</Label>
          <Select value={chartType} onValueChange={(v) => setChartType(v as "bar" | "line" | "area")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar</SelectItem>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="area">Area</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        className="w-full"
        onClick={() => {
          if (!title || !activityId) return toast.error("Title and activity required");
          if (metricInfo?.needsField && !fieldKey) return toast.error("Field required");
          onSave({
            title,
            activity_id: activityId,
            metric,
            field_key: metricInfo?.needsField ? fieldKey : null,
            timeframe_days: timeframe,
            chart_type: chartType,
          });
        }}
      >
        Add chart
      </Button>
    </div>
  );
}

function ChartCard({
  chart,
  activities,
  onDelete,
}: {
  chart: InsightChart;
  activities: Activity[];
  onDelete: () => void;
}) {
  const logsFn = useServerFn(listLogs);
  const { from, to } = useMemo(() => {
    const end = new Date();
    return {
      from: startOfDay(subDays(end, chart.timeframe_days - 1)).toISOString(),
      to: end.toISOString(),
    };
  }, [chart.timeframe_days, chart.id]);
  const { data: logs = [] } = useQuery({
    queryKey: ["logs", "insight", chart.id, from, to],
    queryFn: () => logsFn({ data: { from, to } }),
  });

  const act = activities.find((a) => a.id === chart.activity_id);
  const filtered = logs.filter((l) => l.activity_id === chart.activity_id);
  const data = computeSeries(filtered, chart);

  const color = act?.color ?? "#60a5fa";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm">{chart.title}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full">
          <ResponsiveContainer>
            {chart.chart_type === "bar" ? (
              <BarChart data={data}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" fontSize={10} />
                <YAxis fontSize={10} width={30} />
                <Tooltip />
                <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : chart.chart_type === "line" ? (
              <LineChart data={data}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" fontSize={10} />
                <YAxis fontSize={10} width={30} />
                <Tooltip />
                <Line dataKey="value" stroke={color} strokeWidth={2} dot={false} />
              </LineChart>
            ) : (
              <AreaChart data={data}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" fontSize={10} />
                <YAxis fontSize={10} width={30} />
                <Tooltip />
                <Area dataKey="value" stroke={color} fill={color} fillOpacity={0.3} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function computeSeries(logs: LogEntry[], chart: InsightChart) {
  const days = chart.timeframe_days;
  const buckets: { key: string; label: string; date: Date; logs: LogEntry[] }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = startOfDay(subDays(new Date(), i));
    buckets.push({ key: d.toISOString(), label: format(d, "M/d"), date: d, logs: [] });
  }
  for (const l of logs) {
    const d = startOfDay(new Date(l.started_at));
    const b = buckets.find((x) => x.date.getTime() === d.getTime());
    if (b) b.logs.push(l);
  }

  return buckets.map((b) => {
    let value = 0;
    if (chart.metric === "count") {
      value = b.logs.length;
    } else if (chart.metric === "total_duration_min") {
      value = b.logs.reduce(
        (sum, l) => sum + (l.ended_at ? differenceInMinutes(new Date(l.ended_at), new Date(l.started_at)) : 0),
        0,
      );
    } else if (chart.metric === "avg_duration_min") {
      const durs = b.logs
        .filter((l) => l.ended_at)
        .map((l) => differenceInMinutes(new Date(l.ended_at!), new Date(l.started_at)));
      value = durs.length ? Math.round(durs.reduce((a, x) => a + x, 0) / durs.length) : 0;
    } else if (chart.metric === "sum_field" && chart.field_key) {
      value = b.logs.reduce((sum, l) => sum + Number(l.values?.[chart.field_key!] ?? 0), 0);
    } else if (chart.metric === "avg_field" && chart.field_key) {
      const vals = b.logs.map((l) => Number(l.values?.[chart.field_key!] ?? 0)).filter((n) => !isNaN(n) && n > 0);
      value = vals.length ? Math.round((vals.reduce((a, x) => a + x, 0) / vals.length) * 100) / 100 : 0;
    } else if (chart.metric === "gap_hours") {
      const sorted = [...b.logs].sort((a, z) => new Date(a.started_at).getTime() - new Date(z.started_at).getTime());
      const gaps: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        gaps.push(differenceInHours(new Date(sorted[i].started_at), new Date(sorted[i - 1].started_at)));
      }
      value = gaps.length ? Math.round((gaps.reduce((a, x) => a + x, 0) / gaps.length) * 10) / 10 : 0;
    }
    return { label: b.label, value };
  });
}
