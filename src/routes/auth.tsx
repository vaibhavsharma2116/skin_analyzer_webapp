import { createFileRoute } from "@tanstack/react-router";
import { AuthFlow } from "@/components/app/auth-flow";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign up — SKIN POP" },
      {
        name: "description",
        content: "Create your SKIN POP account, verify your email, and complete your skincare profile.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return <AuthFlow />;
}
