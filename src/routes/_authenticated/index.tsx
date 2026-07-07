import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/screens/HomePage";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});
