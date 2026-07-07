import { createFileRoute } from "@tanstack/react-router";
import { ActivitiesPage } from "@/screens/ActivitiesPage";

export const Route = createFileRoute("/demo/activities")({
  component: ActivitiesPage,
});
