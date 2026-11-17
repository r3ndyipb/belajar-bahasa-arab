import { NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

// Cache audio dalam memori agar kata/kalimat yang sering diputar bersuara instan tanpa jeda
const audioCache = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 250;

function cacheAudio(key: string, buffer: Buffer) {
  if (audioCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = audioCache.keys().next().value;
    if (oldestKey) audioCache.delete(oldestKey);
  }
  audioCache.set(key, buffer);
}

// Fungsi bantu membagi teks panjang menjadi potongan <= 85 karakter untuk fallback Google TTS
function splitTextIntoNaturalChunks(text: string, maxLen = 85): string[] {
  if (!text || text.trim().length === 0) return [];
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

// Generator suara laki-laki menggunakan Microsoft Edge Neural TTS
async function generateEdgeTtsMale(
  text: string,
  voice: string,
  timeoutMs = 9000
): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const timer = setTimeout(() => {
      try {
        tts.close();
      } catch (_) {}
      reject(new Error("Timeout generating Edge TTS male speech"));
    }, timeoutMs);

    audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    audioStream.on("end", () => {
      clearTimeout(timer);
      try {
        tts.close();
      } catch (_) {}
      resolve(Buffer.concat(chunks));
    });
    audioStream.on("error", (err: Error) => {
      clearTimeout(timer);
      try {
        tts.close();
      } catch (_) {}
      reject(err);
    });
  });
}

export async function POST(req: Request) {
  try {
    const { text, lang = "ar", voice } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Teks tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Bersihkan teks dari karakter markdown dan simbol formatting
    const cleanedText = text
      .replace(/[*_#`~[\]()✓✗]/g, "")
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

    // Suara default laki-laki:
    // Bahasa Arab: "ar-SA-HamedNeural" (Hamed - Suara Laki-laki Ustadz / Guru Arab Saudi)
    // Bahasa Indonesia: "id-ID-ArdiNeural" (Ardi - Suara Laki-laki Indonesia)
    const selectedMaleVoice =
      voice ||
      (targetLang === "ar" ? "ar-SA-HamedNeural" : "id-ID-ArdiNeural");

    const cacheKey = `${selectedMaleVoice}:${cleanedText}`;
    if (audioCache.has(cacheKey)) {
      const cachedBuf = audioCache.get(cacheKey)!;
      return new NextResponse(new Uint8Array(cachedBuf), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": cachedBuf.length.toString(),
          "Cache-Control": "public, max-age=86400",
          "X-Audio-Source": "cache-male",
        },
      });
    }

    // =========================================================================
    // 1. PRIORITAS UTAMA: MICROSOFT EDGE NEURAL TTS (SUARA LAKI-LAKI HAMED & ARDI)
    // =========================================================================
    try {
      const maleAudioBuffer = await generateEdgeTtsMale(
        cleanedText,
        selectedMaleVoice,
        9000
      );

      if (maleAudioBuffer && maleAudioBuffer.length > 200) {
        cacheAudio(cacheKey, maleAudioBuffer);
        return new NextResponse(new Uint8Array(maleAudioBuffer), {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Length": maleAudioBuffer.length.toString(),
            "Cache-Control": "public, max-age=86400",
            "X-Audio-Source": "edge-male",
            "X-Voice-Name": selectedMaleVoice,
          },
        });
      }
    } catch (edgeErr) {
      console.warn("Edge TTS male generator warning, beralih ke fallback:", edgeErr);
    }

    // =========================================================================
    // 2. CADANGAN GOOGLE TTS MULTI-CHUNK
    // =========================================================================
    try {
      const chunks = splitTextIntoNaturalChunks(cleanedText, 85);

      if (chunks.length > 0) {
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
          cacheAudio(cacheKey, combinedBuffer);
          return new NextResponse(new Uint8Array(combinedBuffer), {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Content-Length": combinedBuffer.length.toString(),
              "Cache-Control": "public, max-age=86400",
              "X-Audio-Source": "google-fallback",
            },
          });
        }
      }
    } catch (gErr) {
      console.warn("Google TTS fallback failed:", gErr);
    }

    // 3. Fallback info ke klien untuk Web Speech API
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
