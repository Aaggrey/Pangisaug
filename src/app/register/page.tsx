import { RegisterForm } from "@/components/RegisterForm";

export const metadata = { title: "Create account — Pangisaug" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <RegisterForm />
    </div>
  );
}