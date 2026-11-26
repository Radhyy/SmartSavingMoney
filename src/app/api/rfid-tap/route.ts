import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppMessage, getTargetPhone, getWAConfig } from '@/lib/whatsapp';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'UID tidak boleh kosong' }, { status: 400 });
    }

    // 1. Cek apakah UID terdaftar di rfid_cards
    const { data: cardData } = await supabase
      .from('rfid_cards')
      .select('*')
      .eq('uid', uid)
      .single();

    const isKnown = !!cardData;
    const eventType = isKnown ? 'known' : 'unknown';

    // 2. Catat event tap ke database
    await supabase.from('rfid_events').insert([{ card_uid: uid, event: eventType }]);

    // 3. Jika Kartu Dikenal, buka solenoid (Berhasil)
    if (isKnown) {
      return NextResponse.json({ success: true, access: 'GRANTED', owner: cardData.owner_name });
    }

    // ==========================================
    // LOGIKA AKTIVITAS MENCURIGAKAN (GAGAL > 4X)
    // ==========================================
    
    // Cek ada berapa tap 'unknown' dalam 5 menit terakhir
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const { count: unknownCount } = await supabase
      .from('rfid_events')
      .select('*', { count: 'exact', head: true })
      .eq('event', 'unknown')
      .gte('created_at', fiveMinutesAgo.toISOString());

    const totalUnknown = unknownCount || 0;
    const waConfig = getWAConfig();
    const threshold = waConfig.failThreshold || 4;

    // Trigger jika percobaan gagal melebihi batas (> 4x)
    if (totalUnknown > threshold) {
      // Cek apakah sudah pernah kirim alert dalam 2 menit terakhir agar tidak spam berkali-kali
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: recentAlerts } = await supabase
        .from('suspicious_activities')
        .select('id')
        .gte('created_at', twoMinutesAgo)
        .limit(1);

      const alreadyAlertedRecently = recentAlerts && recentAlerts.length > 0;

      // Kirim alert jika belum ada alert baru dalam 2 menit terakhir, atau saat pas mencapai kelipatan 5
      if (!alreadyAlertedRecently || totalUnknown % 5 === 0) {
        const phoneList = new Set<string>();

        // 1. Ambil target phone aktif dari konfigurasi WhatsApp
        const dynamicPhone = await getTargetPhone();
        if (dynamicPhone && dynamicPhone.trim() !== '') {
          phoneList.add(dynamicPhone.trim());
        }

        // 2. Ambil semua nomor telepon admin terdaftar di tabel rfid_cards
        const { data: adminCards } = await supabase
          .from('rfid_cards')
          .select('phone_number')
          .not('phone_number', 'is', null);

        if (adminCards && adminCards.length > 0) {
          adminCards.forEach((admin) => {
            if (admin.phone_number && admin.phone_number.trim() !== '') {
              phoneList.add(admin.phone_number.trim());
            }
          });
        }

        // 3. Fallback nomor default jika belum ada yang tersimpan
        if (phoneList.size === 0) {
          phoneList.add('085792151560');
        }

        const alertMessage = 
          `🚨 *PERINGATAN KEAMANAN SMART TABUNGAN!*\n\n` +
          `Terdeteksi aktivitas mencurigakan!\n` +
          `Terdapat *${totalUnknown} kali* percobaan tap kartu RFID yang gagal (kartu tidak dikenal) dalam 5 menit terakhir!\n\n` +
          `• UID Kartu Terakhir: *${uid}*\n` +
          `• Waktu Kejadian: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n\n` +
          `⚠️ *Mohon segera periksa celengan pintar Anda!*`;

        const sentPhones: string[] = [];
        for (const phone of phoneList) {
          try {
            const sendRes = await sendWhatsAppMessage(phone, alertMessage);
            if (sendRes.success) {
              sentPhones.push(phone);
            }
          } catch (e) {
            console.error(`Gagal kirim WA ke ${phone}:`, e);
          }
        }

        // Catat ke database tabel suspicious_activities
        await supabase.from('suspicious_activities').insert([{
          card_uid: uid,
          type: 'UNKNOWN_CARD_SPAM',
          attempts: totalUnknown,
          detail: `Terkirim ke ${sentPhones.length} nomor WA: ${sentPhones.join(', ')} via Baileys`
        }]);
      }
    }

    // Kembalikan status ditolak ke ESP32
    return NextResponse.json({ success: true, access: 'DENIED', message: 'Kartu tidak terdaftar' });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
