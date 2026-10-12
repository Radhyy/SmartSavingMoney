// Script untuk mensimulasikan alat ESP32 menempelkan kartu (Testing)
// Jalankan dengan perintah: node test-rfid.mjs

async function simulateTaps() {
  const url = "http://localhost:3000/api/rfid-tap";
  const dummyUid = "UNKNOWN_CARD_999"; // UID palsu yang tidak ada di database

  console.log("🚀 Memulai simulasi ESP32 menempelkan kartu palsu sebanyak 5 kali...\n");

  for (let i = 1; i <= 5; i++) {
    console.log(`⏱️ Melakukan Tap ke-${i}...`);
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: dummyUid })
      });

      const data = await response.json();
      console.log(`✅ Respons Server: ${JSON.stringify(data)}\n`);
      
      // Jeda 1 detik antar tap agar terlihat natural
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("❌ Gagal menghubungi server Next.js (pastikan npm run dev menyala di port 3000):", error);
    }
  }

  console.log("🎉 Selesai! Coba cek HP kamu (WhatsApp) atau tabel suspicious_activities di Supabase.");
}

simulateTaps();
