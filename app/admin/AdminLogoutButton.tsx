"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function AdminLogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function logout() {
    setIsSubmitting(true);

    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        headers: {
          Accept: "application/json"
        }
      });
    } finally {
      setIsSubmitting(false);
      router.refresh();
    }
  }

  return (
    <button
      className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-2 text-sm font-bold text-ink transition hover:border-danger/30 hover:text-danger disabled:cursor-not-allowed disabled:text-ink/40"
      disabled={isSubmitting}
      onClick={() => void logout()}
      type="button"
    >
      <LogOut aria-hidden="true" className="h-4 w-4" />
      로그아웃
    </button>
  );
}
