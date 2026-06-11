"use client";

import { SignOutButton } from "@clerk/nextjs";

export default function SignOutPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign Out</h1>
        <SignOutButton redirectUrl="/" />
      </div>
    </div>
  );
}
