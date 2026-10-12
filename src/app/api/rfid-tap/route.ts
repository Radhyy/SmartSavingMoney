import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Ganti atau set melalui .env.local
const WA_SESSION_ID = process.env.WA_SESSION_ID || "";

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
    // LOGIKA AKTIVITAS MENCURIGAKAN (UNKNOWN)
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

    // Jika mencapai kelipatan 5 (5, 10, 15, dst)
    if (totalUnknown > 0 && totalUnknown % 5 === 0) {
      
      // Ambil semua nomor HP admin dari database
      const { data: adminCards } = await supabase
        .from('rfid_cards')
        .select('phone_number')
        .not('phone_number', 'is', null);

      let sentTo = 0;
      
      if (adminCards && adminCards.length > 0) {
        // Kirim pesan WA ke setiap nomor
        for (const admin of adminCards) {
          if (admin.phone_number) {
            try {
              // Pastikan format nomor diawali 62 sesuai aturan API WaveBot
              let formattedPhone = admin.phone_number.replace(/\D/g, '');
              if (formattedPhone.startsWith('0')) {
                formattedPhone = '62' + formattedPhone.substring(1);
              }

              await fetch("http://localhost:3001/api/wa/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sessionId: WA_SESSION_ID,
                  number: formattedPhone,
                  message: `🚨 *PERINGATAN KEAMANAN!*\n\nAda aktivitas mencurigakan di Smart Tabungan Anda.\nTerdapat ${totalUnknown} kali percobaan tap menggunakan kartu yang tidak dikenal dalam 5 menit terakhir!\n\nMohon segera periksa tabungan Anda.`
                })
              });
              sentTo++;
            } catch (e) {
              console.error("Gagal tembak API WA", e);
            }
          }
        }
      }

      // Catat ke database bahwa kita sudah mendeteksi & mengingatkan
      await supabase.from('suspicious_activities').insert([{
        card_uid: uid,
        type: 'UNKNOWN_CARD_SPAM',
        attempts: totalUnknown,
        detail: `Terkirim ke ${sentTo} nomor WA`
      }]);
    }

    // Kembalikan status ditolak ke ESP32
    return NextResponse.json({ success: true, access: 'DENIED', message: 'Kartu tidak terdaftar' });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
