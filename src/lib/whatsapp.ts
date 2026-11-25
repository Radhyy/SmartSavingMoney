import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState 
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import path from 'path';

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
}

const AUTH_DIR = path.join(process.cwd(), 'wa-auth');
const CONFIG_FILE = path.join(process.cwd(), 'wa-config.json');

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

export function saveWAConfig(config: Partial<WAConfig>): WAConfig {
  const current = getWAConfig();
  const updated: WAConfig = {
    targetPhone: config.targetPhone !== undefined ? config.targetPhone : current.targetPhone,
    failThreshold: config.failThreshold !== undefined ? config.failThreshold : current.failThreshold,
  };
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    if (globalRef.__wa_instance) {
      globalRef.__wa_instance.targetPhone = updated.targetPhone;
    }
  } catch (e) {
    console.error('Error saving WA config:', e);
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
    };
  }
  return globalRef.__wa_instance;
}

export async function initWhatsApp(forceRestart: boolean = false): Promise<WAState> {
  const state = getGlobalState();

  if (state.sock && state.status === 'connected' && !forceRestart) {
    return state;
  }

  if (state.isStarting && !forceRestart) {
    return state;
  }

  state.isStarting = true;
  state.status = 'connecting';
  state.qrCode = null;

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
        } catch (qrErr) {
          console.error('Error creating QR data URL:', qrErr);
        }
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        state.sock = null;
        state.qrCode = null;
        state.user = null;

        if (isLoggedOut) {
          state.status = 'disconnected';
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          } catch (e) {
            console.error('Error removing auth dir:', e);
          }
        } else {
          // Reconnect otomatis jika koneksi terputus bukan karena logout
          state.status = 'disconnected';
          setTimeout(() => {
            initWhatsApp(true).catch(console.error);
          }, 3000);
        }
      } else if (connection === 'open') {
        state.status = 'connected';
        state.qrCode = null;
        state.user = sock.user || null;
      }
    });

  } catch (error) {
    console.error('Error initializing WhatsApp socket:', error);
    state.status = 'disconnected';
  } finally {
    state.isStarting = false;
  }

  return state;
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

  try {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
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

export function getWhatsAppStatus(): {
  status: 'disconnected' | 'connecting' | 'qr' | 'connected';
  qrCode: string | null;
  user: { id?: string; name?: string } | null;
  targetPhone: string;
  failThreshold: number;
} {
  const state = getGlobalState();
  const config = getWAConfig();
  return {
    status: state.status,
    qrCode: state.qrCode,
    user: state.user,
    targetPhone: config.targetPhone,
    failThreshold: config.failThreshold,
  };
}

