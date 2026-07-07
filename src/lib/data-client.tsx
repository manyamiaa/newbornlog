import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  listLogs,
  createLog,
  updateLog,
  deleteLog,
  stopTimer,
  getRunningTimer,
  listCharts,
  createChart,
  deleteChart,
} from "@/lib/baby-log.functions";
import { getProfile, updateBabyName } from "@/lib/profile.functions";
import { demoStore } from "@/lib/demo-store";
import type {
  Activity,
  ActivityField,
  ActivityKind,
  InsightChart,
  LogEntry,
} from "@/lib/baby-log-types";

export type AppMode = "auth" | "demo";

export type Profile = { id: string; baby_name: string | null };

export interface DataClient {
  mode: AppMode;

  // Activities
  listActivities: () => Promise<Activity[]>;
  createActivity: (args: {
    data: {
      name: string;
      icon: string;
      color: string;
      kind: ActivityKind;
      fields: ActivityField[];
    };
  }) => Promise<Activity>;
  updateActivity: (args: {
    data: {
      id: string;
      patch: Partial<Omit<Activity, "id" | "user_id" | "created_at">>;
    };
  }) => Promise<Activity>;
  deleteActivity: (args: { data: { id: string } }) => Promise<{ ok: true }>;

  // Logs
  listLogs: (args: { data: { from: string; to: string } }) => Promise<LogEntry[]>;
  createLog: (args: {
    data: {
      activity_id: string;
      kind: ActivityKind;
      values: Record<string, string | number | null>;
      started_at?: string;
      end_now?: boolean;
      start_timer?: boolean;
    };
  }) => Promise<LogEntry>;
  updateLog: (args: {
    data: {
      id: string;
      patch: {
        started_at?: string;
        ended_at?: string | null;
        values?: Record<string, string | number | null>;
      };
    };
  }) => Promise<LogEntry>;
  deleteLog: (args: { data: { id: string } }) => Promise<{ ok: true }>;
  stopTimer: (args: { data: { id: string } }) => Promise<LogEntry>;
  getRunningTimer: () => Promise<LogEntry | null>;

  // Charts
  listCharts: () => Promise<InsightChart[]>;
  createChart: (args: {
    data: {
      title: string;
      activity_id: string | null;
      metric: string;
      field_key: string | null;
      timeframe_days: number;
      chart_type: "bar" | "line" | "area";
    };
  }) => Promise<InsightChart>;
  deleteChart: (args: { data: { id: string } }) => Promise<{ ok: true }>;

  // Profile
  getProfile: () => Promise<Profile>;
  updateBabyName: (args: { data: { baby_name: string } }) => Promise<Profile>;
}

const DataClientContext = createContext<DataClient | null>(null);

export function useDataClient(): DataClient {
  const ctx = useContext(DataClientContext);
  if (!ctx) throw new Error("useDataClient must be used within a DataClientProvider");
  return ctx;
}

/**
 * Mode-aware helper for typed Link paths. Home / Calendar / Insights / Activities
 * live at top-level in auth mode, and under /demo/* in demo mode.
 */
export function useAppPaths() {
  const { mode } = useDataClient();
  return useMemo(
    () =>
      mode === "demo"
        ? {
            home: "/demo" as const,
            calendar: "/demo/calendar" as const,
            insights: "/demo/insights" as const,
            activities: "/demo/activities" as const,
          }
        : {
            home: "/" as const,
            calendar: "/calendar" as const,
            insights: "/insights" as const,
            activities: "/activities" as const,
          },
    [mode],
  );
}

// ---- Auth (server-backed) provider ----

export function AuthDataClientProvider({ children }: { children: ReactNode }) {
  const _listActivities = useServerFn(listActivities);
  const _createActivity = useServerFn(createActivity);
  const _updateActivity = useServerFn(updateActivity);
  const _deleteActivity = useServerFn(deleteActivity);
  const _listLogs = useServerFn(listLogs);
  const _createLog = useServerFn(createLog);
  const _updateLog = useServerFn(updateLog);
  const _deleteLog = useServerFn(deleteLog);
  const _stopTimer = useServerFn(stopTimer);
  const _getRunningTimer = useServerFn(getRunningTimer);
  const _listCharts = useServerFn(listCharts);
  const _createChart = useServerFn(createChart);
  const _deleteChart = useServerFn(deleteChart);
  const _getProfile = useServerFn(getProfile);
  const _updateBabyName = useServerFn(updateBabyName);

  const value = useMemo<DataClient>(
    () => ({
      mode: "auth",
      listActivities: () => _listActivities(),
      createActivity: (a) => _createActivity(a),
      updateActivity: (a) => _updateActivity(a),
      deleteActivity: (a) => _deleteActivity(a),
      listLogs: (a) => _listLogs(a),
      createLog: (a) => _createLog(a),
      updateLog: (a) => _updateLog(a),
      deleteLog: (a) => _deleteLog(a),
      stopTimer: (a) => _stopTimer(a),
      getRunningTimer: () => _getRunningTimer(),
      listCharts: () => _listCharts(),
      createChart: (a) => _createChart(a),
      deleteChart: (a) => _deleteChart(a),
      getProfile: () => _getProfile(),
      updateBabyName: (a) => _updateBabyName(a),
    }),
    [
      _listActivities,
      _createActivity,
      _updateActivity,
      _deleteActivity,
      _listLogs,
      _createLog,
      _updateLog,
      _deleteLog,
      _stopTimer,
      _getRunningTimer,
      _listCharts,
      _createChart,
      _deleteChart,
      _getProfile,
      _updateBabyName,
    ],
  );

  return <DataClientContext.Provider value={value}>{children}</DataClientContext.Provider>;
}

// ---- Demo (in-memory) provider ----

const DEMO_CLIENT: DataClient = {
  mode: "demo",
  listActivities: () => demoStore.listActivities(),
  createActivity: ({ data }) => demoStore.createActivity(data),
  updateActivity: ({ data }) => demoStore.updateActivity(data),
  deleteActivity: ({ data }) => demoStore.deleteActivity(data),
  listLogs: ({ data }) => demoStore.listLogs(data),
  createLog: ({ data }) => demoStore.createLog(data),
  updateLog: ({ data }) => demoStore.updateLog(data),
  deleteLog: ({ data }) => demoStore.deleteLog(data),
  stopTimer: ({ data }) => demoStore.stopTimer(data),
  getRunningTimer: () => demoStore.getRunningTimer(),
  listCharts: () => demoStore.listCharts(),
  createChart: ({ data }) => demoStore.createChart(data),
  deleteChart: ({ data }) => demoStore.deleteChart(data),
  getProfile: () => demoStore.getProfile(),
  updateBabyName: ({ data }) => demoStore.updateBabyName(data),
};

export function DemoDataClientProvider({ children }: { children: ReactNode }) {
  return <DataClientContext.Provider value={DEMO_CLIENT}>{children}</DataClientContext.Provider>;
}
