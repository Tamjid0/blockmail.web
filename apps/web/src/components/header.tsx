"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function Header() {
  const { isSignedIn } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Blockmail
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/try" className="text-sm text-gray-600 hover:text-gray-900">
            Try It
          </Link>
          <Link href="/docs" className="text-sm text-gray-600 hover:text-gray-900">
            Docs
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/sign-out">Sign Out</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
