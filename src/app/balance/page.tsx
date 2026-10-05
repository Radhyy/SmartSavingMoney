"use client";

import React, { useState } from "react";
import { IconEdit, IconTrash, IconCreditCard, IconWallet, IconTarget, IconArrowDownRight, IconX, IconCashBanknote } from "@tabler/icons-react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const mockTransactions = [
  { id: 1, jam: "08:15:22", nominal: 50000, type: "Masuk", date: "5 Okt 2026" },
  { id: 2, jam: "10:30:45", nominal: 100000, type: "Masuk", date: "5 Okt 2026" },
  { id: 3, jam: "14:20:10", nominal: 20000, type: "Keluar", date: "5 Okt 2026" },
  { id: 4, jam: "16:45:00", nominal: 50000, type: "Masuk", date: "4 Okt 2026" },
  { id: 5, jam: "09:10:33", nominal: 10000, type: "Masuk", date: "4 Okt 2026" },
];

export default function BalancePage() {
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount) return;
    setSuccessMessage(`Permintaan tarik tunai Rp ${Number(withdrawAmount).toLocaleString('id-ID')} diproses.\nCelengan terbuka!`);
    setWithdrawAmount("");
    setIsWithdrawModalOpen(false);
  };

  const handleSetTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAmount) return;
    setSuccessMessage(`Target tabungan baru diatur:\nRp ${Number(targetAmount).toLocaleString('id-ID')}`);
    setTargetAmount("");
    setIsTargetModalOpen(false);
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", width: "100%", gridColumn: "1 / -1", minWidth: 0 }}>
        
        {/* Top Stats Cards */}
        <div className="stats-grid">
          {/* Total Tabungan */}
          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div className="card-header" style={{ marginBottom: "1rem", alignItems: "center" }}>
                <div className="card-title">
                  <IconWallet size={20} color="#3b82f6" />
                  Total Tabungan
                </div>
                <button 
                  onClick={() => setIsWithdrawModalOpen(true)}
                  className="btn btn-primary" 
                  style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.35rem 0.85rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "9999px" }}
                >
                  <IconCashBanknote size={14} /> Ambil Uang
                </button>
              </div>
              <div className="balance-amount" style={{ fontSize: "2rem" }}>Rp 8.470.000</div>
              <div className="balance-change"><span className="badge-success">+12.4%</span> dari bulan lalu</div>
            </div>
          </div>

          {/* Target */}
          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div className="card-header" style={{ marginBottom: "1rem", alignItems: "center" }}>
                <div className="card-title">
                  <IconTarget size={20} color="#8b5cf6" />
                  Target Tabungan
                </div>
                <button 
                  onClick={() => setIsTargetModalOpen(true)}
                  className="btn btn-outline" 
                  style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.35rem 0.85rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: "9999px", backgroundColor: "#f3f4f6", border: "none", color: "#374151" }}
                >
                  <IconEdit size={14} /> Ubah Target
                </button>
              </div>
              <div className="balance-amount" style={{ fontSize: "2rem" }}>Rp 12.000.000</div>
              <div className="balance-change" style={{ color: "#6b7280" }}>70.8% tercapai</div>
            </div>
          </div>

          {/* Pengeluaran */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: "1rem" }}>
              <div className="card-title">
                <IconArrowDownRight size={20} color="#ef4444" />
                Pengeluaran
              </div>
            </div>
            <div className="balance-amount" style={{ fontSize: "2rem" }}>Rp 520.000</div>
            <div className="balance-change" style={{ color: "#6b7280" }}>Bulan ini</div>
          </div>
        </div>

        {/* Table Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <IconCreditCard size={20} color="#3b82f6" />
              Riwayat Setoran & Penarikan (Sensor TCS)
            </div>
          </div>

          <div style={{ overflowX: "auto", margin: "0 -1.5rem", padding: "0 1.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", whiteSpace: "nowrap" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "1rem", color: "#6b7280", fontWeight: 500, fontSize: "0.875rem" }}>Tanggal</th>
                  <th style={{ padding: "1rem", color: "#6b7280", fontWeight: 500, fontSize: "0.875rem" }}>Jam</th>
                  <th style={{ padding: "1rem", color: "#6b7280", fontWeight: 500, fontSize: "0.875rem" }}>Jenis</th>
                  <th style={{ padding: "1rem", color: "#6b7280", fontWeight: 500, fontSize: "0.875rem" }}>Nominal</th>
                  <th style={{ padding: "1rem", color: "#6b7280", fontWeight: 500, fontSize: "0.875rem", textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", fontWeight: 500 }}>{tx.date}</td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#4b5563" }}>{tx.jam}</td>
                    <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                      <span style={{ 
                        padding: "0.25rem 0.5rem", 
                        borderRadius: "999px", 
                        backgroundColor: tx.type === 'Masuk' ? '#ecfdf5' : '#fef2f2', 
                        color: tx.type === 'Masuk' ? '#10b981' : '#ef4444',
                        fontWeight: 600,
                        fontSize: "0.75rem"
                      }}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "1rem", fontWeight: 600, color: "#111827" }}>
                      Rp {tx.nominal.toLocaleString("id-ID")}
                    </td>
                    <td style={{ padding: "1rem", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button 
                        style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb", backgroundColor: "white", color: "#3b82f6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title="Edit"
                      >
                        <IconEdit size={16} />
                      </button>
                      <button 
                        style={{ padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #fee2e2", backgroundColor: "#fef2f2", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title="Hapus"
                      >
                        <IconTrash size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {isWithdrawModalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: "400px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Ambil Uang Tabungan</h3>
              <button onClick={() => setIsWithdrawModalOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "#6b7280" }}>
                <IconX size={20} />
              </button>
            </div>
            <form onSubmit={handleWithdraw} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "#4b5563" }}>Nominal (Rp)</label>
                <input 
                  type="number" 
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Contoh: 50000" 
                  style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", outline: "none", width: "100%", fontSize: "1rem" }}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }}>
                Proses Penarikan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Set Target Modal */}
      {isTargetModalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: "400px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Ubah Target Tabungan</h3>
              <button onClick={() => setIsTargetModalOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "#6b7280" }}>
                <IconX size={20} />
              </button>
            </div>
            <form onSubmit={handleSetTarget} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "#4b5563" }}>Target Baru (Rp)</label>
                <input 
                  type="number" 
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="Contoh: 15000000" 
                  style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #d1d5db", outline: "none", width: "100%", fontSize: "1rem" }}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }}>
                Simpan Target
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {successMessage && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2010, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: "350px", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ width: "120px", height: "120px", marginBottom: "1rem" }}>
              <DotLottieReact
                src="/success-check.lottie"
                loop
                autoplay
              />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", color: "#111827" }}>Berhasil!</h3>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", whiteSpace: "pre-wrap", marginBottom: "1.5rem" }}>
              {successMessage}
            </p>
            <button 
              onClick={() => setSuccessMessage("")} 
              className="btn btn-primary" 
              style={{ width: "100%", borderRadius: "9999px" }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
