"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/ui/utils";

const navigation = [
  { name: "Overview", href: "/dashboard" },
  { name: "API Keys", href: "/dashboard/keys" },
  { name: "Usage", href: "/dashboard/usage" },
  { name: "Webhooks", href: "/dashboard/webhooks" },
  { name: "Audit Log", href: "/dashboard/audit" },
  { name: "Settings", href: "/dashboard/settings" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Blockmail
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.email || "User"}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
