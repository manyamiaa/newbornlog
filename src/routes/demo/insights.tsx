import { createFileRoute } from "@tanstack/react-router";
import { InsightsPage } from "@/screens/InsightsPage";

export const Route = createFileRoute("/demo/insights")({
  component: InsightsPage,
});
