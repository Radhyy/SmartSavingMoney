"use client";

import React, { useState, useEffect } from "react";
import { 
  IconUser, 
  IconMail, 
  IconLock, 
  IconCamera, 
  IconEye, 
  IconEyeOff, 
  IconSettings,
  IconCheck
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
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    email: '',
    password: ''
  });

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
        {/* Profile Card */}
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

        {/* Form Card */}
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
