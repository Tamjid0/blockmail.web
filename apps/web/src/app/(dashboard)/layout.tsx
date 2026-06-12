import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = await requireAuth();

  if (!auth) {
    redirect("/sign-in");
  }

  // Block unverified users from accessing dashboard
  // Social sign-ins (Google, GitHub) are pre-verified by Supabase
  const isEmailVerified = auth.authUser.email_confirmed_at !== null;
  if (!isEmailVerified) {
    redirect("/verify-email");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
