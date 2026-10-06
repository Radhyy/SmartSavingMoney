"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  IconSearch,
  IconBell,
  IconUser,
  IconWallet,
  IconQrcode,
  IconReportSearch,
  IconCreditCard,
  IconId,
  IconSettings,
  IconLogout
} from "@tabler/icons-react";
import { supabase } from "@/lib/supabase";
import { getProfilePictureUrl } from "@/lib/s3";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState("");
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const [userEmail, setUserEmail] = useState("raaakb87@gmail.com");
  const [userName, setUserName] = useState("Radhiyya");
  const [userFullName, setUserFullName] = useState("Radhiyya");
  const [profilePic, setProfilePic] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserEmail(session.user.email || "raaakb87@gmail.com");
        const metadata = session.user.user_metadata;
        if (metadata?.nickname) setUserName(metadata.nickname);
        if (metadata?.full_name) setUserFullName(metadata.full_name);
        
        // Fetch profile pic from S3 dynamically per user
        const url = await getProfilePictureUrl(`profile-${session.user.id}.jpg`); 
        if (url) {
          setProfilePic(url);
        }
      }
    }
    loadUserData();
  }, []);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setCurrentDate(formatter.format(new Date()));
  }, []);

  return (
    <header className="header">
      <div className="header-bg-decoration"></div>
      <div className="header-top">
        <div className="logo">
          <Image 
            src="/SmartTabunganLogo3.png" 
            alt="Smart Tabungan Logo" 
            width={56} 
            height={56} 
            style={{ objectFit: "contain" }} 
          />
          <span>Smart Tabungan</span>
        </div>

        <div className="header-actions">
          <div className="search-bar">
            <IconSearch size={18} color="rgba(255,255,255,0.5)" />
            <input type="text" placeholder="Search by name, transactions" />
          </div>
          <div style={{ position: "relative" }}>
            <button className="icon-btn" onClick={() => setIsNotifOpen(!isNotifOpen)}>
              <IconBell size={18} />
              <span style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, backgroundColor: "#ef4444", borderRadius: "50%" }}></span>
            </button>
            {isNotifOpen && (
              <div style={{
                position: "absolute",
                top: "120%",
                right: "-20px",
                width: "320px",
                backgroundColor: "var(--card-bg)",
                borderRadius: "1rem",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                zIndex: 100,
                color: "var(--foreground)",
                overflow: "hidden"
              }}>
                <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>Notifikasi</h3>
                  <span style={{ fontSize: "0.75rem", color: "#3b82f6", cursor: "pointer", fontWeight: 500 }}>Tandai sudah dibaca</span>
                </div>
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "1rem", backgroundColor: "#f0f9ff" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#3b82f6", marginTop: "6px", flexShrink: 0 }}></div>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: "0 0 0.25rem 0" }}>Setoran Berhasil</p>
                      <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: 0 }}>Uang sebesar Rp 50.000 berhasil disetorkan ke tabungan.</p>
                      <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.25rem" }}>Baru saja</p>
                    </div>
                  </div>
                  <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "1rem" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "transparent", marginTop: "6px", flexShrink: 0 }}></div>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: "0 0 0.25rem 0" }}>Penarikan Tunai</p>
                      <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: 0 }}>Penarikan Rp 20.000 dilakukan melalui akses kartu Ibu.</p>
                      <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.25rem" }}>Kemarin, 14:20</p>
                    </div>
                  </div>
                  <div style={{ padding: "1rem 1.25rem", display: "flex", gap: "1rem" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "transparent", marginTop: "6px", flexShrink: 0 }}></div>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: "0 0 0.25rem 0" }}>Kartu Baru Didaftarkan</p>
                      <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: 0 }}>Kartu RFID (Kartu Ayah) berhasil didaftarkan.</p>
                      <p style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.25rem" }}>1 Okt 2026</p>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "0.75rem", borderTop: "1px solid var(--border)", textAlign: "center" }}>
                  <a href="#" style={{ fontSize: "0.875rem", color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}>Lihat semua notifikasi</a>
                </div>
              </div>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <button className="icon-btn" onClick={() => setIsProfileOpen(!isProfileOpen)} style={{ padding: profilePic ? 0 : undefined, overflow: "hidden" }}>
              {profilePic ? (
                <img src={profilePic} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              ) : (
                <IconUser size={18} />
              )}
            </button>
            
            {isProfileOpen && (
              <div style={{
                position: "absolute",
                top: "120%",
                right: "0",
                width: "200px",
                backgroundColor: "var(--card-bg)",
                borderRadius: "1rem",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                zIndex: 100,
                color: "var(--foreground)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              }}>
                <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem", margin: 0 }}>{userFullName}</p>
                  <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>{userEmail}</p>
                </div>
                <div style={{ padding: "0.5rem" }}>
                  <button 
                    onClick={() => {
                      setIsProfileOpen(false);
                      router.push('/settings');
                    }}
                    style={{ 
                      width: "100%", padding: "0.5rem 0.75rem", display: "flex", alignItems: "center", gap: "0.5rem",
                      background: "transparent", border: "none", textAlign: "left", cursor: "pointer", fontSize: "0.875rem",
                      borderRadius: "0.5rem", color: "var(--foreground)"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <IconSettings size={16} color="#4b5563" /> Pengaturan
                  </button>
                  <button 
                    onClick={() => {
                      setIsProfileOpen(false);
                      setShowLogoutConfirm(true);
                    }}
                    style={{ 
                      width: "100%", padding: "0.5rem 0.75rem", display: "flex", alignItems: "center", gap: "0.5rem",
                      background: "transparent", border: "none", textAlign: "left", cursor: "pointer", fontSize: "0.875rem",
                      borderRadius: "0.5rem", color: "#ef4444"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#fef2f2"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <IconLogout size={16} color="#ef4444" /> Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="header-content">
        <p className="header-date">{currentDate}</p>
        <h1 className="header-greeting">
          Selamat Pagi, <span>{userName}</span>
        </h1>

        <div className="nav-tabs">
          <Link href="/" className={`nav-tab ${pathname === "/" ? "active" : ""}`}>
            <IconWallet size={16} /> Overview
          </Link>
          <Link href="/balance" className={`nav-tab ${pathname === "/balance" ? "active" : ""}`}>
            <IconCreditCard size={16} /> Informasi Saldo
          </Link>
          <Link href="/rfid" className={`nav-tab ${pathname === "/rfid" ? "active" : ""}`}>
            <IconId size={16} /> Akses RFID
          </Link>

          <Link href="/settings" className={`nav-tab ${pathname === "/settings" ? "active" : ""}`}>
            <IconSettings size={16} /> Settings
          </Link>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(5px)" }}>
          <div style={{ backgroundColor: "var(--card-bg)", borderRadius: "1.5rem", padding: "2rem", width: "90%", maxWidth: "400px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
              <IconLogout size={32} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--foreground)", marginBottom: "0.5rem", marginTop: 0 }}>Keluar dari Akun?</h3>
            <p style={{ color: "#6b7280", marginBottom: "2rem", lineHeight: 1.5 }}>Apakah Anda yakin ingin keluar dari Smart Tabungan? Sesi Anda akan diakhiri.</p>
            <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, padding: "0.875rem", borderRadius: "1rem", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--foreground)", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                disabled={isLoggingOut}
              >
                Batal
              </button>
              <button 
                onClick={async () => {
                  setIsLoggingOut(true);
                  await supabase.auth.signOut();
                  router.push('/login');
                }}
                style={{ flex: 1, padding: "0.875rem", borderRadius: "1rem", border: "none", backgroundColor: "#ef4444", color: "white", fontWeight: 600, cursor: "pointer", transition: "all 0.2s", display: "flex", justifyContent: "center", alignItems: "center" }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#dc2626"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#ef4444"}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <div className="spinner" style={{ width: "20px", height: "20px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                ) : "Ya, Keluar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
