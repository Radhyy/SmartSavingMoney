"use client";

import React, { useEffect, useState } from "react";
import { IconId, IconLock, IconLockOpen, IconPlus, IconHistory, IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { supabase } from "@/lib/supabase";

export default function RfidPage() {
  const [rfidLogs, setRfidLogs] = useState<any[]>([]);
  const [suspiciousCount, setSuspiciousCount] = useState(0);
  const [registeredCardsCount, setRegisteredCardsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    
    // Fetch logs
    const { data: logsData, error: logsError } = await supabase
      .from('rfid_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (!logsError && logsData) {
      setRfidLogs(logsData);
    }

    // Fetch suspicious count today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: suspCount, error: suspError } = await supabase
      .from('suspicious_activities')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
      
    if (!suspError) setSuspiciousCount(suspCount || 0);

    // Fetch registered cards count
    const { count: cardsCount, error: cardsError } = await supabase
      .from('rfid_cards')
      .select('*', { count: 'exact', head: true });
      
    if (!cardsError) setRegisteredCardsCount(cardsCount || 0);

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%", gridColumn: "1 / -1", minWidth: 0 }}>
      
      {/* Top Stats Cards */}
      <div className="stats-grid">
        
        {/* Solenoid Status */}
        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="card-header" style={{ marginBottom: "1rem" }}>
              <div className="card-title">
                <IconLock size={20} color="#3b82f6" />
                Status Selenoid (Pintu)
              </div>
            </div>
            <div className="balance-amount" style={{ fontSize: "2rem", color: "#111827", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <IconLock size={32} color="#10b981" /> Terkunci
            </div>
            <div className="balance-change"><span className="badge-success">Aman</span> Sensor RFID aktif</div>
          </div>
        </div>

        {/* Suspicious Activity (AI) */}
        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", border: "1px solid #fee2e2", backgroundColor: "#fffbfb" }}>
          <div>
            <div className="card-header" style={{ marginBottom: "1rem" }}>
              <div className="card-title" style={{ color: "#b91c1c" }}>
                <IconAlertTriangle size={20} color="#ef4444" />
                Aktivitas Mencurigakan
              </div>
            </div>
            <div className="balance-amount" style={{ fontSize: "2rem", color: "#111827" }}>
              {suspiciousCount} <span style={{ fontSize: "1rem", color: "#6b7280", fontWeight: 500 }}>percobaan</span>
            </div>
            <div className="balance-change" style={{ color: "#6b7280" }}>
              {suspiciousCount > 0 ? (
                <span style={{ color: "#ef4444", fontWeight: 600 }}>Waspada</span>
              ) : (
                <span style={{ color: "#10b981", fontWeight: 600 }}>Aman</span>
              )} hari ini
            </div>
          </div>
        </div>

        {/* Registered Cards */}
        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="card-header" style={{ marginBottom: "1rem", alignItems: "center" }}>
              <div className="card-title">
                <IconId size={20} color="#8b5cf6" />
                Kartu RFID Terdaftar
              </div>
              <button 
                className="btn btn-outline" 
                style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.35rem 0.85rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "9999px", backgroundColor: "#f3f4f6", border: "none", color: "#374151" }}
              >
                <IconPlus size={14} /> Tambah
              </button>
            </div>
            <div className="balance-amount" style={{ fontSize: "2rem" }}>{registeredCardsCount} Kartu</div>
            <div className="balance-change" style={{ color: "#6b7280" }}>Kartu yang memiliki akses</div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <IconHistory size={20} color="#3b82f6" />
            Log Akses Pintu Tabungan
          </div>
          <button 
            onClick={loadData}
            className="btn btn-outline" 
            style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.35rem 0.85rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "9999px", backgroundColor: "#f3f4f6", border: "none", color: "#374151", cursor: "pointer" }}
            disabled={isLoading}
          >
            <IconRefresh size={14} className={isLoading ? "spinner" : ""} /> Refresh
          </button>
        </div>

        <div style={{ overflowX: "auto", margin: "0 -1.5rem", padding: "0 1.5rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", whiteSpace: "nowrap" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "1rem", color: "#6b7280", fontWeight: 500, fontSize: "0.875rem" }}>Tanggal</th>
                <th style={{ padding: "1rem", color: "#6b7280", fontWeight: 500, fontSize: "0.875rem" }}>Jam</th>
                <th style={{ padding: "1rem", color: "#6b7280", fontWeight: 500, fontSize: "0.875rem" }}>ID Kartu / Pemilik</th>
                <th style={{ padding: "1rem", color: "#6b7280", fontWeight: 500, fontSize: "0.875rem" }}>Aksi</th>
                <th style={{ padding: "1rem", color: "#6b7280", fontWeight: 500, fontSize: "0.875rem" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}>
                      <div className="spinner" style={{ width: "20px", height: "20px", border: "2px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> Memuat data...
                    </div>
                  </td>
                </tr>
              ) : rfidLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                    Belum ada log akses.
                  </td>
                </tr>
              ) : (
                rfidLogs.map((log) => {
                  const dateObj = new Date(log.created_at);
                  const isSuccess = log.event === 'known';
                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "1rem", fontSize: "0.875rem", fontWeight: 500 }}>{dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#4b5563" }}>{dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#111827" }}>
                        <div style={{ fontWeight: 600 }}>{isSuccess ? 'Kartu Terdaftar' : 'Tidak Dikenal'}</div>
                        <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>{log.card_uid}</div>
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#4b5563", fontWeight: 500 }}>Tap Kartu</td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                        <span style={{ 
                          padding: "0.25rem 0.5rem", 
                          borderRadius: "999px", 
                          backgroundColor: isSuccess ? '#ecfdf5' : '#fef2f2', 
                          color: isSuccess ? '#10b981' : '#ef4444',
                          fontWeight: 600,
                          fontSize: "0.75rem"
                        }}>
                          {isSuccess ? 'Berhasil' : 'Ditolak'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
