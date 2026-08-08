import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_activities",
  title: "List activities",
  description:
    "List the signed-in user's trackable baby activities (Feeding, Sleep, Diaper, etc.) with their id, kind (instant or timed) and configurable fields. Call this first to get an activity id before logging.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("activities")
      .select("id, name, kind, fields, visible, sort_order")
      .order("sort_order", { ascending: true });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { activities: data ?? [] },
    };
  },
});
