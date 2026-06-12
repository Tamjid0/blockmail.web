"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function AuthErrorCatcher() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const hashParams = new URLSearchParams(hash.slice(1));
    const error = hashParams.get("error");

    if (error) {
      // Preserve the hash params and redirect to /auth/confirm
      const params = new URLSearchParams(window.location.search);
      hashParams.forEach((v, k) => params.set(k, v));
      window.location.replace(`/auth/confirm?${params.toString()}`);
    }
  }, [pathname]);

  return null;
}
