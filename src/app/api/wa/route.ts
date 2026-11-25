import { NextResponse } from 'next/server';
import { 
  getWhatsAppStatus, 
  initWhatsApp, 
  disconnectWhatsApp, 
  saveWAConfig, 
  sendWhatsAppMessage 
} from '@/lib/whatsapp';

export async function GET() {
  try {
    const status = getWhatsAppStatus();
    // Jika belum terhubung dan belum ada QR dan belum connecting, inisialisasi awal
    if (status.status === 'disconnected') {
      initWhatsApp().catch(console.error);
    }
    return NextResponse.json(getWhatsAppStatus());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'connect') {
      await initWhatsApp(true);
      return NextResponse.json({ success: true, ...getWhatsAppStatus() });
    }

    if (action === 'disconnect') {
      await disconnectWhatsApp();
      return NextResponse.json({ success: true, ...getWhatsAppStatus() });
    }

    if (action === 'save_settings') {
      const { targetPhone, failThreshold } = body;
      const updated = saveWAConfig({
        targetPhone: targetPhone !== undefined ? targetPhone : undefined,
        failThreshold: failThreshold !== undefined ? Number(failThreshold) : undefined,
      });
      return NextResponse.json({ success: true, config: updated });
    }

    if (action === 'test_send') {
      const current = getWhatsAppStatus();
      const phone = body.targetPhone || current.targetPhone;
      if (!phone) {
        return NextResponse.json({ success: false, error: 'Nomor WhatsApp belum diisi' }, { status: 400 });
      }

      const result = await sendWhatsAppMessage(
        phone,
        `🔔 *TEST NOTIFIKASI SMART TABUNGAN*\n\nWhatsApp berhasil terhubung dengan Smart Tabungan Anda!\nNotifikasi keamanan aktivitas mencurigakan (RFID gagal > 4x) akan dikirimkan ke nomor ini.`
      );

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'Pesan tes berhasil dikirim' });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

