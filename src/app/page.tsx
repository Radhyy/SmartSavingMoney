"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IconSettings,
  IconWallet,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconBuildingBank,
  IconDots,
  IconEye,
  IconEyeOff,
  IconCalendarEvent,
  IconCreditCard,
  IconId,
  IconTarget
} from "@tabler/icons-react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const router = useRouter();
  const [isMainBalanceVisible, setIsMainBalanceVisible] = useState(true);
  const [isTotalVisible, setIsTotalVisible] = useState(true);
  const [filterType, setFilterType] = useState("Bulanan");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  
  const [balance, setBalance] = useState(0);
  const [currentSavingsTarget, setCurrentSavingsTarget] = useState(12000000);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      // fetch target
      const { data: targetData } = await supabase.from('savings_target').select('amount').eq('id', 1).single();
      if (targetData) setCurrentSavingsTarget(Number(targetData.amount));

      const { data, error } = await supabase.from('transactions').select('type, amount');
      if (!error && data) {
        let total = 0;
        data.forEach(txn => {
          if (txn.type === 'deposit') total += Number(txn.amount);
          else if (txn.type === 'expense') total -= Number(txn.amount);
        });
        setBalance(total);
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <>
      {/* Left Column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", minWidth: 0, width: "100%" }}>
        {/* Balance Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <IconWallet size={20} color="#3b82f6" />
              Total Tabungan Saya
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: "#f3f4f6", padding: "0.25rem 0.5rem", borderRadius: "8px" }}>
              IDR
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="balance-amount" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {isLoading ? "Memuat..." : (isMainBalanceVisible ? formatRp(balance) : "Rp ••.•••.•••")} 
                {isMainBalanceVisible ? (
                  <IconEye 
                    size={24} 
                    color="#9ca3af" 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => setIsMainBalanceVisible(false)} 
                  />
                ) : (
                  <IconEyeOff 
                    size={24} 
                    color="#9ca3af" 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => setIsMainBalanceVisible(true)} 
                  />
                )}
              </div>
              <div className="balance-change">
                <span className="badge-success">+12.4%</span>
                <span className="hide-on-mobile">Kenaikan saldo, progress bagus</span>
              </div>
            </div>

            {/* Mini Block Chart */}
            <div className="mini-chart">
              <div>
                <div style={{ backgroundColor: '#e4f7a1' }}></div>
              </div>
              <div>
                <div style={{ backgroundColor: '#d4f276' }}></div>
              </div>
              <div>
                <div style={{ backgroundColor: '#aecbf7' }}></div>
                <div style={{ backgroundColor: '#d4f276' }}></div>
                <div style={{ backgroundColor: '#e4f7a1' }}></div>
                <div style={{ backgroundColor: '#b6d0f5' }}></div>
              </div>
              <div>
                <div style={{ backgroundColor: '#87b4f5' }}></div>
                <div style={{ backgroundColor: '#b6d0f5' }}></div>
              </div>
              <div>
                <div style={{ backgroundColor: '#d4f276' }}></div>
                <div style={{ backgroundColor: '#3984f8' }}></div>
                <div style={{ backgroundColor: '#87b4f5' }}></div>
              </div>
              <div>
                <div style={{ backgroundColor: '#3984f8' }}></div>
                <div style={{ backgroundColor: '#bde03c' }}></div>
              </div>
              <div>
                <div style={{ backgroundColor: '#135ff0' }}></div>
                <div style={{ backgroundColor: '#3984f8' }}></div>
                <div style={{ backgroundColor: '#bde03c' }}></div>
                <div style={{ backgroundColor: '#87b4f5' }}></div>
                <div style={{ backgroundColor: '#c5d9f7' }}></div>
              </div>
            </div>
          </div>

          <div className="action-buttons" style={{ flexWrap: 'wrap', overflow: 'visible', paddingBottom: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={() => router.push('/balance')}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', backgroundColor: 'white', borderRadius: '50%', color: '#3b82f6' }}>
                <IconCreditCard size={16} />
              </div>
              Informasi
            </button>
            <button className="btn btn-secondary" onClick={() => router.push('/balance')}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', backgroundColor: 'white', borderRadius: '50%', color: '#111827' }}>
                <IconTarget size={16} />
              </div>
              Target
            </button>
            <div style={{ position: 'relative' }}>
              <button className="btn-icon" onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}>
                <IconDots size={18} />
              </button>
              {isActionMenuOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', zIndex: 20, width: '120px' }}>
                  <div onClick={() => router.push('/settings')} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="hover:bg-gray-50">
                    <IconSettings size={14} /> Setting
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pencapaian Target Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ marginBottom: '2rem' }}>
            <div className="card-title">
              <IconSettings size={20} color="#3b82f6" />
              Pencapaian Target
            </div>
            <button className="btn-icon" style={{ border: 'none', background: 'transparent' }}>
              <IconDots size={18} color="#6b7280" />
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: '1rem' }}>
            <div style={{ position: 'relative', width: '100%', height: '150px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <svg width="280" height="150" viewBox="0 0 280 150" style={{ overflow: 'visible' }}>
                {Array.from({ length: 24 }).map((_, i) => {
                  const progressPct = currentSavingsTarget > 0 ? (balance / currentSavingsTarget) * 100 : 0;
                  const isActive = i < Math.round((progressPct / 100) * 24);
                  const angle = -90 + (i * (180 / 23)); // 23 spaces between 24 items
                  return (
                    <rect
                      key={i}
                      x="135" // 140 - 5
                      y="10"
                      width="10"
                      height="40"
                      rx="5"
                      fill={isActive ? "#3b82f6" : "#eff6ff"} 
                      transform={`rotate(${angle}, 140, 140)`}
                    />
                  );
                })}
              </svg>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'translateY(10px)' }}>
                <h4 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1 }}>{currentSavingsTarget > 0 ? ((balance / currentSavingsTarget) * 100).toFixed(1) : 0}%</h4>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500, marginTop: '0.25rem' }}>Pertumbuhan Tabungan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", minWidth: 0, width: "100%" }}>
        {/* Payment Overview */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <IconSettings size={20} color="#3b82f6" />
              Presentase
            </div>
            <div style={{ position: "relative" }}>
              <div 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", backgroundColor: "#f3f4f6", padding: "0.25rem 0.75rem", borderRadius: "999px", cursor: 'pointer' }}
              >
                <IconCalendarEvent size={16} /> {filterType} <IconDots size={14} />
              </div>
              
              {isFilterOpen && (
                <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "0.5rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", border: "1px solid #e5e7eb", zIndex: 10, overflow: "hidden" }}>
                  {["Harian", "Mingguan", "Bulanan", "Tahunan"].map((type) => (
                    <div 
                      key={type}
                      onClick={() => { setFilterType(type); setIsFilterOpen(false); }}
                      style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", cursor: "pointer", backgroundColor: filterType === type ? "#eff6ff" : "white", color: filterType === type ? "#3b82f6" : "#374151" }}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: "1rem", color: "#6b7280", fontSize: "0.875rem" }}>Total Tabungan</div>
          <div className="balance-amount">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isLoading ? "Memuat..." : (isTotalVisible ? formatRp(balance) : "Rp ••.•••.•••")}
              {isTotalVisible ? (
                <IconEye size={24} color="#9ca3af" style={{ cursor: 'pointer' }} onClick={() => setIsTotalVisible(false)} />
              ) : (
                <IconEyeOff size={24} color="#9ca3af" style={{ cursor: 'pointer' }} onClick={() => setIsTotalVisible(true)} />
              )}
            </div>
          </div>
          <div className="balance-change" style={{ marginBottom: "1.5rem" }}>
            <span className="badge-success">+6.9%</span>
            <span>vs bulan lalu</span>
          </div>

          <div className="chart-container">
            <div className="chart-bar-group">
              <div className="chart-bar-value">Rp 12M</div>
              <div className="chart-bar" style={{ height: "120px", opacity: 0.8 }}></div>
              <div className="chart-bar-label">Minggu 1</div>
            </div>
            <div className="chart-bar-group">
              <div className="chart-bar-value">Rp 8M</div>
              <div className="chart-bar" style={{ height: "80px", opacity: 0.6 }}></div>
              <div className="chart-bar-label">Minggu 2</div>
            </div>
            <div className="chart-bar-group">
              <div className="chart-bar-value">Rp 15M</div>
              <div className="chart-bar" style={{ height: "150px", opacity: 0.9 }}></div>
              <div className="chart-bar-label">Minggu 3</div>
            </div>
            <div className="chart-bar-group">
              <div className="chart-bar-value">Rp 9M</div>
              <div className="chart-bar" style={{ height: "90px", opacity: 0.7 }}></div>
              <div className="chart-bar-label">Minggu 4</div>
            </div>
            <div className="chart-bar-group">
              <div className="chart-bar-value">Rp 20M</div>
              <div className="chart-bar" style={{ height: "200px", opacity: 1 }}></div>
              <div className="chart-bar-label">Minggu 5</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
