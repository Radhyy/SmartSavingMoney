"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  IconUser, 
  IconMail, 
  IconLock, 
  IconCamera, 
  IconEye, 
  IconEyeOff, 
  IconSettings,
  IconCheck,
  IconBrandWhatsapp,
  IconQrcode,
  IconRefresh,
  IconAlertTriangle,
  IconPhone,
  IconSend,
  IconShield,
  IconTrash
} from "@tabler/icons-react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { supabase } from "@/lib/supabase";
import { getProfilePictureUrl } from "@/lib/s3";

export default function Settings() {
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    email: '',
    password: ''
  });

  // WhatsApp States
  const [waStatus, setWaStatus] = useState<'disconnected' | 'connecting' | 'qr' | 'connected'>('disconnected');
  const [waQrCode, setWaQrCode] = useState<string | null>(null);
  const [waUser, setWaUser] = useState<any>(null);
  const [waTargetPhone, setWaTargetPhone] = useState('');
  const [isWaLoading, setIsWaLoading] = useState(false);
  const [isTestingWa, setIsTestingWa] = useState(false);
  const [waMessage, setWaMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch initial profile data
  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const metadata = session.user.user_metadata || {};
        setFormData({
          fullName: metadata.full_name || 'Radhiyya',
          nickname: metadata.nickname || 'Radhiyya',
          email: session.user.email || 'radhiyya@gmail.com',
          password: '••••••••'
        });
        setUserId(session.user.id);
        const picUrl = await getProfilePictureUrl(`profile-${session.user.id}.jpg`);
        if (picUrl) setProfilePic(picUrl);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Fetch WA status & poll when awaiting scan
  const fetchWAStatus = async () => {
    try {
      const res = await fetch('/api/wa');
      if (res.ok) {
        const data = await res.json();
        setWaStatus(data.status);
        setWaQrCode(data.qrCode);
        setWaUser(data.user);
        if (data.targetPhone !== undefined && !waTargetPhone) {
          setWaTargetPhone(data.targetPhone);
        }
      }
    } catch (err) {
      console.error('Error fetching WA status:', err);
    }
  };

  useEffect(() => {
    fetchWAStatus();
  }, []);

  useEffect(() => {
    // Polling setiap 3 detik jika status sedang menunggu scan QR atau sedang menghubungkan
    let interval: NodeJS.Timeout;
    if (waStatus === 'qr' || waStatus === 'connecting') {
      interval = setInterval(() => {
        fetchWAStatus();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [waStatus]);

  const handleConnectWA = async () => {
    setIsWaLoading(true);
    setWaMessage(null);
    try {
      const res = await fetch('/api/wa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' }),
      });
      const data = await res.json();
      if (data.status) {
        setWaStatus(data.status);
        setWaQrCode(data.qrCode);
        setWaUser(data.user);
      }
    } catch (err: any) {
      setWaMessage({ type: 'error', text: 'Gagal memulai koneksi WhatsApp.' });
    } finally {
      setIsWaLoading(false);
    }
  };

  const handleDisconnectWA = async () => {
    if (!confirm('Apakah Anda yakin ingin memutuskan koneksi WhatsApp?')) return;
    setIsWaLoading(true);
    setWaMessage(null);
    try {
      const res = await fetch('/api/wa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      const data = await res.json();
      setWaStatus('disconnected');
      setWaQrCode(null);
      setWaUser(null);
      setWaMessage({ type: 'success', text: 'Koneksi WhatsApp berhasil diputuskan.' });
    } catch (err) {
      setWaMessage({ type: 'error', text: 'Gagal memutuskan koneksi WhatsApp.' });
    } finally {
      setIsWaLoading(false);
    }
  };

  const handleSaveWANumber = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsWaLoading(true);
    setWaMessage(null);
    try {
      const res = await fetch('/api/wa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_settings',
          targetPhone: waTargetPhone,
          failThreshold: 4,
        }),
      });
      if (res.ok) {
        setWaMessage({ type: 'success', text: 'Nomor WhatsApp notifikasi berhasil disimpan!' });
        setTimeout(() => setWaMessage(null), 3500);
      } else {
        setWaMessage({ type: 'error', text: 'Gagal menyimpan nomor WhatsApp.' });
      }
    } catch (err) {
      setWaMessage({ type: 'error', text: 'Terjadi kesalahan saat menyimpan nomor.' });
    } finally {
      setIsWaLoading(false);
    }
  };

  const handleTestSendWA = async () => {
    if (!waTargetPhone) {
      setWaMessage({ type: 'error', text: 'Silakan isi nomor WhatsApp penerima terlebih dahulu.' });
      return;
    }
    if (waStatus !== 'connected') {
      setWaMessage({ type: 'error', text: 'WhatsApp belum terhubung. Silakan scan barcode terlebih dahulu.' });
      return;
    }

    setIsTestingWa(true);
    setWaMessage(null);
    try {
      const res = await fetch('/api/wa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_send',
          targetPhone: waTargetPhone,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWaMessage({ type: 'success', text: '✓ Pesan uji coba berhasil terkirim ke WhatsApp Anda!' });
      } else {
        setWaMessage({ type: 'error', text: data.error || 'Gagal mengirim pesan uji coba.' });
      }
    } catch (err: any) {
      setWaMessage({ type: 'error', text: 'Gagal menghubungi server untuk mengirim pesan.' });
    } finally {
      setIsTestingWa(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      try {
        const file = e.target.files[0];
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        if (userId) {
          formDataUpload.append('userId', userId);
        }
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload
        });
        
        if (res.ok) {
          const newUrl = await getProfilePictureUrl(`profile-${userId}.jpg`);
          if (newUrl) {
            setProfilePic(newUrl);
            setImgError(false);
          }
        } else {
          const errData = await res.json();
          alert(`Gagal mengunggah foto profil: ${errData.error || 'Unknown error'}`);
        }
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const { error } = await supabase.auth.updateUser({
      data: { 
        full_name: formData.fullName, 
        nickname: formData.nickname 
      }
    });
    
    setIsSaving(false);
    
    if (!error) {
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2500);
    } else {
      alert("Gagal menyimpan: " + error.message);
    }
  };

  return (
    <>
      {/* 1. Profile Card */}
      <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem", padding: "3rem 2rem" }}>
        <div style={{ position: "relative", width: "140px", height: "140px" }}>
          <div style={{ width: "140px", height: "140px", borderRadius: "50%", backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", fontSize: "4rem", fontWeight: "bold", overflow: "hidden", position: "relative" }}>
            {isUploading && (
              <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255, 255, 255, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
                <div className="spinner" style={{ width: "30px", height: "30px", border: "3px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              </div>
            )}
            {profilePic && !imgError ? (
              <img 
                src={profilePic} 
                alt="Profile" 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                onError={() => setImgError(true)}
              />
            ) : (
              formData.nickname.charAt(0).toUpperCase()
            )}
          </div>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            style={{ display: "none" }} 
            onChange={handleFileChange} 
          />
          <button 
            className="btn-icon" 
            onClick={() => fileInputRef.current?.click()}
            style={{ position: "absolute", bottom: "5px", right: "5px", width: "40px", height: "40px", backgroundColor: "#3b82f6", color: "white", border: "none", boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.5)", cursor: "pointer" }}
          >
            <IconCamera size={20} />
          </button>
        </div>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <h3 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: 0 }}>{formData.fullName}</h3>
          <p style={{ color: "#6b7280", fontSize: "1rem", margin: 0 }}>{formData.email}</p>
        </div>
      </div>

      {/* 2. Form Card: Edit Data Pribadi */}
      <div className="card">
        <div className="card-header" style={{ marginBottom: "1.5rem" }}>
          <div className="card-title">
            <IconSettings size={20} color="#3b82f6" />
            Edit Data Pribadi
          </div>
        </div>
        
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>Nama Lengkap</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: "1rem", color: "#9ca3af" }}>
                <IconUser size={18} />
              </div>
              <input 
                type="text" 
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb", outline: "none", fontSize: "0.875rem", fontFamily: "inherit" }}
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>Nama Panggilan</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: "1rem", color: "#9ca3af" }}>
                <IconUser size={18} />
              </div>
              <input 
                type="text" 
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb", outline: "none", fontSize: "0.875rem", fontFamily: "inherit" }}
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>Email (Gmail)</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: "1rem", color: "#9ca3af" }}>
                <IconMail size={18} />
              </div>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb", outline: "none", fontSize: "0.875rem", fontFamily: "inherit" }}
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>Password</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: "1rem", color: "#9ca3af" }}>
                <IconLock size={18} />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={{ width: "100%", padding: "0.75rem 2.5rem 0.75rem 2.5rem", borderRadius: "0.5rem", border: "1px solid #e5e7eb", outline: "none", fontSize: "0.875rem", fontFamily: "inherit" }}
                required
              />
              <div 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", right: "1rem", color: "#9ca3af", cursor: "pointer" }}
              >
                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </div>
            </div>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={isSaving}>
              <IconCheck size={18} /> {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
          
        </form>
      </div>

      {/* 3. WhatsApp Baileys & Security Notification Section (TARUH DI BAWAH SENDIRI) */}
      <div 
        className="card" 
        style={{ 
          gridColumn: "1 / -1", 
          display: "flex", 
          flexDirection: "column", 
          gap: "1.5rem",
          marginTop: "0.5rem",
          border: "1px solid #e2e8f0"
        }}
      >
        {/* Header Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ 
              backgroundColor: "#25d366", 
              color: "white", 
              width: "42px", 
              height: "42px", 
              borderRadius: "12px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              boxShadow: "0 4px 10px rgba(37, 211, 102, 0.3)"
            }}>
              <IconBrandWhatsapp size={26} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Koneksi WhatsApp & Notifikasi Keamanan (Baileys)
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0.25rem 0 0 0" }}>
                Scan barcode untuk menautkan bot WhatsApp dan tentukan nomor tujuan alert ketika ada aktivitas RFID mencurigakan.
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            {waStatus === 'connected' && (
              <span style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "0.4rem", 
                backgroundColor: "#dcfce7", 
                color: "#15803d", 
                fontWeight: 600, 
                fontSize: "0.85rem", 
                padding: "0.4rem 0.85rem", 
                borderRadius: "9999px" 
              }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#16a34a" }}></span>
                WhatsApp Terhubung
              </span>
            )}
            {waStatus === 'qr' && (
              <span style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "0.4rem", 
                backgroundColor: "#e0f2fe", 
                color: "#0369a1", 
                fontWeight: 600, 
                fontSize: "0.85rem", 
                padding: "0.4rem 0.85rem", 
                borderRadius: "9999px" 
              }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#0284c7", animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }}></span>
                Menunggu Scan Barcode
              </span>
            )}
            {waStatus === 'connecting' && (
              <span style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "0.4rem", 
                backgroundColor: "#fef3c7", 
                color: "#b45309", 
                fontWeight: 600, 
                fontSize: "0.85rem", 
                padding: "0.4rem 0.85rem", 
                borderRadius: "9999px" 
              }}>
                Menghubungkan...
              </span>
            )}
            {waStatus === 'disconnected' && (
              <span style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "0.4rem", 
                backgroundColor: "#f1f5f9", 
                color: "#64748b", 
                fontWeight: 600, 
                fontSize: "0.85rem", 
                padding: "0.4rem 0.85rem", 
                borderRadius: "9999px" 
              }}>
                Belum Terhubung
              </span>
            )}
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {waMessage && (
          <div style={{
            padding: "0.875rem 1.25rem",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            backgroundColor: waMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: waMessage.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${waMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`
          }}>
            {waMessage.type === 'success' ? <IconCheck size={18} /> : <IconAlertTriangle size={18} />}
            {waMessage.text}
          </div>
        )}

        {/* 2-Columns Grid: Left = Barcode, Right = WA Notification Number */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
          gap: "2rem",
          alignItems: "stretch"
        }}>
          
          {/* KOLOM KIRI: SISTEM BARCODE UNTUK CONNECT WA */}
          <div style={{ 
            backgroundColor: "#f8fafc", 
            border: "1px solid #e2e8f0", 
            borderRadius: "0.875rem", 
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1.25rem",
            textAlign: "center"
          }}>
            <div style={{ width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <IconQrcode size={20} color="#25d366" />
                <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "#1e293b", margin: 0 }}>
                  Scan Barcode WhatsApp
                </h4>
              </div>
              <p style={{ fontSize: "0.825rem", color: "#64748b", margin: 0 }}>
                Tautkan WhatsApp Anda dengan memindai kode QR di bawah menggunakan aplikasi WhatsApp di HP.
              </p>
            </div>

            {/* QR Box Container */}
            <div style={{
              width: "230px",
              height: "230px",
              backgroundColor: "white",
              border: "2px dashed #cbd5e1",
              borderRadius: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
            }}>
              {waStatus === 'connected' ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "1rem" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                    <IconBrandWhatsapp size={36} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: "#166534", margin: 0, fontSize: "0.95rem" }}>
                      WhatsApp Aktif!
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
                      {waUser?.name || waUser?.id?.split(':')[0] || 'Nomor bot siap kirim notifikasi'}
                    </p>
                  </div>
                </div>
              ) : waStatus === 'qr' && waQrCode ? (
                <img 
                  src={waQrCode} 
                  alt="QR Code WhatsApp" 
                  style={{ width: "100%", height: "100%", objectFit: "contain", padding: "8px" }} 
                />
              ) : isWaLoading || waStatus === 'connecting' ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                  <div className="spinner" style={{ width: "36px", height: "36px", border: "3px solid #25d366", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Membuat Barcode QR...</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "1rem" }}>
                  <IconQrcode size={48} color="#94a3b8" />
                  <span style={{ fontSize: "0.825rem", color: "#64748b" }}>
                    Klik tombol di bawah untuk menampilkan barcode
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons for QR */}
            <div style={{ display: "flex", gap: "0.75rem", width: "100%", justifyContent: "center" }}>
              {waStatus === 'connected' ? (
                <button 
                  type="button" 
                  onClick={handleDisconnectWA}
                  disabled={isWaLoading}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    gap: "0.5rem",
                    padding: "0.6rem 1.25rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #fca5a5",
                    backgroundColor: "#fef2f2",
                    color: "#dc2626",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  <IconTrash size={16} /> Putuskan Koneksi
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={handleConnectWA}
                  disabled={isWaLoading}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    gap: "0.5rem",
                    padding: "0.65rem 1.5rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    backgroundColor: "#25d366",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(37, 211, 102, 0.3)"
                  }}
                >
                  <IconRefresh size={16} className={isWaLoading ? "animate-spin" : ""} />
                  {waStatus === 'qr' ? 'Muat Ulang Barcode' : 'Mulai / Tampilkan Barcode'}
                </button>
              )}
            </div>
          </div>

          {/* KOLOM KANAN: NOMOR WA TUJUAN NOTIFIKASI & LOGIKA KEAMANAN */}
          <div style={{ 
            backgroundColor: "#f8fafc", 
            border: "1px solid #e2e8f0", 
            borderRadius: "0.875rem", 
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "1.25rem"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <IconPhone size={20} color="#3b82f6" />
                <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "#1e293b", margin: 0 }}>
                  Nomor WhatsApp Penerima Notifikasi
                </h4>
              </div>
              <p style={{ fontSize: "0.825rem", color: "#64748b", margin: 0 }}>
                Masukkan nomor WhatsApp Anda yang akan menerima pesan peringatan secara otomatis.
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSaveWANumber} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                  Nomor WhatsApp (Contoh: 0857... atau 62857...)
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: "1rem", color: "#9ca3af" }}>
                    <IconPhone size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Contoh: 085792151560"
                    value={waTargetPhone}
                    onChange={(e) => setWaTargetPhone(e.target.value)}
                    style={{ 
                      width: "100%", 
                      padding: "0.75rem 1rem 0.75rem 2.5rem", 
                      borderRadius: "0.5rem", 
                      border: "1px solid #cbd5e1", 
                      backgroundColor: "white",
                      outline: "none", 
                      fontSize: "0.875rem", 
                      fontFamily: "inherit" 
                    }}
                    required
                  />
                </div>
              </div>

              {/* Security Rule Card Info */}
              <div style={{ 
                backgroundColor: "#eff6ff", 
                border: "1px solid #bfdbfe", 
                borderRadius: "0.625rem", 
                padding: "0.875rem 1rem",
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-start"
              }}>
                <div style={{ color: "#2563eb", marginTop: "2px" }}>
                  <IconShield size={20} />
                </div>
                <div style={{ fontSize: "0.8rem", color: "#1e40af", lineHeight: 1.45 }}>
                  <strong>Logika Peringatan Otomatis:</strong>
                  <br />
                  Ketika sensor RFID mendeteksi <strong>lebih dari 4x percobaan tap yang gagal</strong> (kartu asing / tidak terdaftar) dalam 5 menit, sistem akan langsung mengirimkan pesan darurat ke nomor WhatsApp di atas!
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isWaLoading}
                  style={{ flex: 1, minWidth: "140px", padding: "0.65rem 1rem", fontSize: "0.875rem" }}
                >
                  <IconCheck size={18} /> Simpan Nomor
                </button>
                
                <button 
                  type="button"
                  onClick={handleTestSendWA}
                  disabled={isTestingWa || waStatus !== 'connected'}
                  style={{ 
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    padding: "0.65rem 1rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #cbd5e1",
                    backgroundColor: waStatus === 'connected' ? "white" : "#f1f5f9",
                    color: waStatus === 'connected' ? "#0f172a" : "#94a3b8",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: waStatus === 'connected' ? "pointer" : "not-allowed"
                  }}
                  title={waStatus !== 'connected' ? "Hubungkan WhatsApp terlebih dahulu untuk melakukan tes" : "Kirim pesan uji coba"}
                >
                  <IconSend size={16} color={waStatus === 'connected' ? "#25d366" : "#94a3b8"} />
                  {isTestingWa ? 'Mengirim...' : 'Kirim Pesan Uji Coba'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            padding: '2rem',
            animation: 'modalSlideIn 0.3s ease-out forwards'
          }}>
            <DotLottieReact
              autoplay
              loop={true}
              src="/success-check.lottie"
              style={{ height: '150px', width: '150px' }}
            />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '1rem', color: '#111827' }}>
              Berhasil Disimpan!
            </h3>
            <p style={{ color: '#6b7280', marginTop: '0.5rem', textAlign: 'center' }}>
              Data profil Anda telah berhasil diperbarui.
            </p>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes modalSlideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
    </>
  );
}
