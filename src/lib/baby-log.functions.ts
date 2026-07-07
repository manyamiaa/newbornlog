import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  DEFAULT_ACTIVITIES,
  type Activity,
  type ActivityField,
  type ActivityKind,
  type InsightChart,
  type LogEntry,
} from "./baby-log-types";

const fieldSchema = z.object({
  key: z.string().min(1).max(40),
  label: z.string().min(1).max(60),
  type: z.enum(["text", "number", "select", "textarea"]),
  options: z.array(z.string().max(60)).max(20).optional(),
  unit: z.string().max(20).optional(),
});

// Fetch (and seed on first use) activities
export const listActivities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);

    if (!data || data.length === 0) {
      const seed = DEFAULT_ACTIVITIES.map((a) => ({ ...a, user_id: userId }));
      const { data: inserted, error: seedErr } = await supabase
        .from("activities")
        .insert(seed as never)
        .select("*");
      if (seedErr) throw new Error(seedErr.message);
      return (inserted ?? []) as unknown as Activity[];
    }
    return data as unknown as Activity[];
  });

const createActivitySchema = z.object({
  name: z.string().min(1).max(60),
  icon: z.string().max(40),
  color: z.string().max(20),
  kind: z.enum(["instant", "timed"]),
  fields: z.array(fieldSchema).max(20),
});

export const createActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createActivitySchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: max } = await supabase
      .from("activities")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = (max?.sort_order ?? -1) + 1;
    const { data: row, error } = await supabase
      .from("activities")
      .insert({ ...data, user_id: userId, sort_order: nextOrder, visible: true } as never)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as Activity;
  });

const updateActivitySchema = z.object({
  id: z.string().uuid(),
  patch: z
    .object({
      name: z.string().min(1).max(60).optional(),
      icon: z.string().max(40).optional(),
      color: z.string().max(20).optional(),
      kind: z.enum(["instant", "timed"]).optional(),
      fields: z.array(fieldSchema).max(20).optional(),
      visible: z.boolean().optional(),
      sort_order: z.number().int().optional(),
    })
    .refine((p) => Object.keys(p).length > 0, "empty patch"),
});

export const updateActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateActivitySchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("activities")
      .update(data.patch)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as Activity;
  });

export const deleteActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("activities").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Logs ----

const valuesSchema = z.record(z.string(), z.union([z.string(), z.number(), z.null()]));

const createLogSchema = z.object({
  activity_id: z.string().uuid(),
  kind: z.enum(["instant", "timed"]),
  values: valuesSchema,
  started_at: z.string().optional(),
  end_now: z.boolean().optional(), // true = record instant now (ended_at = started_at)
  start_timer: z.boolean().optional(),
});

export const createLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createLogSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const startedAt = data.started_at ?? new Date().toISOString();
    const endedAt =
      data.kind === "instant" ? startedAt : data.start_timer ? null : startedAt;
    const { data: row, error } = await supabase
      .from("logs")
      .insert({
        user_id: userId,
        activity_id: data.activity_id,
        started_at: startedAt,
        ended_at: endedAt,
        values: data.values,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as LogEntry;
  });

const updateLogSchema = z.object({
  id: z.string().uuid(),
  patch: z.object({
    started_at: z.string().optional(),
    ended_at: z.string().nullable().optional(),
    values: valuesSchema.optional(),
  }),
});

export const updateLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateLogSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("logs")
      .update(data.patch)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as LogEntry;
  });

export const stopTimer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("logs")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as LogEntry;
  });

export const deleteLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("logs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const rangeSchema = z.object({
  from: z.string(),
  to: z.string(),
});

export const listLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => rangeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("logs")
      .select("*")
      .gte("started_at", data.from)
      .lt("started_at", data.to)
      .order("started_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as LogEntry[];
  });

export const getRunningTimer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("logs")
      .select("*")
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as LogEntry | null;
  });

// ---- Insight charts ----

export const listCharts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("insight_charts")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as InsightChart[];
  });

const createChartSchema = z.object({
  title: z.string().min(1).max(80),
  activity_id: z.string().uuid().nullable(),
  metric: z.string().min(1).max(40),
  field_key: z.string().max(40).nullable(),
  timeframe_days: z.number().int().min(1).max(365),
  chart_type: z.enum(["bar", "line", "area"]),
});

export const createChart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createChartSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: max } = await supabase
      .from("insight_charts")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = (max?.sort_order ?? -1) + 1;
    const { data: row, error } = await supabase
      .from("insight_charts")
      .insert({ ...data, user_id: userId, sort_order: nextOrder })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as InsightChart;
  });

export const deleteChart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("insight_charts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Used by both types export helpers only, prevents tree-shaking losing the shape
export type { Activity, ActivityField, ActivityKind, LogEntry, InsightChart };
