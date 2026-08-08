import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_logs",
  title: "List logs",
  description:
    "List the signed-in user's baby log entries between two ISO timestamps, oldest first. Use it to answer questions like how much the baby slept or ate in a period.",
  inputSchema: {
    from: z.string().describe("Start of the range, ISO 8601 timestamp (inclusive)."),
    to: z.string().describe("End of the range, ISO 8601 timestamp (exclusive)."),
    activity_id: z.string().optional().describe("Optional activity id to filter by."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to, activity_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("logs")
      .select("id, activity_id, started_at, ended_at, values")
      .gte("started_at", from)
      .lt("started_at", to)
      .order("started_at", { ascending: true })
      .limit(500);
    if (activity_id) query = query.eq("activity_id", activity_id);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { logs: data ?? [] },
    };
  },
});
