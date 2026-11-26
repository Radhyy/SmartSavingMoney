import { createClient } from '@supabase/supabase-js';

export interface WAConfig {
  targetPhone: string;
  failThreshold: number;
}

export interface WAState {
  status: 'disconnected' | 'connecting' | 'qr' | 'connected';
  qrCode: string | null;
  user: { id?: string; name?: string } | null;
  targetPhone: string;
  failThreshold: number;
  lastError: string | null;
}

// URL VPS Baileys Engine (Always-on di VPS Anda)
const WA_GATEWAY_URL = process.env.WA_GATEWAY_URL || 'http://203.194.113.165:3005';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
let supabase: any = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Error creating Supabase client in WA:', err);
  }
}

export function getWAConfig(): WAConfig {
  return { targetPhone: '', failThreshold: 4 };
}

export async function getTargetPhone(): Promise<string> {
  if (supabase) {
    try {
      const { data: adminCards } = await supabase
        .from('rfid_cards')
        .select('phone_number')
        .not('phone_number', 'is', null)
        .limit(1);
      if (adminCards && adminCards.length > 0 && adminCards[0].phone_number) {
        return adminCards[0].phone_number;
      }
    } catch {}
  }
  return '085792151560';
}

export async function saveWAConfig(config: Partial<WAConfig>): Promise<WAConfig> {
  const targetPhone = config.targetPhone || '';
  if (targetPhone && supabase) {
    try {
      const { data: cards } = await supabase.from('rfid_cards').select('id');
      if (cards && cards.length > 0) {
        for (const card of cards) {
          await supabase
            .from('rfid_cards')
            .update({ phone_number: targetPhone })
            .eq('id', card.id);
        }
      }
    } catch (dbErr) {
      console.error('Error syncing phone to Supabase:', dbErr);
    }
  }
  return { targetPhone, failThreshold: config.failThreshold || 4 };
}

export async function getWhatsAppStatus(): Promise<WAState> {
  const phone = await getTargetPhone();
  try {
    const res = await fetch(`${WA_GATEWAY_URL}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      return {
        status: data.status,
        qrCode: data.qrCode,
        user: data.user,
        targetPhone: phone,
        failThreshold: 4,
        lastError: null,
      };
    }
  } catch (error: any) {
    console.error('Gagal menghubungi WA Gateway di VPS:', error);
    return {
      status: 'disconnected',
      qrCode: null,
      user: null,
      targetPhone: phone,
      failThreshold: 4,
      lastError: 'Tidak dapat terhubung ke WA Gateway di VPS',
    };
  }

  return {
    status: 'disconnected',
    qrCode: null,
    user: null,
    targetPhone: phone,
    failThreshold: 4,
    lastError: null,
  };
}

export async function initWhatsApp(forceRestart?: boolean): Promise<WAState> {
  try {
    await fetch(`${WA_GATEWAY_URL}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Error connect WA on VPS:', e);
  }
  return await getWhatsAppStatus();
}

export async function disconnectWhatsApp(): Promise<void> {
  try {
    await fetch(`${WA_GATEWAY_URL}/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Error disconnect WA on VPS:', e);
  }
}

export async function sendWhatsAppMessage(targetNumber: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${WA_GATEWAY_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: targetNumber, message }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true };
    }
    return { success: false, error: data.error || 'Gagal mengirim pesan dari VPS' };
  } catch (err: any) {
    console.error('Error sending WA message via VPS:', err);
    return { success: false, error: err?.message || 'Gagal terhubung ke service WA di VPS' };
  }
}
