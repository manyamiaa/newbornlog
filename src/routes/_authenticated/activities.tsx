import { createFileRoute } from "@tanstack/react-router";
import { ActivitiesPage } from "@/screens/ActivitiesPage";

export const Route = createFileRoute("/_authenticated/activities")({
  component: ActivitiesPage,
});
