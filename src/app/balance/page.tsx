"use client";

import React, { useState, useEffect } from "react";
import { IconEdit, IconTrash, IconCreditCard, IconWallet, IconTarget, IconArrowDownRight, IconX, IconCashBanknote, IconSparkles, IconRefresh } from "@tabler/icons-react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { supabase } from "@/lib/supabase";

export default function BalancePage() {
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [expensesThisMonth, setExpensesThisMonth] = useState(0);
  const [currentSavingsTarget, setCurrentSavingsTarget] = useState(12000000);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    // Fetch target
    const { data: targetData } = await supabase.from('savings_target').select('amount').eq('id', 1).single();
    if (targetData) setCurrentSavingsTarget(Number(targetData.amount));

    // Fetch transactions
    const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    
    if (!error && data) {
      setTransactions(data);
      
      let totalBal = 0;
      let expensesMonth = 0;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      data.forEach(txn => {
        const amt = Number(txn.amount);
        const txnDate = new Date(txn.created_at);
        
        if (txn.type === 'deposit') {
          totalBal += amt;
        } else if (txn.type === 'expense') {
          totalBal -= amt;
          if (txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear) {
            expensesMonth += amt;
          }
        }
      });
      
      setBalance(totalBal);
      setExpensesThisMonth(expensesMonth);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount) return;
    const numAmount = Number(withdrawAmount);

    if (numAmount > balance) {
      alert("Saldo tidak cukup untuk ditarik!");
      return;
    }

    // Insert into DB without description
    const { error } = await supabase.from('transactions').insert([
      { type: 'expense', amount: numAmount }
    ]);

    if (!error) {
      setSuccessMessage(`Permintaan tarik tunai Rp ${numAmount.toLocaleString('id-ID')} diproses.\nCelengan terbuka!`);
      setWithdrawAmount("");
      setIsWithdrawModalOpen(false);
      loadData(); // Refresh data immediately
    } else {
      alert("Gagal memproses penarikan. Coba lagi.");
    }
  };

  const handleSetTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAmount) return;
    const newTarget = Number(targetAmount);
    
    // Save to DB
    await supabase.from('savings_target').upsert({ id: 1, amount: newTarget });
    setCurrentSavingsTarget(newTarget);
    
    setSuccessMessage(`Target tabungan baru diatur:\nRp ${newTarget.toLocaleString('id-ID')}`);
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
              <div className="balance-amount" style={{ fontSize: "2rem" }}>{isLoading ? "Memuat..." : formatRp(balance)}</div>
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
              <div className="balance-amount" style={{ fontSize: "2rem" }}>{isLoading ? "Memuat..." : formatRp(currentSavingsTarget)}</div>
              <div className="balance-change" style={{ color: "#6b7280" }}>{currentSavingsTarget > 0 ? ((balance / currentSavingsTarget) * 100).toFixed(1) : 0}% tercapai</div>
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
            <div className="balance-amount" style={{ fontSize: "2rem" }}>{isLoading ? "Memuat..." : formatRp(expensesThisMonth)}</div>
            <div className="balance-change" style={{ color: "#6b7280" }}>Bulan ini</div>
          </div>
        </div>

        {/* AI Financial Advisor Card */}
        <div className="card" style={{ 
          border: "1px solid #e2e8f0",
          position: "relative",
          overflow: "hidden",
          padding: "1.25rem"
        }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <IconSparkles size={18} color="#3b82f6" />
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1e293b", margin: 0 }}>AI Financial Advisor</h3>
              <span style={{ fontSize: "0.65rem", backgroundColor: "#f1f5f9", color: "#64748b", padding: "0.15rem 0.4rem", borderRadius: "0.25rem", fontWeight: 600, letterSpacing: "0.05em" }}>BETA</span>
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: "0.75rem", padding: "1rem", color: "#475569", fontSize: "0.85rem", lineHeight: 1.5 }}>
              <p style={{ margin: 0 }}>
                Berdasarkan pola menabungmu (rata-rata <strong>Rp 20.000/hari</strong>), kamu diprediksi mencapai target beli Laptop pada <strong>15 November 2026</strong>. 
              </p>
              <p style={{ margin: "0.5rem 0 0 0", color: "#3b82f6", fontWeight: 500 }}>
                💡 Tips: Kurangi jajan di luar untuk mempercepat target ini dalam 2 bulan.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button style={{ backgroundColor: "transparent", color: "#64748b", border: "1px solid #e2e8f0", padding: "0.35rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                Beri Tips Lain
              </button>
              <button style={{ backgroundColor: "transparent", color: "#64748b", border: "1px solid #e2e8f0", padding: "0.35rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                Analisis Pengeluaran
              </button>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <IconCreditCard size={20} color="#3b82f6" />
              Riwayat Setoran & Penarikan (Sensor TCS)
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
                  <th style={{ padding: "1rem", color: "#6b7280", fontWeight: 500, fontSize: "0.875rem" }}>Jenis</th>
                  <th style={{ padding: "1rem", color: "#6b7280", fontWeight: 500, fontSize: "0.875rem" }}>Nominal</th>
                  <th style={{ padding: "1rem", color: "#6b7280", fontWeight: 500, fontSize: "0.875rem", textAlign: "right" }}>Aksi</th>
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
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                      Belum ada transaksi.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const dateObj = new Date(tx.created_at);
                    const isDeposit = tx.type === 'deposit';
                    return (
                      <tr key={tx.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "1rem", fontSize: "0.875rem", fontWeight: 500 }}>{dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#4b5563" }}>{dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                        <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                          <span style={{ 
                            padding: "0.25rem 0.5rem", 
                            borderRadius: "999px", 
                            backgroundColor: isDeposit ? '#ecfdf5' : '#fef2f2', 
                            color: isDeposit ? '#10b981' : '#ef4444',
                            fontWeight: 600,
                            fontSize: "0.75rem"
                          }}>
                            {isDeposit ? 'Masuk' : 'Keluar'}
                          </span>
                        </td>
                        <td style={{ padding: "1rem", fontSize: "1rem", fontWeight: 600, color: "#111827" }}>
                          {formatRp(tx.amount)}
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
                    );
                  })
                )}
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
