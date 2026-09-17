import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Sign in — Pangisaug" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}