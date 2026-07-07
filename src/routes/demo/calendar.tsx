import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/screens/CalendarPage";

export const Route = createFileRoute("/demo/calendar")({
  component: CalendarPage,
});
