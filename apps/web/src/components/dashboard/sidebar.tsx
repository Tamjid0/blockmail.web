"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/ui/utils";

const navigation = [
  { name: "Overview", href: "/dashboard" },
  { name: "API Keys", href: "/dashboard/keys" },
  { name: "Usage", href: "/dashboard/usage" },
  { name: "Webhooks", href: "/dashboard/webhooks" },
  { name: "Settings", href: "/dashboard/settings" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Blockmail
        </Link>
      </div>

      {/* Navigation */}
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

      {/* User */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
          <div className="flex-1 truncate">
            <p className="text-sm font-medium text-gray-900">Account</p>
          </div>
        </div>
      </div>
    </div>
  );
}
