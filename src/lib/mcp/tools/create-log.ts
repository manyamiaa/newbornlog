import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_log",
  title: "Log an activity",
  description:
    "Record a baby log entry for the signed-in user. Use list_activities first to get the activity id and its fields. For a timed activity, omit ended_at and set start_timer to true to start a running timer, or provide ended_at to record a completed session.",
  inputSchema: {
    activity_id: z.string().describe("Activity id from list_activities."),
    started_at: z
      .string()
      .optional()
      .describe("ISO 8601 start time. Defaults to now."),
    ended_at: z
      .string()
      .nullable()
      .optional()
      .describe("ISO 8601 end time for a completed timed entry."),
    start_timer: z
      .boolean()
      .optional()
      .describe("Timed activities only: leave the entry running instead of completing it."),
    values: z
      .record(z.string(), z.union([z.string(), z.number(), z.null()]))
      .optional()
      .describe("Field values keyed by the activity's field keys, e.g. { amount: 4, method: 'Bottle - Formula' }."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ activity_id, started_at, ended_at, start_timer, values }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const startedAt = started_at ?? new Date().toISOString();
    const endedAt = ended_at !== undefined ? ended_at : start_timer ? null : startedAt;
    const { data, error } = await supabase
      .from("logs")
      .insert({
        user_id: ctx.getUserId(),
        activity_id,
        started_at: startedAt,
        ended_at: endedAt,
        values: values ?? {},
      })
      .select("id, activity_id, started_at, ended_at, values")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { log: data },
    };
  },
});
