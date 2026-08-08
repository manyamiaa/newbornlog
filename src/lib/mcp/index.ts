import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listActivitiesTool from "./tools/list-activities";
import listLogsTool from "./tools/list-logs";
import createLogTool from "./tools/create-log";
import getRunningTimerTool from "./tools/get-running-timer";
import stopTimerTool from "./tools/stop-timer";
import getBabyProfileTool from "./tools/get-baby-profile";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "baby-logbook",
  title: "Baby Logbook",
  version: "0.1.0",
  instructions:
    "Tools for Baby Logbook, a baby activity tracker. Use `list_activities` to discover the user's activities and their field keys, `create_log` to record feedings, sleep, diapers and other entries, `list_logs` to read entries in a time range, and `get_running_timer` / `stop_timer` for in-progress timed activities. All data is scoped to the signed-in user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listActivitiesTool,
    listLogsTool,
    createLogTool,
    getRunningTimerTool,
    stopTimerTool,
    getBabyProfileTool,
  ],
});
