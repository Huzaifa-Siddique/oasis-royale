"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

type Props = {
  allowedRoles: ("customer" | "staff" | "admin")[];
  children: ReactNode;
};

export default function ProtectedRoute({ allowedRoles, children }: Props) {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!role || !allowedRoles.includes(role))) {
      router.replace("/profile");
    }
  }, [role, loading, allowedRoles, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <p className="text-foreground/50">Loading...</p>
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] gap-4">
        <p className="text-foreground/50">No access — redirecting to login…</p>
      </div>
    );
  }

  return <>{children}</>;
}
