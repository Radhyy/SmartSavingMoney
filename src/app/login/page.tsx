"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { IconMail, IconLock, IconEye, IconEyeOff, IconArrowRight } from '@tabler/icons-react';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login delay
    setTimeout(() => {
      router.push('/');
    }, 1200);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--background)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Background Elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '1.5rem',
        padding: '3rem 2rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ 
            background: 'white', 
            padding: '1rem', 
            borderRadius: '1.25rem', 
            marginBottom: '1.5rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f3f4f6'
          }}>
            <Image 
              src="/SmartTabunganLogo.png" 
              alt="Smart Tabungan Logo" 
              width={60} 
              height={60} 
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
          <h1 style={{ color: '#111827', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
            Selamat Datang
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', textAlign: 'center' }}>
            Silakan masuk ke akun Smart Tabungan Anda
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1.25rem', color: '#9ca3af' }}>
              <IconMail size={20} />
            </div>
            <input 
              type="email" 
              placeholder="Email Anda"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={{
                width: '100%',
                padding: '1rem 1rem 1rem 3.5rem',
                borderRadius: '0.75rem',
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                color: '#111827',
                outline: 'none',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.border = '1px solid #3b82f6';
                e.target.style.background = '#ffffff';
                e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid #d1d5db';
                e.target.style.background = '#f9fafb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1.25rem', color: '#9ca3af' }}>
              <IconLock size={20} />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Kata Sandi"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={{
                width: '100%',
                padding: '1rem 3.5rem 1rem 3.5rem',
                borderRadius: '0.75rem',
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                color: '#111827',
                outline: 'none',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.border = '1px solid #3b82f6';
                e.target.style.background = '#ffffff';
                e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid #d1d5db';
                e.target.style.background = '#f9fafb';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                right: '1.25rem',
                color: '#9ca3af',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.5rem' }}>
            <a href="#" style={{ color: '#3b82f6', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}>Lupa Kata Sandi?</a>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: 'none',
              background: isLoading ? '#93c5fd' : '#3b82f6',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.3s ease',
              marginTop: '0.5rem',
              boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)'
            }}
          >
            {isLoading ? (
              <div style={{ width: '20px', height: '20px', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                Masuk Sekarang
                <IconArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder {
          color: #9ca3af !important;
        }
      `}} />
    </div>
  );
}
