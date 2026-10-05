"use client";

import React from "react";
import { IconId, IconLock, IconLockOpen, IconPlus, IconHistory } from "@tabler/icons-react";

const mockRfidLogs = [
  { id: 1, jam: "08:15:22", cardId: "E3:4F:9A:2B", name: "Kartu Ayah", status: "Berhasil", action: "Buka", date: "5 Okt 2026" },
  { id: 2, jam: "14:20:10", cardId: "1A:2B:3C:4D", name: "Kartu Ibu", status: "Ditolak", action: "-", date: "4 Okt 2026" },
  { id: 3, jam: "09:10:33", cardId: "E3:4F:9A:2B", name: "Kartu Ayah", status: "Berhasil", action: "Tutup", date: "4 Okt 2026" },
];

export default function RfidPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%", gridColumn: "1 / -1", minWidth: 0 }}>
      
      {/* Top Stats Cards */}
      <div className="two-col-grid">
        
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
            <div className="balance-amount" style={{ fontSize: "2rem" }}>2 Kartu</div>
            <div className="balance-change" style={{ color: "#6b7280" }}>Terakhir ditambah 1 Okt 2026</div>
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
              {mockRfidLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "1rem", fontSize: "0.875rem", fontWeight: 500 }}>{log.date}</td>
                  <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#4b5563" }}>{log.jam}</td>
                  <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#111827" }}>
                    <div style={{ fontWeight: 600 }}>{log.name}</div>
                    <div style={{ color: "#6b7280", fontSize: "0.75rem" }}>{log.cardId}</div>
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#4b5563", fontWeight: 500 }}>{log.action}</td>
                  <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                    <span style={{ 
                      padding: "0.25rem 0.5rem", 
                      borderRadius: "999px", 
                      backgroundColor: log.status === 'Berhasil' ? '#ecfdf5' : '#fef2f2', 
                      color: log.status === 'Berhasil' ? '#10b981' : '#ef4444',
                      fontWeight: 600,
                      fontSize: "0.75rem"
                    }}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
