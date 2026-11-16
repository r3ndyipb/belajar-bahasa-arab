import { NextResponse } from "next/server";

const GARDA_API_URL =
  process.env.GARDA_API_URL ||
  "https://iss-uitjbt.inovasiuitjbt.uk/garda-api/v1/chat/completions";
const GARDA_AUTH_KEY =
  process.env.GARDA_AUTH_KEY || "sk-garda-30f8204c5747651c99dce89d";
const GARDA_MODEL = process.env.GARDA_MODEL || "gemma4:e4b";

const ARABIC_TUTOR_SYSTEM_PROMPT = `
Anda adalah "Mudarris AI" (مُدَرِّس الذَّكاء الاصطِناعي), seorang guru dan partner percakapan (muhadatsah) bahasa Arab interaktif, ramah, komunikatif, dan sabar untuk pembelajar dari Indonesia.

TUGAS UTAMA:
1. Membantu pengguna belajar bahasa Arab secara interaktif baik melalui teks maupun percakapan suara (kalam).
2. Jika pengguna menyapa atau bertanya, balaslah dalam bahasa Arab yang fasih dan alami.
3. Selalu sertakan HARAKAT LENGKAP (Tasykil: fathah, kasrah, dhammah, sukun, tasydid, tanwin) pada teks Arab agar mudah dilafalkan dan dibaca oleh pembelajar.
4. Berikan format respon yang rapi dan terstruktur:
   - 🗣️ **Kalam Arab (العربية)**: Teks kalimat Arab berharakat jelas.
   - 📖 **Transliterasi**: Ejaan baca Latin (misal: "As-salāmu 'alaikum, kayfa hāluk?").
   - 🇮🇩 **Terjemahan**: Arti bahasa Indonesia yang wajar dan mudah dipahami.
   - 💡 **Mufradat & Catatan** (jika ada): 1-3 kosakata penting atau kaidah Nahwu/Shorof ringkas yang relevan. Jika ada tasrif atau perbandingan kata, gunakan TABEL MARKDOWN yang rapi.
   - 🎯 **Rekomendasi Jawaban Pengguna** (Berikan 2 sampai 3 pilihan kalimat yang bisa diucapkan pembelajar untuk membalas kalam Anda):
     * Opsi 1:
       - Arab: [Teks Arab berharakat]
       - Latin: [Transliterasi bacaan Latin]
       - Arti: [Terjemahan bahasa Indonesia]
     * Opsi 2:
       - Arab: [Teks Arab berharakat]
       - Latin: [Transliterasi bacaan Latin]
       - Arti: [Terjemahan bahasa Indonesia]
5. Jika pengguna berbicara dalam bahasa Indonesia atau mencoba bahasa Arab yang kurang tepat secara tata bahasa, apresiasi usahanya lalu tunjukkan cara pengucapan atau susunan kalimat yang benar dengan sopan.
6. Hindari rumus LaTeX ($$), simbol yang membingungkan, atau escape karakter aneh. Gunakan Markdown standar yang rapi dan tabel yang presisi.
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      message,
      sessionId = `session-${Date.now()}`,
      mode = "general",
      scenarioPrompt,
      scenarioName,
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong" },
        { status: 400 }
      );
    }

    let contextualSystemPrompt = ARABIC_TUTOR_SYSTEM_PROMPT;
    if (mode === "reference") {
      contextualSystemPrompt = `
Anda adalah Pakar Referensi Bahasa Arab & Kaidah Nahwu/Shorof ("Marja' Lughawi").
TUGAS:
1. Menjawab pertanyaan pengguna yang mencari referensi tentang tata bahasa (Nahwu, Shorof, I'rab), arti kosa kata (mufradat), wazan kata kerja, terjemahan, dan contoh-contoh penggunaan kalimat.
2. Jelaskan secara sistematis, jelas, dan edukatif dalam bahasa Indonesia disertai teks Arab berharakat lengkap (tasykil).
3. Sangat dianjurkan menggunakan TABEL MARKDOWN yang rapi untuk:
   - Tasrif fi'il (Fi'il Madhi, Mudhari', Amr, Masdar, Fa'il, Maf'ul, dsb).
   - Daftar kosakata / mufradat beserta artinya.
   - Perbandingan kaidah tata bahasa, pembagian isim/fi'il/huruf, dan i'rab.
   Pastikan tabel markdown memiliki header dan pemisah yang valid, contoh:
   | Bentuk Kata | Teks Arab | Latin | Arti |
   | :--- | :--- | :--- | :--- |
   | Fi'il Madhi | كَتَبَ | Kataba | Telah menulis |
4. Format jawaban:
   - 📚 **Topik / Penjelasan**: Uraian ringkas dan padat.
   - 📊 **Tabel / Kaidah**: Sajikan dalam tabel jika memuat lebih dari 2 perbandingan kata atau contoh.
   - 📝 **Contoh Kalimat Arab**: Teks Arab berharakat + Latin + Terjemahan Indonesia.
   - 💡 **Kaidah Penting**: Rumus atau poin penting yang perlu diingat.
5. Hindari karakter aneh, escape sequence berantakan, atau rumus LaTeX ($$).
Respon ini adalah bahan referensi bacaan tanpa audio.
`;
    } else if (mode === "nahwu") {
      contextualSystemPrompt += `\nFOKUS MODE: Pengguna ingin mempelajari atau menanyakan kaidah Nahwu dan Shorof. Berikan penjelasan kaidah dengan contoh i'rab sederhana dan contoh kalimat berharakat.`;
    } else if (mode === "beginner") {
      contextualSystemPrompt += `\nFOKUS MODE: Pemula mutlak. Gunakan kalimat pendek (2-4 kata), kosakata yang sangat dasar (salam, perkenalan, anggota tubuh, angka, warna, makanan), dan berikan bimbingan pengucapan yang sangat jelas.`;
    } else if (mode === "market") {
      contextualSystemPrompt += `\nFOKUS MODE: Simulasi percakapan di pasar / belanja (فِي السُّوق). Berikan contoh tawar-menawar harga, menanyakan barang, dan hitungan uang.`;
    }

    if (
      mode !== "reference" &&
      scenarioPrompt &&
      typeof scenarioPrompt === "string" &&
      scenarioPrompt.trim()
    ) {
      contextualSystemPrompt += `\n\nSKENARIO & SUASANA PERCAKAPAN AKTIF${
        scenarioName ? ` (${scenarioName})` : ""
      }:
${scenarioPrompt.trim()}

INSTRUKSI KHUSUS SKENARIO:
1. Posisikan diri Anda (Mudarris AI) dan pengguna sesuai peran dalam situasi/suasana di atas.
2. Gunakan kosakata (mufradat) dan ungkapan Arab sehari-hari yang relevan dengan konteks ini.
3. Tetap sediakan harakat lengkap (tasykil), transliterasi Latin, arti Indonesia, dan berikan rekomendasi pilihan jawaban pengguna yang sesuai alur situasi ini.`;
    }

    const payload = {
      session_id: sessionId,
      model: GARDA_MODEL,
      message: message.trim(),
      system_prompt: contextualSystemPrompt.trim(),
    };

    const upstreamRes = await fetch(GARDA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: GARDA_AUTH_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text();
      console.error("Garda API error response:", upstreamRes.status, errText);
      return NextResponse.json(
        {
          response:
            "**عَفْوًا، حَدَثَ خَطَأٌ فِي الِاتِّصَالِ**\n*(Afwan, hadatsa khatha'un fil-ittishal)*\n\nMaaf, terjadi gangguan sementara pada koneksi server AI Garda. Silakan coba kirim kembali pesan Anda.",
          session_id: sessionId,
          model: GARDA_MODEL,
        },
        { status: 200 }
      );
    }

    const data = await upstreamRes.json();
    return NextResponse.json({
      response: data.response || data.message || "لا توجد إجابة",
      session_id: data.session_id || sessionId,
      model: data.model || GARDA_MODEL,
    });
  } catch (error) {
    console.error("Chat API route error:", error);
    return NextResponse.json(
      {
        response:
          "**عَفْوًا، حَدَثَ خَطَأٌ غَيْرُ مُتَوَقَّعٍ**\n*(Afwan, hadatsa khatha'un ghairu mutawaqqa')*\n\nMaaf, terjadi kendala teknis internal. Silakan coba sesaat lagi.",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
