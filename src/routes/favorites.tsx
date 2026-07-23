import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Favorites & Saved — SKIN POP" },
      { name: "description", content: "Save what you love. Access your favorite products, articles, routines and experts anytime." },
    ],
  }),
  component: () => <Outlet />,
});
