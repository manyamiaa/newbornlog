import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DemoDataClientProvider } from "@/lib/data-client";

export const Route = createFileRoute("/demo")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Demo — Baby Log" },
      { name: "description", content: "Try Baby Log with sample data — no sign-up required." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <DemoDataClientProvider>
      <Outlet />
    </DemoDataClientProvider>
  ),
});
