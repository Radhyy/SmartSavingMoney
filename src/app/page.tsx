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
  const [filterType, setFilterType] = useState("Harian");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isTargetMenuOpen, setIsTargetMenuOpen] = useState(false);
  
  const [balance, setBalance] = useState(0);
  const [currentSavingsTarget, setCurrentSavingsTarget] = useState(12000000);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      // fetch target
      const { data: targetData } = await supabase.from('savings_target').select('amount').eq('id', 1).single();
      if (targetData) setCurrentSavingsTarget(Number(targetData.amount));

      const { data, error } = await supabase.from('transactions').select('*');
      if (!error && data) {
        setTransactions(data);
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

  useEffect(() => {
    const now = new Date();
    const periods: any[] = [];
    
    if (filterType === 'Harian') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        periods.push({
          label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
          start: new Date(d.setHours(0,0,0,0)),
          end: new Date(d.setHours(23,59,59,999)),
          value: 0
        });
      }
    } else if (filterType === 'Mingguan') {
      for (let i = 4; i >= 0; i--) {
        const start = new Date();
        start.setDate(now.getDate() - (i * 7) - now.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        periods.push({
          label: `Mg ${5-i}`,
          start: new Date(start.setHours(0,0,0,0)),
          end: new Date(end.setHours(23,59,59,999)),
          value: 0
        });
      }
    } else if (filterType === 'Bulanan') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        periods.push({
          label: d.toLocaleDateString('id-ID', { month: 'short' }),
          start: new Date(d.setHours(0,0,0,0)),
          end: new Date(end.setHours(23,59,59,999)),
          value: 0
        });
      }
    } else if (filterType === 'Tahunan') {
      for (let i = 4; i >= 0; i--) {
        const d = new Date(now.getFullYear() - i, 0, 1);
        const end = new Date(now.getFullYear() - i, 11, 31);
        periods.push({
          label: `${d.getFullYear()}`,
          start: new Date(d.setHours(0,0,0,0)),
          end: new Date(end.setHours(23,59,59,999)),
          value: 0
        });
      }
    }

    transactions.forEach(tx => {
      const txDate = new Date(tx.created_at);
      const amt = Number(tx.amount);
      for (let p of periods) {
        if (txDate >= p.start && txDate <= p.end) {
          if (tx.type === 'deposit') p.value += amt;
          else if (tx.type === 'expense') p.value -= amt;
          break;
        }
      }
    });

    const maxVal = Math.max(...periods.map(p => Math.abs(p.value)), 1);

    const newChartData = periods.map(p => {
      const height = Math.max((Math.abs(p.value) / maxVal) * 200, 10);
      const opacity = p.value >= 0 ? 0.5 + (Math.abs(p.value) / maxVal) * 0.5 : 0.4;
      
      let valStr = "";
      const absVal = Math.abs(p.value);
      if (absVal >= 1000000) valStr = `Rp ${(p.value / 1000000).toFixed(1)}Jt`;
      else if (absVal >= 1000) valStr = `Rp ${(p.value / 1000).toFixed(0)}Rb`;
      else valStr = `Rp ${p.value}`;

      return { ...p, height, opacity, valStr };
    });

    setChartData(newChartData);
  }, [filterType, transactions]);

  return (
    <>
      {/* Left Column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", minWidth: 0, width: "100%" }}>
        {/* Balance Card */}
        <div className="card" style={{ overflow: 'visible' }}>
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
                <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '0.5rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', zIndex: 20, width: '150px' }}>
                  <div onClick={() => router.push('/balance?action=set_target')} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="hover:bg-gray-50">
                    <IconTarget size={14} /> Setting Target
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pencapaian Target Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
          <div className="card-header" style={{ marginBottom: '2rem' }}>
            <div className="card-title">
              <IconSettings size={20} color="#3b82f6" />
              Pencapaian Target
            </div>
            <div style={{ position: "relative" }}>
              <button className="btn-icon" style={{ border: 'none', background: 'transparent' }} onClick={() => setIsTargetMenuOpen(!isTargetMenuOpen)}>
                <IconDots size={18} color="#6b7280" />
              </button>
              {isTargetMenuOpen && (
                <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '0.5rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', zIndex: 20, width: '150px' }}>
                  <div 
                    onClick={() => router.push('/balance?action=set_target')} 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
                  >
                    <IconTarget size={14} /> Ubah Target
                  </div>
                </div>
              )}
            </div>
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
            {chartData.map((data, index) => (
              <div key={index} className="chart-bar-group" style={{ width: `${100 / chartData.length}%` }}>
                <div className="chart-bar-value" style={{ color: data.value < 0 ? '#ef4444' : 'inherit' }}>{data.valStr}</div>
                <div 
                  className="chart-bar" 
                  style={{ 
                    height: `${data.height}px`, 
                    opacity: data.opacity,
                    background: data.value < 0 ? 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)' : 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)'
                  }}
                ></div>
                <div className="chart-bar-label">{data.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
