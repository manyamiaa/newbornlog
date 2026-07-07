// In-memory demo store used by the unauthed /demo experience.
// Not persisted — each fresh page load starts from freshly-seeded sample data.

import {
  DEFAULT_ACTIVITIES,
  type Activity,
  type ActivityField,
  type ActivityKind,
  type InsightChart,
  type LogEntry,
} from "./baby-log-types";

const DEMO_USER = "demo-user";

// Fields that should NOT appear in the demo (per product requirement).
const DEMO_HIDDEN_FIELD_KEYS = new Set(["who_fed", "who_changed", "who_did"]);

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return `demo-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

interface DemoState {
  activities: Activity[];
  logs: LogEntry[];
  charts: InsightChart[];
  babyName: string;
}

function buildDefaultActivities(): Activity[] {
  const now = new Date().toISOString();
  return DEFAULT_ACTIVITIES.map((a) => ({
    ...a,
    id: uid(),
    user_id: DEMO_USER,
    created_at: now,
    fields: a.fields.filter((f) => !DEMO_HIDDEN_FIELD_KEYS.has(f.key)),
  }));
}

// Seeded PRNG for stable-per-session sample data.
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedLogs(activities: Activity[]): LogEntry[] {
  const rand = mulberry32(20260707);
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const jitter = (base: number, spread: number) =>
    Math.max(0, Math.min(59, Math.round(base + (rand() - 0.5) * spread)));

  const now = Date.now();
  const byName = (n: string) => activities.find((a) => a.name === n)!;
  const feeding = byName("Feeding");
  const sleep = byName("Sleep");
  const diaper = byName("Diaper");
  const pumping = byName("Pumping");
  const tummy = byName("Tummy time");
  const medicine = byName("Medicine");
  const growth = byName("Growth");

  const logs: LogEntry[] = [];
  const push = (l: Omit<LogEntry, "id" | "user_id" | "created_at">) => {
    if (new Date(l.started_at).getTime() > now) return;
    logs.push({
      id: uid(),
      user_id: DEMO_USER,
      created_at: l.started_at,
      ...l,
    });
  };

  for (let day = 13; day >= 0; day--) {
    const dayMid = new Date();
    dayMid.setDate(dayMid.getDate() - day);
    dayMid.setHours(0, 0, 0, 0);
    const dayStart = dayMid.getTime();

    // Feedings every ~2.5–3 hours.
    for (let i = 0; i < 8; i++) {
      const h = 1 + i * 3;
      const t = new Date(dayStart);
      t.setHours(h, jitter(15, 40));
      const method = pick([
        "Bottle - Formula",
        "Bottle - Breastmilk",
        "Nursing - Left",
        "Nursing - Right",
        "Nursing - Both",
      ]);
      const amount = method.startsWith("Bottle") ? 2 + Math.round(rand() * 4) : null;
      push({
        activity_id: feeding.id,
        started_at: t.toISOString(),
        ended_at: t.toISOString(),
        values: { method, ...(amount != null ? { amount } : {}) },
      });
    }

    // Diapers ~6/day.
    for (let i = 0; i < 6; i++) {
      const h = 1 + i * 4;
      const t = new Date(dayStart);
      t.setHours(h, jitter(10, 40));
      push({
        activity_id: diaper.id,
        started_at: t.toISOString(),
        ended_at: t.toISOString(),
        values: { type: pick(["Wet", "Wet", "Dirty", "Both"]) },
      });
    }

    // Sleep — 4 daytime naps + 1 long night stretch that started previous evening.
    const naps = [
      { hour: 3, dur: 90 },
      { hour: 8, dur: 60 },
      { hour: 12, dur: 75 },
      { hour: 16, dur: 45 },
      { hour: 20, dur: 60 },
    ];
    for (const nap of naps) {
      const start = new Date(dayStart);
      start.setHours(nap.hour, jitter(15, 30));
      const dur = nap.dur + Math.round((rand() - 0.5) * 30);
      const end = new Date(start.getTime() + dur * 60000);
      push({
        activity_id: sleep.id,
        started_at: start.toISOString(),
        ended_at: end.toISOString(),
        values: { location: pick(["Crib", "Bassinet", "Contact"]) },
      });
    }

    // Pumping ~2/day.
    for (let i = 0; i < 2; i++) {
      const start = new Date(dayStart);
      start.setHours(6 + i * 8, jitter(0, 30));
      const dur = 15 + Math.round(rand() * 10);
      const end = new Date(start.getTime() + dur * 60000);
      push({
        activity_id: pumping.id,
        started_at: start.toISOString(),
        ended_at: end.toISOString(),
        values: { side: pick(["Left", "Right", "Both"]), amount: 3 + Math.round(rand() * 3) },
      });
    }

    // Tummy time ~1/day.
    if (day < 13) {
      const start = new Date(dayStart);
      start.setHours(10, jitter(30, 30));
      const dur = 5 + Math.round(rand() * 10);
      const end = new Date(start.getTime() + dur * 60000);
      push({
        activity_id: tummy.id,
        started_at: start.toISOString(),
        ended_at: end.toISOString(),
        values: { where: pick(["Body", "Floor"]) },
      });
    }
  }

  // A couple of medicine + growth entries.
  const meds = new Date();
  meds.setDate(meds.getDate() - 4);
  meds.setHours(9, 0);
  push({
    activity_id: medicine.id,
    started_at: meds.toISOString(),
    ended_at: meds.toISOString(),
    values: { name: "Vitamin D", dose: "1 mL" },
  });

  const wk = new Date();
  wk.setDate(wk.getDate() - 7);
  wk.setHours(11, 0);
  push({
    activity_id: growth.id,
    started_at: wk.toISOString(),
    ended_at: wk.toISOString(),
    values: { weight_lb: 12.4, height_in: 23.1 },
  });

  logs.sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
  return logs;
}

let _state: DemoState | null = null;
function state(): DemoState {
  if (!_state) {
    const activities = buildDefaultActivities();
    _state = {
      activities,
      logs: seedLogs(activities),
      charts: [],
      babyName: "My baby",
    };
  }
  return _state;
}

// Public store API — signatures mirror the server functions so the data client
// can be swapped seamlessly.
export const demoStore = {
  reset() {
    _state = null;
  },

  // Activities
  listActivities: async (): Promise<Activity[]> => {
    return [...state().activities].sort((a, b) => a.sort_order - b.sort_order);
  },
  createActivity: async (input: {
    name: string;
    icon: string;
    color: string;
    kind: ActivityKind;
    fields: ActivityField[];
  }): Promise<Activity> => {
    const s = state();
    const nextOrder = s.activities.reduce((m, a) => Math.max(m, a.sort_order), -1) + 1;
    const row: Activity = {
      id: uid(),
      user_id: DEMO_USER,
      created_at: new Date().toISOString(),
      visible: true,
      sort_order: nextOrder,
      ...input,
    };
    s.activities = [...s.activities, row];
    return row;
  },
  updateActivity: async (input: {
    id: string;
    patch: Partial<Omit<Activity, "id" | "user_id" | "created_at">>;
  }): Promise<Activity> => {
    const s = state();
    let out: Activity | null = null;
    s.activities = s.activities.map((a) => {
      if (a.id !== input.id) return a;
      out = { ...a, ...input.patch };
      return out;
    });
    if (!out) throw new Error("Activity not found");
    return out;
  },
  deleteActivity: async (input: { id: string }): Promise<{ ok: true }> => {
    const s = state();
    s.activities = s.activities.filter((a) => a.id !== input.id);
    s.logs = s.logs.filter((l) => l.activity_id !== input.id);
    s.charts = s.charts.filter((c) => c.activity_id !== input.id);
    return { ok: true };
  },

  // Logs
  listLogs: async (input: { from: string; to: string }): Promise<LogEntry[]> => {
    const from = new Date(input.from).getTime();
    const to = new Date(input.to).getTime();
    return state()
      .logs.filter((l) => {
        const t = new Date(l.started_at).getTime();
        return t >= from && t < to;
      })
      .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
  },
  createLog: async (input: {
    activity_id: string;
    kind: ActivityKind;
    values: Record<string, string | number | null>;
    started_at?: string;
    end_now?: boolean;
    start_timer?: boolean;
  }): Promise<LogEntry> => {
    const s = state();
    const startedAt = input.started_at ?? new Date().toISOString();
    const endedAt =
      input.kind === "instant" ? startedAt : input.start_timer ? null : startedAt;
    const row: LogEntry = {
      id: uid(),
      user_id: DEMO_USER,
      activity_id: input.activity_id,
      started_at: startedAt,
      ended_at: endedAt,
      values: input.values,
      created_at: new Date().toISOString(),
    };
    s.logs = [...s.logs, row];
    return row;
  },
  updateLog: async (input: {
    id: string;
    patch: {
      started_at?: string;
      ended_at?: string | null;
      values?: Record<string, string | number | null>;
    };
  }): Promise<LogEntry> => {
    const s = state();
    let out: LogEntry | null = null;
    s.logs = s.logs.map((l) => {
      if (l.id !== input.id) return l;
      out = { ...l, ...input.patch };
      return out;
    });
    if (!out) throw new Error("Log not found");
    return out;
  },
  deleteLog: async (input: { id: string }): Promise<{ ok: true }> => {
    const s = state();
    s.logs = s.logs.filter((l) => l.id !== input.id);
    return { ok: true };
  },
  stopTimer: async (input: { id: string }): Promise<LogEntry> => {
    return demoStore.updateLog({
      id: input.id,
      patch: { ended_at: new Date().toISOString() },
    });
  },
  getRunningTimer: async (): Promise<LogEntry | null> => {
    const s = state();
    const running = s.logs.filter((l) => l.ended_at == null);
    if (running.length === 0) return null;
    return running.sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
    )[0];
  },

  // Charts
  listCharts: async (): Promise<InsightChart[]> => {
    return [...state().charts].sort((a, b) => a.sort_order - b.sort_order);
  },
  createChart: async (input: {
    title: string;
    activity_id: string | null;
    metric: string;
    field_key: string | null;
    timeframe_days: number;
    chart_type: "bar" | "line" | "area";
  }): Promise<InsightChart> => {
    const s = state();
    const nextOrder = s.charts.reduce((m, c) => Math.max(m, c.sort_order), -1) + 1;
    const row: InsightChart = {
      id: uid(),
      user_id: DEMO_USER,
      created_at: new Date().toISOString(),
      sort_order: nextOrder,
      ...input,
    };
    s.charts = [...s.charts, row];
    return row;
  },
  deleteChart: async (input: { id: string }): Promise<{ ok: true }> => {
    const s = state();
    s.charts = s.charts.filter((c) => c.id !== input.id);
    return { ok: true };
  },

  // Profile
  getProfile: async (): Promise<{ id: string; baby_name: string | null }> => {
    return { id: DEMO_USER, baby_name: state().babyName };
  },
  updateBabyName: async (input: {
    baby_name: string;
  }): Promise<{ id: string; baby_name: string | null }> => {
    const s = state();
    s.babyName = input.baby_name;
    return { id: DEMO_USER, baby_name: s.babyName };
  },
};
