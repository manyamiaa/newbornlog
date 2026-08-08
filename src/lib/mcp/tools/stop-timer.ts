import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "stop_timer",
  title: "Stop timer",
  description:
    "Stop a running timed log entry for the signed-in user by setting its end time to now. Use get_running_timer to find the id.",
  inputSchema: {
    id: z.string().describe("Id of the running log entry."),
    ended_at: z
      .string()
      .optional()
      .describe("ISO 8601 end time. Defaults to now."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ id, ended_at }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("logs")
      .update({ ended_at: ended_at ?? new Date().toISOString() })
      .eq("id", id)
      .select("id, activity_id, started_at, ended_at, values")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { log: data },
    };
  },
});
