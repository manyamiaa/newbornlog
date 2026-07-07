import { createFileRoute } from "@tanstack/react-router";
import { InsightsPage } from "@/screens/InsightsPage";

export const Route = createFileRoute("/_authenticated/insights")({
  component: InsightsPage,
});
