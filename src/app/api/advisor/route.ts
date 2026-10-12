import { NextResponse } from 'next/server';

const GROQ_API_KEYS = process.env.GROQ_API_KEYS 
  ? process.env.GROQ_API_KEYS.split(',').map(k => k.trim()).filter(Boolean)
  : [];

export async function POST(req: Request) {
  try {
    const { balance, target, avgDailySavings } = await req.json();

    const remaining = target - balance;
    let estimatedDate = "Beberapa bulan lagi";
    if (avgDailySavings > 0 && remaining > 0) {
      const daysNeeded = Math.ceil(remaining / avgDailySavings);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysNeeded);
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      estimatedDate = `${targetDate.getDate()} ${months[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
    } else if (remaining <= 0) {
      estimatedDate = "Sudah Tercapai!";
    }

    const prompt = `Sebagai AI Financial Advisor untuk aplikasi Smart Tabungan, berikan satu kalimat pendek yang sangat simpel mengenai progres tabungan user dan berikan satu tips singkat. 
    Total saldo: Rp ${balance}
    Target tabungan: Rp ${target}
    Rata-rata tabung: Rp ${avgDailySavings}/hari.
    Berdasarkan perhitungan, target ini akan tercapai pada: ${estimatedDate}
    Format mirip seperti ini: "Berdasarkan pola menabungmu (rata-rata Rp ${avgDailySavings}/hari), kamu diprediksi mencapai target pada ${estimatedDate}. 💡 Tips: [Tips singkat max 10 kata]."
    Jangan pakai format markdown atau enter. Buat dalam 1 paragraf saja, bahasanya santai tapi memotivasi.`;

    for (let i = 0; i < GROQ_API_KEYS.length; i++) {
      const apiKey = GROQ_API_KEYS[i];
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-20b',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 100,
            temperature: 0.7
          })
        });

        if (res.ok) {
          const data = await res.json();
          return NextResponse.json({ advice: data.choices[0].message.content.trim() });
        }
      } catch (e) {
        console.error(`API Key ${i + 1} failed:`, e);
        // Continue to next key
      }
    }

    return NextResponse.json(
      { advice: `Berdasarkan pola menabungmu saat ini (rata-rata Rp ${avgDailySavings.toLocaleString('id-ID')}/hari), kamu diprediksi mencapai target pada ${estimatedDate}. 💡 Tips: Sisihkan uang jajan tiap hari agar target cepat tercapai.` },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
