# 🌿 Belajar Bahasa Arab Interaktif AI (مُدَرِّس الذَّكاء الاصطِناعي)

Aplikasi 1 halaman interaktif untuk belajar percakapan Bahasa Arab (*Muhadatsah*) dan kaidah Nahwu/Shorof berbantuan AI dengan fitur bicara suara (*Voice Input & Text-to-Speech*) dan teks berharakat lengkap.

---

## 🌟 Fitur Utama

1. **Percakapan Dua Arah dengan AI (Mudarris AI)**:
   - Output teks Arab dengan **Harakat Lengkap (Tasykil)** agar mudah dibaca pemula.
   - Dilengkapi **Transliterasi Latin**, **Terjemahan Bahasa Indonesia**, **Mufradat Kunci**, dan **Kaidah Nahwu/Shorof**.
   - AI selalu memancing percakapan dengan mengajukan 1 pertanyaan balik berharakat.
2. **Interaksi Suara & Latihan Bicara Mandiri**:
   - 🎙️ **Voice Input (Speech-to-Text)** via Web Speech API (dukungan bahasa Arab `ar-SA` & Indonesia `id-ID`).
   - 🔊 **Voice Output (Text-to-Speech)**: Dengarkan makhraj lafadz Arab yang fasih dengan kontrol kecepatan (1.0x dan 0.75x lambat/tartil).
   - 📢 **Dengar Audio Pelafalan Opsi (Kolom Tengah)**: Setiap kartu rekomendasi jawaban dilengkapi tombol audio suara (`Dengar Arab`) di sebelah kiri footer kartu agar pengguna dapat mendengarkan contoh bacaan dan melatih pengucapan sebelum berbicara ke AI.
   - 🎯 **Target Latihan Kalam & Validasi Pelafalan**:
     - Kotak teks Arab target lengkap dengan **Harakat (Tasykil)**, **Transliterasi Latin**, dan **Arti Bahasa Indonesia**.
     - **Validasi Ketat**: Sistem mencocokkan ucapan pengguna secara fonetis & kata-per-kata. Jika ucapan masih salah, AI menahan respon dan pengguna diwajibkan mengulang latihan bicara sampai pelafalan benar.
     - **Umpan Balik Instan**: Penilaian akurasi persentase, visualisasi chip kata hijau (benar) vs merah (salah/terlewat), serta audio chime perayaan/peringatan.
3. **Papan Pintas Harakat Cepat (Virtual Diacritics)**:
   - Tombol instan harakat (َ ِ ُ ْ ّ ً ٍ ٌ ة ء ى) langsung di atas kolom chat tanpa perlu mengubah layout keyboard OS.
4. **Mode Pembelajaran Tematik**:
   - Percakapan Umum (*Muhadatsah*)
   - Pemula Mutlak (*Mubtadi'*)
   - Belanja di Pasar (*Fis-Suq*)
   - Kaidah Nahwu & Shorof
5. **Dukungan Backend Ganda (Next.js & Python)**:
   - **Next.js 16 App Router** (Zero-configuration API route di `src/app/api/chat/route.ts`).
   - **Python FastAPI** alternatif di `python_backend/app.py`.
6. **Kolom Kiri Dinamis (Min, Buka, Full) & UI Bersih**:
   - Kontrol jendela per kotak: **Min** (ciutkan baris header), **Buka** (tampilan proporsional bagi dua 50:50), dan **Full** (layar penuh kolom dengan kotak pasangannya otomatis diminimalkan).
   - Tampilan awal default bersih/kosong (*blank state*) tanpa baris pintas/contoh.
   - Tombol terkunci di kolom tengah bawah hadir dalam bentuk ikon gembok compact (`Lock`).
7. **Kolom Kanan Mudarris AI Ergonomis & Responsif**:
   - **Avatar Kotak Beradius**: Desain kotak radius proporsional menggantikan lingkaran sempit sehingga tipografi Arab `مُدَرِّس` dan status teks lapang tanpa tertekan (*tidak gepeng*).
   - **Tata Letak Horizontal Berdampingan**: Kotak kontrol audio (Putar Ulang, Tartil, Autoplay) diposisikan di sebelah kiri kotak avatar Mudarris AI secara seimbang.
   - **Visualizer Audio Berjarak Longgar**: Ketika AI bersuara, animasi gelombang audio (*waveform*) tampil di kartu mandiri dengan jarak/margin lega yang terpisah rapi tanpa menempel pada elemen sekitarnya.
8. **Pengaturan Suasana & Skenario Percakapan (Sistem Hybrid)**:
   - 🎛️ **Tombol Suasana Mandiri di Header Kanan**: Ditempatkan berdampingan secara proporsional dengan ikon Panduan Suara (`AlertCircle`) dan Penjelasan (`Info`), lengkap dengan indikator emoji suasana aktif.
   - 🖥️ **Tombol Layar Penuh Ringkas (Icon Only)**: Menampilkan ikon pembesar/pengecil layar tanpa teks wording untuk estetika minimalis dan hemat ruang.
   - 🚀 **Pilihan Preset Cepat**: Beralih topik dalam 1-klik:
     - 🏢 **Suasana Kantor & Kerja** (*Fī al-Maktab*)
     - 🏫 **Suasana Sekolahan & Kampus** (*Fī al-Madrasah*)
     - ☕ **Santai & Berbicara Biasa** (*Muhādatsah Khofīfah*)
     - 🏠 **Kegiatan Sehari-hari di Rumah** (*Fī al-Bayt*)
     - 🛒 **Pasar & Jual Beli** (*Fī as-Sūq*)
     - 🎯 **Mode Latihan & Belajar Bicara** (Pemula Mutlak)
   - ✍️ **Kotak Teks Bebas (Freetext Fleksibel)**: Kebebasan menambahkan detail instruksi atau menuliskan skenario kustom Anda sendiri (misal: simulasi hotel Madinah, bandara, wawancara kerja, dll.).

---

## 🤖 Rekomendasi Model AI (Berdasarkan `ai.md`)

Berdasarkan arsitektur pada [ai.md](file:///Users/kerasakti/Documents/DIEN%20ISLAM/ai.md), model yang direkomendasikan dan telah terkonfigurasi adalah:

- **Model:** `gemma4:e4b` (Garda AI Engine)
- **Endpoint Chat:** `https://iss-uitjbt.inovasiuitjbt.uk/garda-api/v1/chat/completions`
- **Voice TTS Engine:** `https://iss-uitjbt.inovasiuitjbt.uk/edge-tts/v1/audio/speech` + Browser Web Speech API (`ar-SA`)
- **Keunggulan:** Tokenisasi multibahasa sangat fasih berbahasa Arab berharakat, responsif, dan stabil untuk konsultasi edukatif.

---

## 🚀 Cara Menjalankan

### Cara Praktis: Jalankan Sekaligus dengan `run.sh`

Cukup jalankan script `run.sh` untuk menyalakan Frontend (Next.js) dan Backend (FastAPI) secara otomatis:

```bash
cd "/Users/kerasakti/Documents/DIEN ISLAM/belajar_bahasa_arab"
./run.sh
```

> **Catatan:**
> - Menjalankan Frontend di **http://localhost:3000**
> - Menjalankan Backend FastAPI di **http://localhost:8001** (Dokumentasi API di **http://localhost:8001/docs**)
> - Tekan **Ctrl + C** untuk mematikan kedua service secara bersamaan dan bersih.
> - Opsi tambahan: `./run.sh --backend-only` atau `./run.sh --frontend-only`.

---

### Cara Manual

#### 1. Jalankan Frontend (Next.js)

```bash
cd "/Users/kerasakti/Documents/DIEN ISLAM/belajar_bahasa_arab"
npm run dev
```

Buka peramban di [http://localhost:3000](http://localhost:3000).

#### 2. Jalankan Backend Python (FastAPI)

```bash
cd "/Users/kerasakti/Documents/DIEN ISLAM/belajar_bahasa_arab/python_backend"
pip install -r requirements.txt
python app.py
```
Backend Python akan aktif di `http://localhost:8001`.
