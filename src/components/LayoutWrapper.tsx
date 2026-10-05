"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

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
