import { NextResponse } from "next/server";

// Fungsi untuk membagi teks panjang menjadi potongan (chunks) alami <= 85 karakter
// agar tidak melebihi batasan Google Translate TTS (maks ~100 karakter per query)
function splitTextIntoNaturalChunks(text: string, maxLen = 85): string[] {
  if (!text || text.trim().length === 0) return [];

  // Pisahkan berdasarkan tanda baca kalimat Arab & Latin: . ! ? ، ؟ ؛ \n
  const rawSentences = text.split(/(?<=[.!?،؟؛\n])\s+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if ((currentChunk + " " + trimmed).trim().length <= maxLen) {
      currentChunk = (currentChunk + " " + trimmed).trim();
    } else {
      if (currentChunk) chunks.push(currentChunk);

      // Jika satu kalimat saja sudah melebihi maxLen, pisah per kata
      if (trimmed.length > maxLen) {
        const words = trimmed.split(/\s+/);
        let wordChunk = "";
        for (const w of words) {
          if ((wordChunk + " " + w).trim().length <= maxLen) {
            wordChunk = (wordChunk + " " + w).trim();
          } else {
            if (wordChunk) chunks.push(wordChunk);
            wordChunk = w;
          }
        }
        currentChunk = wordChunk;
      } else {
        currentChunk = trimmed;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

export async function POST(req: Request) {
  try {
    const { text, lang = "ar" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Teks tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Bersihkan teks dari format markdown dan formatting tidak perlu
    const cleanedText = text
      .replace(/[*_#`~[\]()]/g, "")
      .replace(/[\n\r]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanedText) {
      return NextResponse.json(
        { error: "Teks tidak valid setelah dibersihkan" },
        { status: 400 }
      );
    }

    // Cek apakah teks mengandung huruf Arab
    const hasArabic = /[\u0600-\u06FF]/.test(cleanedText);
    const targetLang = lang === "id" ? "id" : hasArabic ? "ar" : "id";

    // 1. Prioritas Utama: Google Translate TTS Native Audio dengan Multi-chunk Concatenation
    try {
      const chunks = splitTextIntoNaturalChunks(cleanedText, 85);

      if (chunks.length > 0) {
        // Ambil setiap potongan audio secara paralel
        const fetchPromises = chunks.map(async (chunk) => {
          const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${targetLang}&client=tw-ob&q=${encodeURIComponent(
            chunk
          )}`;

          const res = await fetch(googleTtsUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              Accept: "*/*",
            },
          });

          if (!res.ok) {
            throw new Error(`Google TTS chunk failed with HTTP ${res.status}`);
          }

          const buf = await res.arrayBuffer();
          return Buffer.from(buf);
        });

        const audioBuffers = await Promise.all(fetchPromises);
        const combinedBuffer = Buffer.concat(audioBuffers);

        if (combinedBuffer.length > 100) {
          return new NextResponse(combinedBuffer, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Content-Length": combinedBuffer.length.toString(),
              "Cache-Control": "public, max-age=86400",
            },
          });
        }
      }
    } catch (gErr) {
      console.warn("Google TTS multi-chunk warning, mencoba alternatif Edge TTS:", gErr);
    }

    // 2. Alternatif Cadangan: Edge TTS Endpoint (Bila server aktif)
    const EDGE_TTS_URL =
      process.env.EDGE_TTS_URL ||
      "https://iss-uitjbt.inovasiuitjbt.uk/edge-tts/v1/audio/speech";
    const EDGE_TTS_KEY = process.env.EDGE_TTS_KEY || "garda_secret_123";

    try {
      const ttsRes = await fetch(EDGE_TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${EDGE_TTS_KEY}`,
        },
        body: JSON.stringify({
          model: "tts-1",
          voice: targetLang === "ar" ? "ar-SA-HamedNeural" : "id-ID-ArdiNeural",
          input: cleanedText.slice(0, 250),
          response_format: "mp3",
        }),
      });

      const contentType = ttsRes.headers.get("content-type") || "";
      if (ttsRes.ok && contentType.includes("audio")) {
        const audioBuffer = await ttsRes.arrayBuffer();
        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    } catch (edgeErr) {
      console.warn("Edge TTS upstream error:", edgeErr);
    }

    // 3. Fallback info ke klien untuk Web Speech API jika upstream offline
    return NextResponse.json({
      success: false,
      fallback: "webspeech",
      text: cleanedText,
    });
  } catch (error) {
    console.error("TTS general error:", error);
    return NextResponse.json(
      { success: false, fallback: "webspeech" },
      { status: 500 }
    );
  }
}
