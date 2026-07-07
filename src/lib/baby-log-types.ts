export type FieldType = "text" | "number" | "select" | "textarea";

export interface ActivityField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  unit?: string;
}

export type ActivityKind = "instant" | "timed";

export interface Activity {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  kind: ActivityKind;
  fields: ActivityField[];
  visible: boolean;
  sort_order: number;
  created_at: string;
}

export interface LogEntry {
  id: string;
  user_id: string;
  activity_id: string;
  started_at: string;
  ended_at: string | null;
  values: Record<string, string | number | null>;
  created_at: string;
}

export interface InsightChart {
  id: string;
  user_id: string;
  title: string;
  activity_id: string | null;
  metric: string; // 'count' | 'total_duration_min' | 'avg_duration_min' | 'sum_field' | 'avg_field' | 'gap_hours'
  field_key: string | null;
  timeframe_days: number;
  chart_type: "bar" | "line" | "area";
  sort_order: number;
  created_at: string;
}

export const DEFAULT_ACTIVITIES: Array<
  Omit<Activity, "id" | "user_id" | "created_at">
> = [
  {
    name: "Feeding",
    icon: "Milk",
    color: "#7a9560",
    kind: "instant",
    visible: true,
    sort_order: 0,
    fields: [
      { key: "amount", label: "Amount", type: "number", unit: "oz" },
      {
        key: "method",
        label: "How fed",
        type: "select",
        options: [
          "Bottle - Formula",
          "Bottle - Breastmilk",
          "Nursing - Left",
          "Nursing - Right",
          "Nursing - Both",
        ],
      },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    name: "Sleep",
    icon: "Moon",
    color: "#4a6b3a",
    kind: "timed",
    visible: true,
    sort_order: 1,
    fields: [
      { key: "location", label: "Location", type: "select", options: ["Crib", "Bassinet", "Contact", "Stroller", "Car"] },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    name: "Diaper",
    icon: "Droplet",
    color: "#b8863f",
    kind: "instant",
    visible: true,
    sort_order: 2,
    fields: [
      { key: "type", label: "Type", type: "select", options: ["Wet", "Dirty", "Both"] },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    name: "Pumping",
    icon: "Beaker",
    color: "#9db08a",
    kind: "timed",
    visible: true,
    sort_order: 3,
    fields: [
      { key: "side", label: "Side", type: "select", options: ["Left", "Right", "Both"] },
      { key: "amount", label: "Amount", type: "number", unit: "oz" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    name: "Tummy time",
    icon: "Baby",
    color: "#c47b52",
    kind: "timed",
    visible: true,
    sort_order: 4,
    fields: [{ key: "notes", label: "Notes", type: "textarea" }],
  },
  {
    name: "Medicine",
    icon: "Pill",
    color: "#a55a3f",
    kind: "instant",
    visible: true,
    sort_order: 5,
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "dose", label: "Dose", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    name: "Growth",
    icon: "Ruler",
    color: "#6b4f3a",
    kind: "instant",
    visible: true,
    sort_order: 6,
    fields: [
      { key: "weight_lb", label: "Weight (lb)", type: "number" },
      { key: "height_in", label: "Height (in)", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
];

export const ICON_CHOICES = [
  "Baby", "Milk", "Moon", "Sun", "Heart", "Droplet", "Beaker", "Pill",
  "Ruler", "Utensils", "Bath", "Music", "Book", "Smile", "Activity",
  "Thermometer", "Stethoscope", "Bed", "Cookie", "Coffee", "Star",
] as const;

export const COLOR_CHOICES = [
  "#4a6b3a", "#7a9560", "#9db08a", "#b8863f", "#c47b52",
  "#a55a3f", "#6b4f3a", "#d9b382", "#8a6d4b", "#5f7a52",
  "#c9a66b", "#94886f",
] as const;
