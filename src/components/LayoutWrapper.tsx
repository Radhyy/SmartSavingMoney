"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";
  
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session && !isLoginPage) {
        router.push("/login");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session && !isLoginPage) {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [isLoginPage, router]);

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", fontWeight: "bold" }}>Memuat data pengguna...</div>;
  }

  if (isLoginPage) {
    return <main className="login-wrapper">{children}</main>;
  }

  return (
    <div className="dashboard-container">
      <Header />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
