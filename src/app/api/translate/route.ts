import { NextResponse } from "next/server";

const GARDA_API_URL =
  process.env.GARDA_API_URL ||
  "https://iss-uitjbt.inovasiuitjbt.uk/garda-api/v1/chat/completions";
const GARDA_AUTH_KEY =
  process.env.GARDA_AUTH_KEY || "sk-garda-30f8204c5747651c99dce89d";
const GARDA_MODEL = process.env.GARDA_MODEL || "gemma4:e4b";

// Kamus cepat frasa umum (zero latency fallback / instant response)
const COMMON_PHRASES: Record<
  string,
  { arabic: string; latin: string; indonesian: string; notes?: string }
> = {
  "selamat pagi": {
    arabic: "صَبَاحُ الْخَيْرِ",
    latin: "Ṣabāḥul-khayr",
    indonesian: "Selamat pagi",
    notes: "Jawaban sapaan ini adalah صَبَاحُ النُّورِ (Ṣabāḥun-nūr - Selamat pagi juga).",
  },
  "selamat siang": {
    arabic: "نَهَارُكَ سَعِيدٌ",
    latin: "Nahāruka sa'īd",
    indonesian: "Selamat siang",
    notes: "Jawaban sapaan ini adalah سَعِيدٌ مُبَارَكٌ (Sa'īdun mubārak).",
  },
  "selamat malam": {
    arabic: "مَسَاءُ الْخَيْرِ",
    latin: "Masā'ul-khayr",
    indonesian: "Selamat sore / malam",
    notes: "Jawaban sapaan ini adalah مَسَاءُ النُّورِ (Masā'un-nūr).",
  },
  "apa kabar": {
    arabic: "كَيْفَ حَالُكَ؟",
    latin: "Kayfa ḥāluka?",
    indonesian: "Bagaimana kabarmu? (untuk laki-laki)",
    notes: "Untuk perempuan gunakan 'كَيْفَ حَالُكِ؟' (Kayfa ḥāluki?).",
  },
  "apa kabar?": {
    arabic: "كَيْفَ حَالُكَ؟",
    latin: "Kayfa ḥāluka?",
    indonesian: "Bagaimana kabarmu? (untuk laki-laki)",
    notes: "Untuk perempuan gunakan 'كَيْفَ حَالُكِ؟' (Kayfa ḥāluki?).",
  },
  "terima kasih": {
    arabic: "شُكْرًا جَزِيلًا",
    latin: "Syukran jazīlan",
    indonesian: "Terima kasih banyak",
    notes: "Jawaban terima kasih adalah عَفْوًا ('Afwan - sama-sama).",
  },
  "terima kasih banyak": {
    arabic: "شُكْرًا جَزِيلًا لَكَ",
    latin: "Syukran jazīlan laka",
    indonesian: "Terima kasih banyak kepadamu",
    notes: "Untuk perempuan gunakan 'لَكِ' (laki).",
  },
  "sama-sama": {
    arabic: "عَفْوًا، لَا شُكْرَ عَلَى وَاجِبٍ",
    latin: "'Afwan, lā syukra 'alā wājib",
    indonesian: "Sama-sama, tidak perlu berterima kasih atas suatu kewajiban",
    notes: "Ungkapan sopan membalas ucapan terima kasih.",
  },
  "berapa harganya": {
    arabic: "كَمْ سِعْرُ هَذَا؟",
    latin: "Kam si'ru hādzā?",
    indonesian: "Berapa harga ini?",
    notes: "كَمْ (berapa), سِعْرٌ (harga), هَذَا (ini untuk mudzakkar).",
  },
  "berapa harganya?": {
    arabic: "كَمْ سِعْرُ هَذَا؟",
    latin: "Kam si'ru hādzā?",
    indonesian: "Berapa harga ini?",
    notes: "كَمْ (berapa), سِعْرٌ (harga), هَذَا (ini untuk mudzakkar).",
  },
  "saya ingin belajar bahasa arab": {
    arabic: "أُرِيدُ أَنْ أَتَعَلَّمَ اللُّغَةَ الْعَرَبِيَّةَ",
    latin: "Urīdu an ata'allamal-lughatal-'arabiyyah",
    indonesian: "Saya ingin belajar bahasa Arab",
    notes: "أُرِيدُ (fi'il mudhari' dhomir anā) + أَنْ nashab + أَتَعَلَّمَ (manshub fathah).",
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      text,
      direction = "id-ar",
      sessionId = `translate-${Date.now()}`,
    } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Teks terjemahan tidak boleh kosong" },
        { status: 400 }
      );
    }

    const trimmedText = text.trim();
    const normalizedKey = trimmedText.toLowerCase();

    // 1. Cek kamus frasa instan jika arah ID ke AR
    if (direction === "id-ar" && COMMON_PHRASES[normalizedKey]) {
      return NextResponse.json({
        ...COMMON_PHRASES[normalizedKey],
        source: "phrasebook",
      });
    }

    // 2. Siapkan prompt terjemahan profesional untuk model Gemma 4 AI
    const isIdToAr = direction === "id-ar";
    const systemPrompt = `
Anda adalah Penerjemah Pakar Dwibahasa Indonesia - Arab bersertifikat ("Mutarjim Mutamayyiz").
TUGAS UTAMA:
Terjemahkan teks pengguna dari ${
      isIdToAr ? "Bahasa Indonesia ke Bahasa Arab" : "Bahasa Arab ke Bahasa Indonesia"
    }.

SYARAT MUTLAK:
1. "arabic": Teks Arab yang FASIH, ALAMI, dan WAJIB DIBERIKAN HARAKAT LENGKAP (Tasykil lengkap: Fathah, Kasrah, Dhammah, Sukun, Tasydid, Tanwin) agar sangat mudah dilafalkan dan dibaca.
2. "latin": Transliterasi bacaan Latin standar yang presisi sesuai bunyi teks Arab berharakat (misal: "Kayfa hāluka yā akhī?", "Syukran jazīlan", "Al-ḥamdu lillāh").
3. "indonesian": Terjemahan bahasa Indonesia yang wajar, komunikatif, dan akurat.
4. "notes": Penjelasan ringkas (1-2 kalimat) seputar makna kosa kata kunci (mufradat) atau kaidah tata bahasa (Nahwu/Shorof) yang relevan.

FORMAT KELUARAN (WAJIB JSON VALID TANPA MARKDOWN / TEKS LAIN):
{
  "arabic": "Teks Arab berharakat lengkap",
  "latin": "Transliterasi bacaan Latin",
  "indonesian": "Arti dalam bahasa Indonesia",
  "notes": "Penjelasan kosakata atau kaidah ringkas"
}
`;

    const userMessage = isIdToAr
      ? `Terjemahkan kalimat Indonesia ini ke bahasa Arab berharakat lengkap dan bacaan Latin:\n"${trimmedText}"`
      : `Terjemahkan kalimat Arab ini ke bahasa Indonesia, lengkapi harakatnya jika belum ada, dan berikan bacaan Latin:\n"${trimmedText}"`;

    const payload = {
      session_id: sessionId,
      model: GARDA_MODEL,
      message: userMessage,
      system_prompt: systemPrompt.trim(),
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
      console.error("Garda Translate upstream error:", upstreamRes.status);
      throw new Error(`Upstream API failed with status ${upstreamRes.status}`);
    }

    const data = await upstreamRes.json();
    const rawResponse = data.response || data.message || "";

    // Bersihkan output JSON dari markdown codeblock jika ada
    let cleanJson = rawResponse.trim();
    if (cleanJson.includes("```")) {
      cleanJson = cleanJson
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
    }

    try {
      const parsed = JSON.parse(cleanJson);
      return NextResponse.json({
        arabic: parsed.arabic || trimmedText,
        latin: parsed.latin || "",
        indonesian: parsed.indonesian || parsed.translation || trimmedText,
        notes: parsed.notes || "",
        source: "ai",
      });
    } catch (parseError) {
      console.warn("JSON parse fallback, attempting regex extraction:", parseError);

      // Regex fallback extraction
      const arMatch = rawResponse.match(/"arabic"\s*:\s*"([^"]+)"/i);
      const ltMatch = rawResponse.match(/"latin"\s*:\s*"([^"]+)"/i);
      const idMatch = rawResponse.match(/"indonesian"\s*:\s*"([^"]+)"/i);
      const ntMatch = rawResponse.match(/"notes"\s*:\s*"([^"]+)"/i);

      if (arMatch || idMatch) {
        return NextResponse.json({
          arabic: arMatch ? arMatch[1] : trimmedText,
          latin: ltMatch ? ltMatch[1] : "",
          indonesian: idMatch ? idMatch[1] : trimmedText,
          notes: ntMatch ? ntMatch[1] : "",
          source: "ai-extracted",
        });
      }

      // Final fallback if raw text was returned
      return NextResponse.json({
        arabic: isIdToAr ? trimmedText : rawResponse,
        latin: "",
        indonesian: isIdToAr ? rawResponse : trimmedText,
        notes: "",
        source: "raw",
      });
    }
  } catch (err: any) {
    console.error("Translate route error:", err);
    return NextResponse.json(
      {
        error: "Gagal memproses terjemahan saat ini",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
