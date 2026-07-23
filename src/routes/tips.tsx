import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/tips")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tips & Articles — SKIN POP" },
      { name: "description", content: "Skincare tips, ingredient guides, routines and expert advice curated by dermatologists." },
    ],
  }),
  component: () => <Outlet />,
});
