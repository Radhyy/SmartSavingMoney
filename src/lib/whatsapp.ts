import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState 
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createClient } from '@supabase/supabase-js';

export interface WAConfig {
  targetPhone: string;
  failThreshold: number;
}

export interface WAState {
  sock: any | null;
  status: 'disconnected' | 'connecting' | 'qr' | 'connected';
  qrCode: string | null;
  user: { id?: string; name?: string } | null;
  targetPhone: string;
  isStarting: boolean;
  lastError: string | null;
}

function getWritableBaseDir(): string {
  // Selalu gunakan os.tmpdir() di lingkungan serverless / production Netlify / AWS Lambda
  if (
    process.env.NETLIFY ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.VERCEL ||
    process.env.NODE_ENV === 'production'
  ) {
    return os.tmpdir();
  }
  try {
    const testPath = path.join(process.cwd(), '.write_test_' + Date.now());
    fs.writeFileSync(testPath, '1');
    fs.unlinkSync(testPath);
    return process.cwd();
  } catch {
    return os.tmpdir();
  }
}

const BASE_DIR = getWritableBaseDir();
const AUTH_DIR = path.join(BASE_DIR, 'wa-auth');
const CONFIG_FILE = path.join(BASE_DIR, 'wa-config.json');

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

// Simpan state di globalThis agar tidak di-reset saat HMR di development
const globalRef = globalThis as unknown as { __wa_instance?: WAState };

export function getWAConfig(): WAConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return {
        targetPhone: data.targetPhone || '',
        failThreshold: data.failThreshold || 4,
      };
    }
  } catch (e) {
    console.error('Error reading WA config:', e);
  }
  return { targetPhone: '', failThreshold: 4 };
}

export async function saveWAConfig(config: Partial<WAConfig>): Promise<WAConfig> {
  const current = getWAConfig();
  const updated: WAConfig = {
    targetPhone: config.targetPhone !== undefined ? config.targetPhone : current.targetPhone,
    failThreshold: config.failThreshold !== undefined ? config.failThreshold : current.failThreshold,
  };

  try {
    if (!fs.existsSync(BASE_DIR)) {
      fs.mkdirSync(BASE_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    if (globalRef.__wa_instance) {
      globalRef.__wa_instance.targetPhone = updated.targetPhone;
    }
  } catch (e) {
    console.error('Error saving local WA config:', e);
  }

  // Simpan juga ke Supabase rfid_cards agar tersimpan di cloud & tidak hilang di Netlify
  if (updated.targetPhone && supabase) {
    try {
      const { data: cards } = await supabase.from('rfid_cards').select('id').limit(1);
      if (cards && cards.length > 0) {
        await supabase
          .from('rfid_cards')
          .update({ phone_number: updated.targetPhone })
          .eq('id', cards[0].id);
      }
    } catch (dbErr) {
      console.error('Error syncing phone to Supabase:', dbErr);
    }
  }

  return updated;
}

function getGlobalState(): WAState {
  if (!globalRef.__wa_instance) {
    const config = getWAConfig();
    globalRef.__wa_instance = {
      sock: null,
      status: 'disconnected',
      qrCode: null,
      user: null,
      targetPhone: config.targetPhone,
      isStarting: false,
      lastError: null,
    };
  }
  return globalRef.__wa_instance;
}

export async function initWhatsApp(forceRestart: boolean = false): Promise<WAState> {
  const state = getGlobalState();

  if (state.sock && state.status === 'connected' && !forceRestart) {
    return state;
  }

  state.isStarting = true;
  state.status = 'connecting';
  state.lastError = null;

  return new Promise(async (resolve) => {
    let hasResolved = false;
    const safeResolve = () => {
      if (!hasResolved) {
        hasResolved = true;
        state.isStarting = false;
        resolve(state);
      }
    };

    // Timeout maksimal 12 detik agar tidak melebihi timeout Netlify function
    const timeout = setTimeout(() => {
      if (!hasResolved) {
        if (!state.qrCode && state.status !== 'connected') {
          state.status = 'disconnected';
          state.lastError = 'Waktu inisialisasi habis (Timeout koneksi ke server WhatsApp)';
        }
        safeResolve();
      }
    }, 12000);

    try {
      if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
      }

      const { state: authState, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

      // Tutup socket lama jika ada
      if (state.sock) {
        try {
          state.sock.ev.removeAllListeners('connection.update');
          state.sock.ev.removeAllListeners('creds.update');
          state.sock.end(undefined);
        } catch (err) {
          // Abaikan error saat cleanup socket lama
        }
        state.sock = null;
      }

      const sock = makeWASocket({
        auth: authState,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['Smart Tabungan', 'Chrome', '1.0.0'],
        connectTimeoutMs: 15000,
        keepAliveIntervalMs: 10000,
      });

      state.sock = sock;

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const qrUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 8 });
            state.qrCode = qrUrl;
            state.status = 'qr';
            state.lastError = null;
            clearTimeout(timeout);
            safeResolve();
          } catch (qrErr: any) {
            console.error('Error creating QR data URL:', qrErr);
            state.lastError = qrErr?.message || 'Gagal generate barcode QR';
          }
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const errorMsg = (lastDisconnect?.error as any)?.message || 'Koneksi ditutup';
          state.lastError = `Terputus (${statusCode || 'unknown'}): ${errorMsg}`;

          const isLoggedOut = statusCode === DisconnectReason.loggedOut;

          state.sock = null;
          state.user = null;

          if (isLoggedOut) {
            state.status = 'disconnected';
            state.qrCode = null;
            try {
              if (fs.existsSync(AUTH_DIR)) {
                fs.rmSync(AUTH_DIR, { recursive: true, force: true });
              }
            } catch (e) {}
          } else {
            // Jika belum dapat QR
            if (!state.qrCode) {
              state.status = 'disconnected';
            }
          }
          clearTimeout(timeout);
          safeResolve();
        } else if (connection === 'open') {
          state.status = 'connected';
          state.qrCode = null;
          state.user = sock.user || null;
          state.lastError = null;
          clearTimeout(timeout);
          safeResolve();
        }
      });

    } catch (error: any) {
      console.error('Error initializing WhatsApp socket:', error);
      state.status = 'disconnected';
      state.lastError = error?.message || String(error);
      clearTimeout(timeout);
      safeResolve();
    }
  });
}

export async function disconnectWhatsApp(): Promise<void> {
  const state = getGlobalState();
  if (state.sock) {
    try {
      await state.sock.logout();
    } catch (e) {
      try {
        state.sock.end(undefined);
      } catch {}
    }
  }
  state.sock = null;
  state.status = 'disconnected';
  state.qrCode = null;
  state.user = null;
  state.lastError = null;

  try {
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
  } catch (e) {
    console.error('Error removing auth dir on disconnect:', e);
  }
}

export function formatWhatsAppNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  if (!cleaned.endsWith('@s.whatsapp.net')) {
    cleaned = cleaned + '@s.whatsapp.net';
  }
  return cleaned;
}

export async function sendWhatsAppMessage(targetNumber: string, message: string): Promise<{ success: boolean; error?: string }> {
  const state = getGlobalState();

  if (!state.sock || state.status !== 'connected') {
    return { success: false, error: 'WhatsApp belum terhubung. Silakan scan barcode di pengaturan.' };
  }

  try {
    const jid = formatWhatsAppNumber(targetNumber);
    await state.sock.sendMessage(jid, { text: message });
    return { success: true };
  } catch (error: any) {
    console.error('Error sending WA message:', error);
    return { success: false, error: error?.message || 'Gagal mengirim pesan WhatsApp' };
  }
}

export async function getWhatsAppStatus(): Promise<{
  status: 'disconnected' | 'connecting' | 'qr' | 'connected';
  qrCode: string | null;
  user: { id?: string; name?: string } | null;
  targetPhone: string;
  failThreshold: number;
  lastError: string | null;
}> {
  const state = getGlobalState();
  const config = getWAConfig();
  
  // Jika config lokal kosong, coba ambil dari nomor HP admin di Supabase
  let phone = config.targetPhone;
  if (!phone && supabase) {
    try {
      const { data: adminCards } = await supabase
        .from('rfid_cards')
        .select('phone_number')
        .not('phone_number', 'is', null)
        .limit(1);
      if (adminCards && adminCards.length > 0 && adminCards[0].phone_number) {
        phone = adminCards[0].phone_number;
      }
    } catch {}
  }

  return {
    status: state.status,
    qrCode: state.qrCode,
    user: state.user,
    targetPhone: phone,
    failThreshold: config.failThreshold,
    lastError: state.lastError,
  };
}
