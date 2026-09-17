import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const metadata = { title: "Dashboard — Pangisaug" };

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <Suspense>
      <DashboardClient
        user={{ name: user.name, email: user.email, role: user.role }}
      />
    </Suspense>
  );
}