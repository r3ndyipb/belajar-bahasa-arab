"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Copy,
  Check,
  BookOpen,
  Sparkles,
  RefreshCw,
  Info,
  Bot,
  User,
  X,
  Languages,
  ArrowLeftRight,
  AlertCircle,
  Play,
  Search,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  RotateCcw,
  Pencil,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Target,
  CheckCheck,
  SlidersHorizontal,
  Building2,
  GraduationCap,
  Home,
  ShoppingBag,
  Coffee,
} from "lucide-react";
import FormattedMessage from "./components/FormattedMessage";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

interface TranslateResult {
  arabic: string;
  latin: string;
  indonesian: string;
  notes?: string;
  source?: string;
}

const TRANSLATE_SAMPLE_PHRASES = [
  { label: "Selamat pagi", text: "Selamat pagi saudaraku" },
  { label: "Apa kabar?", text: "Bagaimana kabarmu hari ini?" },
  { label: "Terima kasih", text: "Terima kasih banyak atas bantuanmu" },
  { label: "Berapa harganya?", text: "Berapa harga buku ini?" },
  { label: "Belajar Arab", text: "Saya ingin belajar percakapan bahasa Arab" },
];

interface ConversationScenario {
  id: string;
  name: string;
  emoji: string;
  category: string;
  description: string;
  prompt: string;
  starterUserMessage: string;
}

const CONVERSATION_SCENARIOS: ConversationScenario[] = [
  {
    id: "santai",
    name: "Santai (Bicara Biasa)",
    emoji: "☕",
    category: "Umum",
    description: "Obrolan santai sehari-hari antar sahabat/kenalan seputar kabar, aktivitas harian, cuaca, dan hobi.",
    prompt: "Suasana santai dan akrab sehari-hari antar sahabat (مُحَادَثَة عَامَّة وَوِدِّيَّة). Gunakan bahasa Arab sehari-hari yang luwes, ramah, dan komunikatif.",
    starterUserMessage: "Marhaban! Mari kita berbincang santai sehari-hari dalam bahasa Arab.",
  },
  {
    id: "kantor",
    name: "Suasana Kantor & Kerja",
    emoji: "🏢",
    category: "Profesional",
    description: "Percakapan profesional di kantor (فِي المَكْتَب): tugas harian, rapat, rekan kerja, dan koordinasi kerja.",
    prompt: "Suasana kantor profesional dan dunia kerja (فِي المَكْتَب / العَمَل). Mudarris AI berperan sebagai rekan kerja atau manajer di kantor. Sertakan kosakata seputar maktab (kantor), ijtima' (rapat), musyru' (proyek), mudir (atasan), dan tugas harian.",
    starterUserMessage: "As-salāmu 'alaikum, mari kita simulasikan percakapan di lingkungan kantor.",
  },
  {
    id: "sekolah",
    name: "Suasana Sekolahan & Kampus",
    emoji: "🏫",
    category: "Akademik",
    description: "Suasana kelas di sekolah/kampus (فِي المَدْرَسَة / الجَامِعَة): interaksi guru-murid, mata pelajaran, dan tugas belajar.",
    prompt: "Suasana akademik di sekolah atau kampus (فِي المَدْرَسَة / فِي الجَامِعَة). Mudarris AI berperan sebagai ustadz atau rekan belajar di kelas. Sertakan kosakata seputar dars (pelajaran), fasl (kelas), wajib manzili (PR), dan mudzakarah (belajar bersama).",
    starterUserMessage: "As-salāmu 'alaikum ya ustadz, mari kita simulasikan percakapan di kelas atau sekolah.",
  },
  {
    id: "rumah",
    name: "Kegiatan Sehari-hari di Rumah",
    emoji: "🏠",
    category: "Keluarga",
    description: "Aktivitas keluarga di dalam rumah (فِي البَيْت): makan bersama, bersih-bersih, sarapan, dan rutinitas harian.",
    prompt: "Suasana rumah dan rutinitas keluarga sehari-hari (فِي البَيْت / الحَيَاة اليَوْمِيَّة). Sertakan kosakata seputar gurfah (kamar), mathbakh (dapur), fathur (sarapan), tanzhif (bersih-bersih), dan waktu istirahat keluarga.",
    starterUserMessage: "As-salāmu 'alaikum, mari kita simulasikan percakapan kegiatan di dalam rumah.",
  },
  {
    id: "pasar",
    name: "Pasar & Jual Beli",
    emoji: "🛒",
    category: "Transaksi",
    description: "Simulasi tawar-menawar harga dan belanja kebutuhan di pasar tradisional atau toko (فِي السُّوق).",
    prompt: "Suasana jual beli dan belanja di pasar atau toko (فِي السُّوق / التَّسَوُّق). Mudarris AI berperan sebagai pedagang atau kasir. Sertakan kosakata seputar tsaman/si'r (harga), kam tsamanuhu (berapa harganya), takhfidz (diskon/tawar), nuqud (uang), dan barang kebutuhan.",
    starterUserMessage: "As-salāmu 'alaikum, mari kita simulasikan percakapan belanja dan tawar-menawar di pasar.",
  },
  {
    id: "pemula",
    name: "Mode Latihan & Belajar Bicara",
    emoji: "🎯",
    category: "Pembelajaran",
    description: "Latihan dan belajar bicara untuk pemula mutlak: kalimat pendek 2-4 kata, makhraj & harakat perlahan.",
    prompt: "Mode latihan dan belajar bicara pemula mutlak (تَعَلُّم الكَلَام لِلْمُبْتَدِئِينَ). Gunakan kalimat Arab yang sangat pendek dan sederhana (2-4 kata), berikan contoh lafal yang sangat perlahan, dan bimbing pembelajar mengenali makhraj serta harakat secara bertahap.",
    starterUserMessage: "As-salāmu 'alaikum, saya ingin latihan bicara bahasa Arab dari tingkat dasar (pemula).",
  },
  {
    id: "custom",
    name: "Topik Bebas / Skenario Kustom",
    emoji: "✨",
    category: "Kustom",
    description: "Tentukan sendiri suasana, peran, atau topik apa pun yang ingin Anda latih sesuai kebutuhan Anda.",
    prompt: "",
    starterUserMessage: "As-salāmu 'alaikum, mari kita mulai percakapan sesuai topik khusus yang saya tentukan.",
  },
];

interface RecommendationOption {
  arabic: string;
  latin: string;
  translation: string;
}

interface ParsedAiSpeech {
  arabic: string;
  latin: string;
  translation: string;
  notes?: string;
  recommendations: RecommendationOption[];
}

interface WordMatch {
  word: string;
  matched: boolean;
}

interface ValidationResult {
  isValid: boolean;
  score: number;
  matchedCount: number;
  totalWords: number;
  wordMatches: WordMatch[];
  spokenClean: string;
  targetClean: string;
}

// Normalisasi teks Arab: hilangkan harakat, samakan alif, ta marbutah, alif maqsura, dan tanda baca
const normalizeArabic = (text: string): string => {
  if (!text) return "";
  return text
    // hilangkan seluruh harakat / tasykil
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    // normalisasi seluruh varian alif (إ, أ, آ, ٱ) menjadi ا
    .replace(/[إأآٱ]/g, "ا")
    // normalisasi ta marbutah ke ha agar seragam
    .replace(/ة/g, "ه")
    // normalisasi alif maqsura ke ya
    .replace(/ى/g, "ي")
    // hapus tanda baca Arab dan Latin
    .replace(/[،؟!.?:;,"'\(\)\[\]\{\}\-_\\\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// Hitung Levenshtein Distance untuk toleransi variasi fonetik STT
const levenshteinDistance = (a: string, b: string): number => {
  const m = a.length;
  const n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
    }
  }
  return d[m][n];
};

// Validasi ucapan Arab terhadap target kalimat
const validateArabicSpeech = (
  spoken: string,
  target: string
): ValidationResult => {
  const normSpoken = normalizeArabic(spoken);
  const normTarget = normalizeArabic(target);

  if (!normSpoken) {
    return {
      isValid: false,
      score: 0,
      matchedCount: 0,
      totalWords: 0,
      wordMatches: [],
      spokenClean: "",
      targetClean: normTarget,
    };
  }

  const spokenTokens = normSpoken.split(" ").filter(Boolean);
  const targetTokens = normTarget.split(" ").filter(Boolean);
  const rawTargetTokens = target
    .replace(/[،؟!.?:;,"'()]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  const wordMatches: WordMatch[] = rawTargetTokens.map((rawWord) => {
    const normW = normalizeArabic(rawWord);
    let matched = false;
    for (const spkW of spokenTokens) {
      if (spkW === normW) {
        matched = true;
        break;
      }
      if (normW.length > 2 && Math.abs(spkW.length - normW.length) <= 1) {
        if (levenshteinDistance(spkW, normW) <= 1) {
          matched = true;
          break;
        }
      }
    }
    // Cek juga jika kata tergabung dalam partikel (misal: والحمد لله vs والحمدلله)
    if (!matched && normSpoken.replace(/\s+/g, "").includes(normW)) {
      matched = true;
    }
    return { word: rawWord, matched };
  });

  const matchedCount = wordMatches.filter((w) => w.matched).length;
  const tokenScore =
    targetTokens.length > 0
      ? Math.round((matchedCount / targetTokens.length) * 100)
      : 0;

  // Skor berbasis kontinuitas karakter tanpa spasi untuk mengantisipasi penggabungan partikel
  const noSpaceTarget = normTarget.replace(/\s+/g, "");
  const noSpaceSpoken = normSpoken.replace(/\s+/g, "");
  const maxLen = Math.max(noSpaceTarget.length, noSpaceSpoken.length);
  const dist = levenshteinDistance(noSpaceSpoken, noSpaceTarget);
  const charScore =
    maxLen > 0 ? Math.round(Math.max(0, (1 - dist / maxLen) * 100)) : 0;

  const finalScore = Math.max(tokenScore, charScore);
  // Ucapan valid jika skor >= 70% atau semua kata kunci cocok
  const isValid =
    finalScore >= 70 ||
    (targetTokens.length > 0 && matchedCount === targetTokens.length);

  return {
    isValid,
    score: finalScore,
    matchedCount,
    totalWords: targetTokens.length,
    wordMatches,
    spokenClean: normSpoken,
    targetClean: normTarget,
  };
};

// Efek suara sintetis instan berbasis Web Audio API (tanpa dependensi file eksternal)
const playAudioTone = (type: "success" | "retry") => {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    if (type === "success") {
      // Nada akor naik ceria (C5 -> E5 -> G5) merayakan ucapan benar
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + idx * 0.1 + 0.3
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.32);
      });
    } else {
      // Nada peringatan lembut menurun (E4 -> C4) untuk mencoba lagi
      const freqs = [329.63, 261.63];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + idx * 0.14 + 0.28
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.14);
        osc.stop(ctx.currentTime + idx * 0.14 + 0.3);
      });
    }
  } catch (_) {}
};

const DEFAULT_RECOMMENDATIONS: RecommendationOption[] = [
  {
    arabic: "بِخَيْرٍ وَالْحَمْدُ لِلَّهِ، وَكَيْفَ حَالُكَ أَنْتَ يَا أُسْتَاذُ؟",
    latin: "Bikhayrin wal-hamdu lillāh, wa kayfa hāluka anta yā ustādz?",
    translation: "Alhamdulillah kabar baik, dan bagaimana kabarmu wahai ustadz?",
  },
  {
    arabic: "أَهْلًا بِكَ، أُرِيدُ أَنْ أَتَعَلَّمَ الْمُحَادَثَةَ الْعَرَبِيَّةَ الْيَوْمَ.",
    latin: "Ahlan bik, urīdu an ata'allamal-muhādatsatal-'arabiyyata al-yawm.",
    translation: "Selamat datang, saya ingin belajar percakapan bahasa Arab hari ini.",
  },
  {
    arabic: "عَلَيْكُمُ السَّلَامُ وَرَحْمَةُ اللَّهِ، أَنَا مُسْتَعِدٌّ لِلتَّدْرِيبِ!",
    latin: "'Alaikumus-salāmu wa rahmatullāh, anā musta'iddun lit-tadrīb!",
    translation: "Wa'alaikumussalam warahmatullah, saya siap untuk latihan!",
  },
];

const INITIAL_AI_SPEECH: ParsedAiSpeech = {
  arabic:
    "أَهْلًا وَسَهْلًا بِكَ فِي بَرْنَامَجِ تَعَلُّمِ اللُّغَةِ الْعَرَبِيَّةِ! كَيْفَ حَالُكَ الْيَوْمَ؟",
  latin:
    "Ahlan wa sahlan bika fī barnāmaji ta'allumil-lughatil-'arabiyyah! Kayfa hāluka al-yawm?",
  translation:
    "Selamat datang di program pembelajaran bahasa Arab interaktif! Bagaimana kabarmu hari ini?",
  notes:
    "حَالٌ (Hāl) = Keadaan/Kabar. Pertanyaan 'كَيْفَ حَالُكَ؟' digunakan untuk menanyakan kabar lawan bicara laki-laki.",
  recommendations: DEFAULT_RECOMMENDATIONS,
};

const REFERENCE_TOPIC_PILLS = [
  {
    label: "Tabel Tasrif Fi'il",
    prompt: "Buatkan tabel tasrif fi'il madhi, fi'il mudhari', dan fi'il amr untuk kata كَتَبَ (kataba) dan جَلَسَ (jalasa) lengkap dengan harakat dan artinya.",
  },
  {
    label: "Kaidah Isim & Fi'il",
    prompt: "Jelaskan perbedaan antara Isim (kata benda) dan Fi'il (kata kerja) dalam bahasa Arab dalam bentuk tabel perbandingan beserta contohnya.",
  },
  {
    label: "Tabel Mufradat Harian",
    prompt: "Berikan tabel 10 kosakata (mufradat) bahasa Arab sehari-hari di rumah lengkap dengan teks Arab berharakat, cara baca Latin, dan arti.",
  },
  {
    label: "Mubtada' & Khabar",
    prompt: "Jelaskan kaidah jumlah ismiyyah (Mubtada' dan Khabar) secara ringkas dan berikan tabel contoh kalimatnya.",
  },
];

const ARABIC_SHORTCUTS = [
  { char: "َ", label: "Fathah" },
  { char: "ِ", label: "Kasrah" },
  { char: "ُ", label: "Dhammah" },
  { char: "ْ", label: "Sukun" },
  { char: "ّ", label: "Tasydid" },
  { char: "ً", label: "Tanwin-an" },
  { char: "ٍ", label: "Tanwin-in" },
  { char: "ٌ", label: "Tanwin-un" },
  { char: "ة", label: "Ta Marbutah" },
  { char: "ء", label: "Hamzah" },
  { char: "ى", label: "Alif Maqshurah" },
];

export default function ArabicLearningThreeColumns() {
  // Session ID unik agar riwayat percakapan Mudarris AI tetap konsisten
  const [sessionId, setSessionId] = useState("arabic-session-default");

  useEffect(() => {
    setSessionId(`arabic-session-${Date.now()}`);
  }, []);

  // Mode Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle error:", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Responsive tab untuk tampilan mobile (< lg)
  const [activeMobileTab, setActiveMobileTab] = useState<"left" | "center" | "right">("center");

  // Ukuran font untuk Teks Rekomendasi di Kolom Tengah (Arab & Latin)
  const [arabicFontSize, setArabicFontSize] = useState<number>(24); // 14px - 48px
  const [latinFontSize, setLatinFontSize] = useState<number>(13); // 10px - 24px
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);

  // ==========================================
  // KOLOM KIRI (BARIS ATAS): TRANSLATE INDONESIA - ARAB
  // ==========================================
  const [translateInput, setTranslateInput] = useState("");
  const [translateDirection, setTranslateDirection] = useState<"id-ar" | "ar-id">("id-ar");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateResult, setTranslateResult] = useState<TranslateResult | null>(null);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [copiedTranslateType, setCopiedTranslateType] = useState<"arabic" | "latin" | "all" | null>(null);

  // Mode Tampilan Kotak Kolom Kiri: "normal" (buka bagi 2), "minimized" (ciutkan), "full" (layar penuh kolom)
  const [topBoxMode, setTopBoxMode] = useState<"normal" | "minimized" | "full">("normal");
  const [bottomBoxMode, setBottomBoxMode] = useState<"normal" | "minimized" | "full">("normal");

  const handleTopMode = (mode: "normal" | "minimized" | "full") => {
    if (mode === "full") {
      setTopBoxMode("full");
      setBottomBoxMode("minimized");
    } else if (mode === "minimized") {
      setTopBoxMode("minimized");
      if (bottomBoxMode === "minimized") {
        setBottomBoxMode("normal");
      }
    } else {
      // mode === "normal" (Buka)
      setTopBoxMode("normal");
      if (bottomBoxMode === "full") {
        setBottomBoxMode("normal");
      }
    }
  };

  const handleBottomMode = (mode: "normal" | "minimized" | "full") => {
    if (mode === "full") {
      setBottomBoxMode("full");
      setTopBoxMode("minimized");
    } else if (mode === "minimized") {
      setBottomBoxMode("minimized");
      if (topBoxMode === "minimized") {
        setTopBoxMode("normal");
      }
    } else {
      // mode === "normal" (Buka)
      setBottomBoxMode("normal");
      if (topBoxMode === "full") {
        setTopBoxMode("normal");
      }
    }
  };

  // ==========================================
  // KOLOM KIRI (BARIS BAWAH): REFERENSI CHAT TEKS
  // ==========================================
  const [refMessages, setRefMessages] = useState<Message[]>([]);
  const [refInputText, setRefInputText] = useState("");
  const [isRefLoading, setIsRefLoading] = useState(false);
  const refMessagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll kolom referensi
  useEffect(() => {
    refMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [refMessages, isRefLoading]);

  // ==========================================
  // KOLOM 2 & 3: PERCAKAPAN SUARA & MUDARRIS AI
  // ==========================================
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "voice-init-1",
      sender: "ai",
      text: `**أَهْلًا وَسَهْلًا بِكَ فِي بَرْنَامَجِ تَعَلُّمِ اللُّغَةِ الْعَرَبِيَّةِ!** 🌿
*(Ahlan wa sahlan bika fī barnāmaji ta'allumil-lughatil-'arabiyyah!)*

**Terjemahan:** "Selamat datang di program pembelajaran bahasa Arab interaktif! Bagaimana kabarmu hari ini?"

💡 *Silakan pilih salah satu rekomendasi jawaban di kolom tengah atau gunakan mikrofon untuk menjawab.*`,
      timestamp: "Baru saja",
    },
  ]);

  // Current parsed AI Speech info (Ditampilkan di Kolom Kanan & Rekomendasi di Kolom Tengah)
  const [currentAiSpeech, setCurrentAiSpeech] = useState<ParsedAiSpeech>(INITIAL_AI_SPEECH);

  // Target Kalimat Latihan Bicara & Status Validasi Ucapan
  const [targetPractice, setTargetPractice] = useState<RecommendationOption>(
    DEFAULT_RECOMMENDATIONS[0]
  );
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [showTestSpeechInput, setShowTestSpeechInput] = useState(false);
  const [testSpeechInputText, setTestSpeechInputText] = useState("");

  // State Perekaman Suara (Speech Recognition)
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [speechLang, setSpeechLang] = useState<"ar-SA" | "id-ID">("ar-SA");
  const [autoSendVoice, setAutoSendVoice] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [micSupported, setMicSupported] = useState<boolean | null>(null);

  // State Pemutaran Audio (Text-to-Speech)
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isAiAudioLoading, setIsAiAudioLoading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Modals & Bantuan
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showVoiceHelpModal, setShowVoiceHelpModal] = useState(false);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("santai");
  const [customScenarioPrompt, setCustomScenarioPrompt] = useState<string>(
    CONVERSATION_SCENARIOS[0].prompt
  );
  const [activeScenarioId, setActiveScenarioId] = useState<string>("santai");
  const [activeScenarioPrompt, setActiveScenarioPrompt] = useState<string>(
    CONVERSATION_SCENARIOS[0].prompt
  );
  const [testAudioStatus, setTestAudioStatus] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const currentScenario =
    CONVERSATION_SCENARIOS.find((s) => s.id === activeScenarioId) ||
    CONVERSATION_SCENARIOS[0];

  const recognitionInstanceRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isHoldingButtonRef = useRef<boolean>(false);

  // Periksa dukungan SpeechRecognition di browser klien
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSupport = !!(
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
      );
      setMicSupported(hasSupport);
    }
  }, []);

  // Bersihkan audio dan stream saat unmount
  useEffect(() => {
    return () => {
      if (recognitionInstanceRef.current) {
        try {
          recognitionInstanceRef.current.abort();
        } catch (_) {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, []);

  // Buka blokir autoplay audio browser via AudioContext
  const unlockAudio = () => {
    try {
      if (typeof window !== "undefined") {
        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === "suspended") {
            ctx.resume();
          }
        }
      }
    } catch (_) {}
  };

  // Parser respon AI menjadi struktur: Arab, Latin, Terjemahan, Catatan, dan Rekomendasi Jawaban
  const parseAiTextToSpeechStructure = (rawText: string): ParsedAiSpeech => {
    let arabic = "";
    let latin = "";
    let translation = "";
    let notes = "";
    const recommendations: RecommendationOption[] = [];

    // 1. Ekstrak Kalam Arab
    const kalamMatch = rawText.match(
      /(?:🗣️\s*)?(?:Kalam|Kalām)\s*Arab[^\n:]*[:\n]\s*([^\n#]+)/i
    );
    if (kalamMatch && kalamMatch[1]) {
      arabic = kalamMatch[1].replace(/[*_#`~]/g, "").trim();
    } else {
      // Fallback: Cari baris atau paragraf yang mayoritas teks Arab
      const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\s،؟.!]+/g;
      const arabicMatches = rawText.match(arabicRegex);
      if (arabicMatches && arabicMatches.length > 0) {
        arabic = arabicMatches[0].replace(/\s+/g, " ").replace(/\bالعربية\b/g, "").trim();
      }
    }

    // 2. Ekstrak Transliterasi Latin
    const translitMatch = rawText.match(
      /(?:📖\s*)?(?:Transliterasi|Bacaan|Ejaan|Latin)[^\n:]*[:\n]\s*([^\n#]+)/i
    );
    if (translitMatch && translitMatch[1]) {
      latin = translitMatch[1].replace(/[*_#`~]/g, "").trim();
    } else {
      const parenMatch = rawText.match(/\(([^)]+)\)/);
      if (parenMatch && parenMatch[1] && /[a-zA-Z]/.test(parenMatch[1])) {
        latin = parenMatch[1].trim();
      }
    }

    // 3. Ekstrak Terjemahan
    const transMatch = rawText.match(
      /(?:🇮🇩\s*)?(?:Terjemahan|Arti)[^\n:]*[:\n]\s*([^\n#]+)/i
    );
    if (transMatch && transMatch[1]) {
      translation = transMatch[1].replace(/[*_#`~"']/g, "").trim();
    }

    // 4. Ekstrak Catatan / Mufradat
    const notesMatch = rawText.match(
      /(?:💡\s*)?(?:Mufradat|Catatan|Kaidah)[^\n:]*[:\n]\s*([\s\S]*?)(?:🎯|❓|Rekomendasi|$)/i
    );
    if (notesMatch && notesMatch[1]) {
      notes = notesMatch[1].trim();
    }

    // 5. Ekstrak Rekomendasi Jawaban Pengguna
    const recSectionMatch = rawText.match(
      /(?:🎯\s*)?(?:Rekomendasi\s*Jawaban[^\n:]*[:\n])([\s\S]*?)(?:$)/i
    );
    if (recSectionMatch && recSectionMatch[1]) {
      const recText = recSectionMatch[1];
      // Cari pola Opsi / Item
      const optionBlocks = recText.split(/(?:Opsi|\*|\-)\s*\d+[:.]/i).filter((b) => b.trim().length > 0);
      for (const block of optionBlocks) {
        const ar = block.match(/(?:Arab|عربي)[^\n:]*[:\n]\s*([^\n#]+)/i);
        const lt = block.match(/(?:Latin|Transliterasi)[^\n:]*[:\n]\s*([^\n#]+)/i);
        const tr = block.match(/(?:Arti|Terjemahan)[^\n:]*[:\n]\s*([^\n#]+)/i);
        if (ar && ar[1]) {
          recommendations.push({
            arabic: ar[1].replace(/[*_#`~]/g, "").trim(),
            latin: lt ? lt[1].replace(/[*_#`~]/g, "").trim() : "",
            translation: tr ? tr[1].replace(/[*_#`~"']/g, "").trim() : "",
          });
        }
      }
    }

    // Fallback jika tidak terdeteksi dari parsing
    if (!arabic) {
      arabic = "أَهْلًا وَسَهْلًا، تَفَضَّلْ بِالْكَلَامِ مَعِي.";
    }
    if (!latin) {
      latin = "Ahlan wa sahlan, tafadhdhal bil-kalāmi ma'ī.";
    }
    if (!translation) {
      translation = "Selamat datang, silakan berbicara dengan saya.";
    }
    if (recommendations.length === 0) {
      recommendations.push(...DEFAULT_RECOMMENDATIONS);
    }

    return {
      arabic,
      latin,
      translation,
      notes,
      recommendations,
    };
  };

  // Mainkan audio Text-to-Speech (TTS)
  const playAudio = async (textToSpeak: string, sourceId: string = "ai-speech") => {
    unlockAudio();

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setIsAiAudioLoading(true);
    setPlayingAudioId(sourceId);
    setAudioBlocked(false);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSpeak,
          lang: "ar",
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (res.ok && contentType.includes("audio")) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.playbackRate = speechSpeed;
        audio.volume = 1.0;
        currentAudioRef.current = audio;

        audio.onplay = () => {
          setIsAiAudioLoading(false);
          setIsAiSpeaking(true);
          setAudioBlocked(false);
        };

        audio.onended = () => {
          setIsAiSpeaking(false);
          setIsAiAudioLoading(false);
          setPlayingAudioId(null);
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = () => {
          setIsAiAudioLoading(false);
          setIsAiSpeaking(false);
          setPlayingAudioId(null);
          speakWithBrowserFallback(textToSpeak, sourceId);
        };

        try {
          await audio.play();
        } catch (playErr: any) {
          console.warn("Autoplay blocked:", playErr);
          setIsAiAudioLoading(false);
          setIsAiSpeaking(false);
          setPlayingAudioId(null);
          if (playErr.name === "NotAllowedError") {
            setAudioBlocked(true);
          } else {
            speakWithBrowserFallback(textToSpeak, sourceId);
          }
        }
      } else {
        setIsAiAudioLoading(false);
        speakWithBrowserFallback(textToSpeak, sourceId);
      }
    } catch (err) {
      console.warn("TTS fetch error:", err);
      setIsAiAudioLoading(false);
      speakWithBrowserFallback(textToSpeak, sourceId);
    }
  };

  const speakWithBrowserFallback = (text: string, sourceId?: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsAiSpeaking(false);
      setPlayingAudioId(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-SA";
    utterance.rate = speechSpeed;
    if (sourceId) setPlayingAudioId(sourceId);
    setIsAiSpeaking(true);
    utterance.onend = () => {
      setIsAiSpeaking(false);
      setPlayingAudioId(null);
    };
    utterance.onerror = () => {
      setIsAiSpeaking(false);
      setPlayingAudioId(null);
    };
    window.speechSynthesis.speak(utterance);
  };

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsAiSpeaking(false);
    setIsAiAudioLoading(false);
    setPlayingAudioId(null);
  };

  // ==========================================
  // LOGIKA INPUT SUARA (SPEECH TO TEXT)
  // ==========================================
  const startRecording = async () => {
    setSpeechError(null);
    unlockAudio();

    if (isRecording) {
      stopRecording();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError(
        "Browser Anda belum mendukung Web Speech API. Silakan gunakan Google Chrome atau Microsoft Edge."
      );
      setShowVoiceHelpModal(true);
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
      }
    } catch (permErr: any) {
      console.warn("Izin mikrofon gagal:", permErr);
      setSpeechError("Akses mikrofon ditolak. Klik ikon gembok di address bar lalu pilih Izinkan Mikrofon.");
      setShowVoiceHelpModal(true);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = speechLang;

      let recognizedText = "";

      recognition.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
        setValidationResult(null);
        setLiveTranscript(
          speechLang === "ar-SA"
            ? "تَفَضَّلْ بِالْكَلَامِ... (Silakan ucapkan kalimat target di atas...)"
            : "Silakan bicara bahasa Indonesia..."
        );
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            recognizedText += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }
        const currentText = recognizedText || interim;
        setLiveTranscript(currentText);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech error:", event.error);
        setIsRecording(false);
        if (event.error === "not-allowed") {
          setSpeechError("Izin mikrofon ditolak oleh browser.");
          setShowVoiceHelpModal(true);
        } else if (event.error === "no-speech") {
          setSpeechError("Suara tidak terdengar. Silakan bicara lebih dekat ke mikrofon.");
        } else {
          setSpeechError(`Status pengenalan suara: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }

        const finalSpoken = recognizedText.trim();
        if (finalSpoken) {
          setLiveTranscript(finalSpoken);
          handleValidateSpeech(finalSpoken);
        } else {
          setLiveTranscript("");
        }
      };

      recognitionInstanceRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Gagal start recognition:", err);
      setIsRecording(false);
      setSpeechError(`Gagal mengakses pengenal suara: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (recognitionInstanceRef.current) {
      try {
        recognitionInstanceRef.current.stop();
      } catch (_) {}
      recognitionInstanceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
  };

  // Push-to-Talk (Hold to speak handlers)
  const handleHoldStart = () => {
    isHoldingButtonRef.current = true;
    if (!isRecording) {
      startRecording();
    }
  };

  const handleHoldEnd = () => {
    if (isHoldingButtonRef.current) {
      isHoldingButtonRef.current = false;
      stopRecording();
    }
  };

  // ==========================================
  // HANDLER VALIDASI UCAPAN PENGGUNA TERHADAP TARGET
  // ==========================================
  const handleValidateSpeech = (spokenText: string) => {
    if (!spokenText.trim()) return;

    const val = validateArabicSpeech(spokenText.trim(), targetPractice.arabic);
    setValidationResult(val);

    if (val.isValid) {
      // Ucapan Benar! Mainkan nada perayaan sukses
      playAudioTone("success");

      // Jika Auto-Kirim aktif, kirim ke Mudarris AI setelah jeda visual sejenak
      if (autoSendVoice) {
        setIsAutoSending(true);
        setTimeout(() => {
          setIsAutoSending(false);
          handleSendVoiceMessage(targetPractice.arabic);
        }, 1100);
      }
    } else {
      // Ucapan Masih Salah! Mainkan nada peringatan lembut untuk mengulang
      playAudioTone("retry");
      setIsAutoSending(false);
      // AI DITAHAN: AI TIDAK MERESPON SAMPAI UCAPAN BENAR
    }
  };

  // ==========================================
  // KIRIM PESAN DI RUANG BICARA (KOLOM TENGAH & KANAN)
  // ==========================================
  const handleSendVoiceMessage = async (
    textToSend: string,
    promptOverride?: string,
    scenarioNameOverride?: string
  ) => {
    unlockAudio();
    if (!textToSend.trim() || isAiThinking) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsAiThinking(true);

    try {
      const targetPrompt =
        promptOverride !== undefined ? promptOverride : activeScenarioPrompt;
      const targetName =
        scenarioNameOverride !== undefined
          ? scenarioNameOverride
          : currentScenario.name;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          mode:
            activeScenarioId === "pemula"
              ? "beginner"
              : activeScenarioId === "pasar"
              ? "market"
              : "general",
          scenarioPrompt: targetPrompt,
          scenarioName: targetName,
          sessionId,
        }),
      });

      const data = await res.json();
      const aiReply =
        data.response ||
        "عَفْوًا، لَمْ أَسْتَطِعِ الْإِجَابَةَ. يُرْجَى إِعَادَةُ الْمُحَاوَلَةِ.";

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Parse AI speech content dan update Kolom Kanan & Rekomendasi di Kolom Tengah
      const parsed = parseAiTextToSpeechStructure(aiReply);
      setCurrentAiSpeech(parsed);

      // Otomatis perbarui target latihan bicara dengan rekomendasi baru dari AI
      if (parsed.recommendations && parsed.recommendations.length > 0) {
        setTargetPractice(parsed.recommendations[0]);
      }
      setValidationResult(null);
      setLiveTranscript("");

      // Mainkan suara AI secara otomatis jika diaktifkan
      if (autoPlayAudio) {
        setTimeout(() => {
          playAudio(parsed.arabic);
        }, 200);
      }
    } catch (err) {
      console.error("Gagal kirim pesan:", err);
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: "Maaf, terjadi kendala saat menghubungkan ke server Mudarris AI.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleApplyAndStartScenario = (
    scenarioId: string,
    promptText: string
  ) => {
    setActiveScenarioId(scenarioId);
    setActiveScenarioPrompt(promptText);
    setShowScenarioModal(false);

    const scenarioObj = CONVERSATION_SCENARIOS.find((s) => s.id === scenarioId);
    const starterMsg =
      scenarioObj?.starterUserMessage ||
      "As-salāmu 'alaikum, mari kita mulai percakapan sesuai suasana ini.";

    handleSendVoiceMessage(starterMsg, promptText, scenarioObj?.name);
  };

  // ==========================================
  // KIRIM PESAN DI KOLOM REFERENSI (KOLOM KIRI - TANPA SUARA)
  // ==========================================
  const handleSendRefMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || refInputText;
    if (!textToSend.trim() || isRefLoading) return;

    const userRefMsg: Message = {
      id: `ref-user-${Date.now()}`,
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setRefMessages((prev) => [...prev, userRefMsg]);
    setRefInputText("");
    setIsRefLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          mode: "reference",
          sessionId: `${sessionId}-reference`,
        }),
      });

      const data = await res.json();
      const reply = data.response || "Tidak dapat memuat penjelasan referensi.";

      const aiRefMsg: Message = {
        id: `ref-ai-${Date.now()}`,
        sender: "ai",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setRefMessages((prev) => [...prev, aiRefMsg]);
      // Sesuai instruksi, Kolom Referensi TANPA SUARA sama sekali.
    } catch (err) {
      console.error("Error fetching reference:", err);
      const errRefMsg: Message = {
        id: `ref-err-${Date.now()}`,
        sender: "ai",
        text: "Terjadi kendala saat mencari referensi. Silakan ulangi pertanyaan Anda.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setRefMessages((prev) => [...prev, errRefMsg]);
    } finally {
      setIsRefLoading(false);
    }
  };

  const insertRefArabicChar = (char: string) => {
    setRefInputText((prev) => prev + char);
  };

  // Handler terjemahan Indonesia - Arab (Baris Atas Kolom Kiri)
  const handleTranslate = async (customText?: string, customDir?: "id-ar" | "ar-id") => {
    const textToTranslate = customText !== undefined ? customText : translateInput;
    const dirToUse = customDir || translateDirection;

    if (!textToTranslate.trim() || isTranslating) return;

    setIsTranslating(true);
    setTranslateError(null);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToTranslate.trim(),
          direction: dirToUse,
          sessionId: `${sessionId}-translate`,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server status ${res.status}`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setTranslateResult({
        arabic: data.arabic || textToTranslate,
        latin: data.latin || "",
        indonesian: data.indonesian || textToTranslate,
        notes: data.notes || "",
        source: data.source,
      });
    } catch (err: any) {
      console.error("Translation error:", err);
      setTranslateError("Gagal menerjemahkan teks. Pastikan koneksi server AI aktif.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopyTranslate = (text: string, type: "arabic" | "latin" | "all") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedTranslateType(type);
      setTimeout(() => setCopiedTranslateType(null), 2000);
    }
  };

  const insertTranslateArabicChar = (char: string) => {
    setTranslateInput((prev) => prev + char);
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const runAudioTest = async () => {
    setTestAudioStatus("Memutar audio sampel Arab...");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "مَرْحَبًا بِكُمْ فِي تَعَلُّمِ اللُّغَةِ الْعَرَبِيَّةِ",
          lang: "ar",
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => setTestAudioStatus("✅ Speaker audio berfungsi jelas!");
        audio.onerror = () => setTestAudioStatus("❌ Browser gagal memutar audio.");
        await audio.play();
      } else {
        setTestAudioStatus("❌ Server TTS tidak merespons.");
      }
    } catch (e: any) {
      setTestAudioStatus(`❌ Error audio: ${e.message}`);
    }
  };

  return (
    <div className="relative flex flex-col h-screen max-h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* ========================================================================= */}
      {/* FLOATING ACTION UTILITY: FULLSCREEN, BANTUAN SUARA & INFO (TANPA HEADER) */}
      {/* ========================================================================= */}
      <div className="fixed top-2.5 right-3.5 z-40 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md border border-slate-700/70 p-1 rounded-xl shadow-xl">
        {/* Tombol Layar Penuh (Icon Only - Tanpa Wording) */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title={isFullscreen ? "Keluar Layar Penuh (Esc)" : "Mode Layar Penuh"}
          aria-label={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Maximize2 className="w-4 h-4 text-slate-300" />
          )}
        </button>

        <div className="h-4 w-px bg-slate-700/60 my-auto" />

        {/* Tombol Pengaturan Suasana & Skenario Percakapan (Kantor, Sekolah, Rumah, Jual Beli, Belajar Bicara, Kustom) */}
        <button
          type="button"
          onClick={() => {
            setSelectedScenarioId(activeScenarioId);
            setCustomScenarioPrompt(activeScenarioPrompt);
            setShowScenarioModal(true);
          }}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
          title={`Pengaturan Suasana Percakapan: ${currentScenario.name} (Kantor, Sekolah, Rumah, Jual Beli, Belajar Bicara, Kustom)`}
          aria-label="Pengaturan Suasana & Skenario Percakapan"
        >
          <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs leading-none" title={`Suasana Aktif: ${currentScenario.name}`}>
            {currentScenario.emoji}
          </span>
        </button>

        {/* Tombol Panduan Suara & Diagnosis Mic */}
        <button
          onClick={() => setShowVoiceHelpModal(true)}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-amber-400 hover:text-amber-300 transition-colors"
          title="Panduan Suara & Diagnosis Mic"
          aria-label="Panduan Suara"
        >
          <AlertCircle className="w-4 h-4" />
        </button>

        {/* Tombol Penjelasan Model AI & Info Aplikasi */}
        <button
          onClick={() => setShowInfoModal(true)}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-teal-300 hover:text-teal-200 transition-colors"
          title="Penjelasan Model AI & Info Aplikasi"
          aria-label="Penjelasan Model AI"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* NAVIGASI TAB UNTUK LAYAR MOBILE (< lg) */}
      <div className="lg:hidden shrink-0 flex items-center justify-between p-1.5 bg-slate-900/90 border-b border-slate-800 text-xs z-30">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center font-serif text-white font-bold text-xs">
            ض
          </div>
          <span className="font-bold text-xs text-emerald-100">Mudarris AI</span>
        </div>

        <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveMobileTab("left")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeMobileTab === "left"
                ? "bg-sky-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            1. Terjemah & Ref
          </button>
          <button
            onClick={() => setActiveMobileTab("center")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeMobileTab === "center"
                ? "bg-teal-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            2. Bicara
          </button>
          <button
            onClick={() => setActiveMobileTab("right")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeMobileTab === "right"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            3. AI
          </button>
        </div>
      </div>

      {/* BANNER NOTIFIKASI ERROR SUARA (JIKA ADA) */}
      {speechError && (
        <div className="shrink-0 bg-amber-950/90 border-b border-amber-800/70 px-4 py-1.5 text-xs text-amber-200 z-30">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{speechError}</span>
            </div>
            <button
              onClick={() => setSpeechError(null)}
              className="p-1 text-amber-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* CONTAINER UTAMA: 3 KOLOM BERDAMPINGAN FIT HEIGHT (100% LAYAR PENUH) */}
      <main className="flex-1 min-h-0 w-full max-w-[1720px] mx-auto p-2 sm:p-2.5 lg:p-3 grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 items-stretch h-full overflow-hidden">
        
        {/* ========================================================================= */}
        {/* 1. KOLOM SEBELAH KIRI (DIBAGI 2 BARIS):                                    */}
        {/*    BARIS ATAS : TRANSLATE INDONESIA - ARAB (TULISAN ARAB & LATIN)         */}
        {/*    BARIS BAWAH: CHAT REFERENSI TEKS (TETAP SAMA SEPERTI SEBELUMNYA)       */}
        {/* ========================================================================= */}
        <div
          className={`lg:col-span-4 h-full min-h-0 flex flex-col gap-2.5 overflow-hidden ${
            activeMobileTab === "left" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* ----------------------------------------------------------------------- */}
          {/* BARIS ATAS: TRANSLATOR INDONESIA - ARAB (ARAB BERHARAKAT & LATIN)       */}
          {/* ----------------------------------------------------------------------- */}
          <section
            className={`flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all duration-200 ${
              topBoxMode === "minimized" ? "shrink-0" : "flex-1 min-h-0"
            }`}
          >
            {/* Header Translator */}
            <div
              onClick={() => {
                if (topBoxMode === "minimized") handleTopMode("normal");
              }}
              className={`shrink-0 bg-slate-900 border-b border-slate-800 px-2.5 py-2 flex items-center justify-between ${
                topBoxMode === "minimized" ? "cursor-pointer hover:bg-slate-800/60" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                  <Languages className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                    Arab & Latin
                  </span>
                  {topBoxMode === "minimized" && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/50">
                      Diminimalkan
                    </span>
                  )}
                  {topBoxMode === "full" && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-700/60">
                      Full
                    </span>
                  )}
                </div>
              </div>

              {/* Kontrol Bahasa & Tombol Mode: Minimize, Buka, Full */}
              <div className="flex items-center gap-1 sm:gap-1.5" onClick={(e) => e.stopPropagation()}>
                {topBoxMode !== "minimized" && (
                  <button
                    type="button"
                    onClick={() => {
                      const newDir = translateDirection === "id-ar" ? "ar-id" : "id-ar";
                      setTranslateDirection(newDir);
                      if (translateResult) {
                        setTranslateInput(newDir === "ar-id" ? translateResult.arabic : translateResult.indonesian);
                      }
                    }}
                    className="px-1.5 sm:px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] sm:text-[11px] font-semibold text-emerald-300 border border-slate-700 flex items-center gap-1 transition-colors"
                    title="Tukar Arah Bahasa (Indonesia ⇄ Arab)"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>{translateDirection === "id-ar" ? "ID ➔ AR" : "AR ➔ ID"}</span>
                  </button>
                )}

                {/* Segmented Controls: Min, Buka, Full */}
                <div className="flex items-center bg-slate-950/90 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleTopMode("minimized")}
                    className={`px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors ${
                      topBoxMode === "minimized"
                        ? "bg-amber-950/90 text-amber-300 font-bold border border-amber-800/50"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="Minimize kotak penerjemah"
                  >
                    <Minus className="w-2.5 h-2.5" />
                    <span className="hidden sm:inline">Min</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTopMode("normal")}
                    className={`px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors ${
                      topBoxMode === "normal"
                        ? "bg-slate-800 text-emerald-300 font-bold border border-slate-700"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="Buka normal (bagi dua kolom)"
                  >
                    <Minimize2 className="w-2.5 h-2.5" />
                    <span className="hidden sm:inline">Buka</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTopMode("full")}
                    className={`px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors ${
                      topBoxMode === "full"
                        ? "bg-emerald-600 text-white font-bold shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="Tampilan layar penuh (kotak referensi minimize)"
                  >
                    <Maximize2 className="w-2.5 h-2.5" />
                    <span className="hidden sm:inline">Full</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Isi Konten Translator (Hanya Tampil Jika Tidak Diminimalkan) */}
            {topBoxMode !== "minimized" && (
              <>

            {/* Area Hasil Terjemahan (Scrollable & Responsive) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3 space-y-2.5 text-xs">
              {isTranslating ? (
                <div className="h-full min-h-[140px] flex flex-col items-center justify-center gap-2 text-emerald-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                  <span className="font-medium animate-pulse">
                    Menerjemahkan teks berharakat & Latin...
                  </span>
                </div>
              ) : translateError ? (
                <div className="p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{translateError}</p>
                    <button
                      type="button"
                      onClick={() => handleTranslate()}
                      className="mt-1 text-[11px] underline hover:text-white"
                    >
                      Coba lagi
                    </button>
                  </div>
                </div>
              ) : translateResult ? (
                <div className="space-y-2">
                  {/* Kotak Tulisan Arab Berharakat */}
                  <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] pb-1 border-b border-slate-800/70">
                      <span className="font-bold uppercase tracking-wider text-emerald-400">
                        العربية (Teks Arab Berharakat):
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => playAudio(translateResult.arabic, "translate")}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-emerald-700 text-emerald-300 hover:text-white border border-slate-700 flex items-center gap-1 transition-colors text-[10px]"
                          title="Dengar pelafalan audio Arab"
                        >
                          <Volume2 className="w-3 h-3 text-emerald-400" />
                          <span>Dengar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyTranslate(translateResult.arabic, "arabic")}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Salin Teks Arab"
                        >
                          {copiedTranslateType === "arabic" ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div
                      dir="rtl"
                      className="font-serif text-lg sm:text-xl font-bold text-teal-100 leading-relaxed tracking-wide select-text text-right"
                    >
                      {translateResult.arabic}
                    </div>
                  </div>

                  {/* Kotak Transliterasi Latin */}
                  {translateResult.latin && (
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2 shadow-sm space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold uppercase tracking-wider text-sky-400">
                          Transliterasi Latin (Cara Baca):
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyTranslate(translateResult.latin, "latin")}
                          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-sky-300 transition-colors"
                          title="Salin Transliterasi Latin"
                        >
                          {copiedTranslateType === "latin" ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Salin</span>
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm text-sky-200/90 italic font-medium leading-relaxed select-text">
                        {translateResult.latin}
                      </p>
                    </div>
                  )}

                  {/* Kotak Terjemahan Indonesia */}
                  <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-2 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Arti / Terjemahan:
                    </span>
                    <p className="text-xs text-slate-200 font-medium leading-relaxed select-text">
                      {translateResult.indonesian}
                    </p>
                  </div>

                  {/* Catatan Kosakata / Kaidah (Bila Ada) */}
                  {translateResult.notes && (
                    <div className="text-[11px] text-emerald-300/90 bg-emerald-950/30 p-2 rounded-xl border border-emerald-900/50 leading-relaxed flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-emerald-300">Catatan Kaidah: </span>
                        <span>{translateResult.notes}</span>
                      </div>
                    </div>
                  )}

                  {/* Aksi Sinergi: Kirim / Tanya ke Chat Referensi di Bawah */}
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const prompt = `Jelaskan kaidah tata bahasa (Nahwu/Shorof), i'rab, dan kosa kata dari kalimat berikut:\n${translateResult.arabic}\n(${translateResult.latin}) - "${translateResult.indonesian}"`;
                        handleSendRefMessage(prompt);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-800/60 flex items-center gap-1 transition-colors"
                      title="Kirim kalimat ini ke Chat Referensi di bawah untuk dibahas kaidahnya"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Bahas Kaidah di Chat Bawah</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetPractice({
                          arabic: translateResult.arabic,
                          latin: translateResult.latin,
                          translation:
                            translateResult.indonesian || translateResult.arabic,
                        });
                        setLiveTranscript("");
                        setValidationResult(null);
                        setActiveMobileTab("center");
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-teal-950/80 hover:bg-teal-900 text-teal-300 border border-teal-800/60 flex items-center gap-1 transition-colors"
                      title="Jadikan target kalimat latihan bicara di Ruang Bicara (Kolom Tengah)"
                    >
                      <Target className="w-3 h-3 text-teal-300" />
                      <span>Latih di Ruang Bicara</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[140px] flex flex-col items-center justify-center p-3 text-center text-slate-400">
                  <div className="w-8 h-8 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-emerald-400 mb-1.5 shadow-inner">
                    <Languages className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-slate-200 mb-0.5">
                    Penerjemah Indonesia ➔ Arab
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Ketik kalimat di bawah untuk mendapatkan teks Arab berharakat lengkap dan bacaan Latin.
                  </p>
                </div>
              )}
            </div>

            {/* Harakat Pintas untuk Input Terjemahan jika Arah Arab ke ID */}
            {translateDirection === "ar-id" && (
              <div className="shrink-0 p-1 bg-slate-950/90 border-t border-slate-800 flex items-center gap-1 overflow-x-auto">
                <span className="text-[10px] text-slate-400 font-medium px-1 shrink-0">
                  Harakat:
                </span>
                <div className="flex items-center gap-1">
                  {ARABIC_SHORTCUTS.map((sc, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => insertTranslateArabicChar(sc.char)}
                      title={sc.label}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-emerald-700 hover:text-white text-slate-200 border border-slate-700 flex items-center justify-center font-serif text-xs transition-colors"
                    >
                      {sc.char}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form Translator */}
            <div className="shrink-0 p-2 bg-slate-900 border-t border-slate-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTranslate();
                }}
                className="flex items-center gap-1.5"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={translateInput}
                    onChange={(e) => setTranslateInput(e.target.value)}
                    placeholder={
                      translateDirection === "id-ar"
                        ? "Ketik kalimat Indonesia (mis: 'Saya sedang belajar')..."
                        : "اكتب هنا بالعربية..."
                    }
                    dir={translateDirection === "ar-id" ? "rtl" : "ltr"}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner pr-7"
                    disabled={isTranslating}
                  />
                  {translateInput && (
                    <button
                      type="button"
                      onClick={() => setTranslateInput("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-slate-300"
                      title="Hapus input"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!translateInput.trim() || isTranslating}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-semibold transition-all shadow-md shrink-0 flex items-center gap-1"
                  title="Terjemahkan Teks"
                >
                  {isTranslating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Terjemah</span>
                </button>
              </form>
            </div>
          </>
        )}
      </section>

          {/* ----------------------------------------------------------------------- */}
          {/* BARIS BAWAH: CHAT REFERENSI TEKS (TETAP SAMA SEPERTI SEBELUMNYA)       */}
          {/* ----------------------------------------------------------------------- */}
          <section
            className={`flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all duration-200 ${
              bottomBoxMode === "minimized" ? "shrink-0" : "flex-1 min-h-0"
            }`}
          >
            {/* Header Kolom Kiri */}
            <div
              onClick={() => {
                if (bottomBoxMode === "minimized") handleBottomMode("normal");
              }}
              className={`shrink-0 bg-slate-900 border-b border-slate-800 p-2 sm:p-2.5 flex items-center justify-between ${
                bottomBoxMode === "minimized" ? "cursor-pointer hover:bg-slate-800/60" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-sky-950 border border-sky-800/60 flex items-center justify-center text-sky-400">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h2 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5">
                    Chat Referensi Teks
                    <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      🔇 Tanpa Suara
                    </span>
                    {bottomBoxMode === "minimized" && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/50">
                        Diminimalkan
                      </span>
                    )}
                    {bottomBoxMode === "full" && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-sky-900/80 text-sky-200 border border-sky-700/60">
                        Full
                      </span>
                    )}
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    Kaidah Nahwu/Shorof, tabel tasrif & mufradat
                  </p>
                </div>
              </div>

              {/* Tombol Kontrol: Minimize, Buka, Full */}
              <div className="flex items-center bg-slate-950/90 p-0.5 rounded-lg border border-slate-800 text-[10px]" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => handleBottomMode("minimized")}
                  className={`px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors ${
                    bottomBoxMode === "minimized"
                      ? "bg-amber-950/90 text-amber-300 font-bold border border-amber-800/50"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Minimize kotak referensi"
                >
                  <Minus className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">Min</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBottomMode("normal")}
                  className={`px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors ${
                    bottomBoxMode === "normal"
                      ? "bg-slate-800 text-sky-300 font-bold border border-slate-700"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Buka normal (bagi dua kolom)"
                >
                  <Minimize2 className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">Buka</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBottomMode("full")}
                  className={`px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors ${
                    bottomBoxMode === "full"
                      ? "bg-sky-600 text-white font-bold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Tampilan layar penuh (kotak penerjemah minimize)"
                >
                  <Maximize2 className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">Full</span>
                </button>
              </div>
            </div>

            {/* Isi Konten Chat Referensi (Hanya Tampil Jika Tidak Diminimalkan) */}
            {bottomBoxMode !== "minimized" && (
              <>
                {/* Message List Referensi dengan FormattedMessage (Format Rapih & Support Tabel) */}
                <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3 space-y-3 text-xs sm:text-sm">
                  {refMessages.length === 0 ? (
                    <div className="h-full min-h-[140px] flex flex-col items-center justify-center p-3 text-center text-slate-400">
                      <div className="w-8 h-8 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-sky-400 mb-1.5 shadow-inner">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-semibold text-slate-200 mb-0.5">
                        Chat Referensi Teks
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-xs">
                        Ketik pertanyaan kaidah Nahwu/Shorof, rumus tasrif, atau mufradat di bawah.
                      </p>
                    </div>
                  ) : (
                    refMessages.map((msg) => {
                const isAi = msg.sender === "ai";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isAi ? "items-start w-full" : "items-end"
                    }`}
                  >
                    <div
                      className={`rounded-2xl p-3 shadow-md ${
                        isAi
                          ? "w-full bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-sm"
                          : "max-w-[90%] bg-sky-700 text-white rounded-tr-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] opacity-75 mb-1.5 pb-1 border-b border-slate-800">
                        <span className="font-semibold text-sky-300">
                          {isAi ? "Marja' Lughawi (Referensi AI)" : "Anda"}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>

                      {/* Rendering via FormattedMessage: Rapih, Parsing Bold/Lists & Tabel Berbingkai */}
                      <FormattedMessage
                        content={msg.text}
                        theme={isAi ? "sky" : "slate"}
                      />
                    </div>
                  </div>
                );
              })
            )}

              {isRefLoading && (
                <div className="flex items-center gap-2 p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-sky-300">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                  <span>Menyusun kaidah referensi & tabel bahasa Arab...</span>
                </div>
              )}

              <div ref={refMessagesEndRef} />
            </div>

            {/* Virtual Diacritics Pintas Harakat Kolom Referensi */}
            <div className="shrink-0 p-1.5 bg-slate-950/90 border-t border-slate-800 flex items-center gap-1 overflow-x-auto">
              <span className="text-[10px] text-slate-400 font-medium px-1 shrink-0">
                Harakat:
              </span>
              <div className="flex items-center gap-1">
                {ARABIC_SHORTCUTS.map((sc, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => insertRefArabicChar(sc.char)}
                    title={sc.label}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-slate-800 hover:bg-sky-700 hover:text-white text-slate-200 border border-slate-700 flex items-center justify-center font-serif text-xs sm:text-sm transition-colors"
                  >
                    {sc.char}
                  </button>
                ))}
              </div>
            </div>

                {/* Form Input Kolom Referensi */}
                <div className="shrink-0 p-2 sm:p-2.5 bg-slate-900 border-t border-slate-800">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendRefMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={refInputText}
                      onChange={(e) => setRefInputText(e.target.value)}
                      placeholder="Tanyakan kaidah Nahwu, mufradat, tabel tasrif..."
                      className="flex-1 bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-inner"
                      disabled={isRefLoading}
                    />
                    <button
                      type="submit"
                      disabled={!refInputText.trim() || isRefLoading}
                      className="p-1.5 sm:p-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all shadow-md shrink-0"
                      title="Kirim Pertanyaan Referensi (Tanpa Suara)"
                    >
                      <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </section>
        </div>

        {/* ========================================================================= */}
        {/* 2. KOLOM TENGAH: RUANG BICARA SAYA                                        */}
        {/*    ATAS: REKOMENDASI JAWABAN (DAPAT DI ZOOM + / - FONT ARAB & LATIN)      */}
        {/*    BAWAH: KOTAK KONTROL AUDIO STICKY COMPACT                              */}
        {/* ========================================================================= */}
        <section
          className={`lg:col-span-4 h-full min-h-0 flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl ${
            activeMobileTab === "center" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Header Kolom Tengah */}
          <div className="shrink-0 bg-slate-900 border-b border-slate-800 p-2 sm:p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-950 border border-teal-800/60 flex items-center justify-center text-teal-400">
                <User className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5">
                  Ruang Bicara Saya
                  <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Latihan Kalam
                  </span>
                </h2>
              </div>
            </div>

            {/* Pilihan Bahasa Mikrofon */}
            <button
              onClick={() =>
                setSpeechLang(speechLang === "ar-SA" ? "id-ID" : "ar-SA")
              }
              className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 flex items-center gap-1"
              title="Ganti bahasa pengenalan suara mikrofon"
            >
              <Languages className="w-3 h-3 text-teal-400" />
              <span>{speechLang === "ar-SA" ? "العربية (ar)" : "Indonesia (id)"}</span>
            </button>
          </div>

          {/* AREA BACA & REKOMENDASI (DAPAT DI-SCROLL, RUANG LUAS) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-2.5 space-y-2">
            {/* TOOLBAR ZOOM / SKALA UKURAN FONT (ARAB & LATIN) */}
            <div className="bg-slate-950/80 border border-teal-900/40 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1 shadow-sm text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-200 truncate">
                  Rekomendasi Jawaban
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  ({currentAiSpeech.recommendations.length})
                </span>
              </div>

              {/* Kontrol Penyesuaian Ukuran Font (+) / (-) */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Kontrol Huruf Arab */}
                <div
                  className="flex items-center gap-0.5 bg-slate-900 px-1 py-0.5 rounded-lg border border-slate-800"
                  title="Atur ukuran font teks Arab (+ / -)"
                >
                  <span className="text-[10px] text-emerald-400 font-bold font-serif px-0.5">ع</span>
                  <button
                    onClick={() => setArabicFontSize((prev) => Math.max(14, prev - 2))}
                    className="p-0.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
                    title="Perkecil huruf Arab (-)"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] text-slate-300 font-mono w-4 text-center">
                    {arabicFontSize}
                  </span>
                  <button
                    onClick={() => setArabicFontSize((prev) => Math.min(48, prev + 2))}
                    className="p-0.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
                    title="Perbesar huruf Arab (+)"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Kontrol Huruf Latin */}
                <div
                  className="flex items-center gap-0.5 bg-slate-900 px-1 py-0.5 rounded-lg border border-slate-800"
                  title="Atur ukuran font transliterasi Latin (+ / -)"
                >
                  <span className="text-[10px] text-teal-400 font-bold px-0.5">abc</span>
                  <button
                    onClick={() => setLatinFontSize((prev) => Math.max(10, prev - 1))}
                    className="p-0.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
                    title="Perkecil huruf Latin (-)"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] text-slate-300 font-mono w-4 text-center">
                    {latinFontSize}
                  </span>
                  <button
                    onClick={() => setLatinFontSize((prev) => Math.min(24, prev + 1))}
                    className="p-0.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
                    title="Perbesar huruf Latin (+)"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Reset Ukuran */}
                <button
                  onClick={() => {
                    setArabicFontSize(24);
                    setLatinFontSize(13);
                  }}
                  className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded"
                  title="Reset ukuran font standar"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* DAFTAR PILIHAN REKOMENDASI UNTUK DIUCAPKAN */}
            <div className="space-y-2">
              {currentAiSpeech.recommendations.map((rec, idx) => {
                const isSelected = targetPractice.arabic === rec.arabic;
                const isOptionAudioPlaying =
                  isAiSpeaking && playingAudioId === `option-${idx}`;
                const isOptionAudioLoading =
                  isAiAudioLoading && playingAudioId === `option-${idx}`;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setTargetPractice(rec);
                      setValidationResult(null);
                      setLiveTranscript("");
                    }}
                    className={`group border rounded-xl p-2.5 transition-all space-y-1.5 shadow-md cursor-pointer ${
                      isSelected
                        ? "bg-teal-950/40 border-teal-500/70 ring-1 ring-teal-500/40"
                        : "bg-slate-950/80 hover:bg-teal-950/20 border-slate-800 hover:border-teal-700/50"
                    }`}
                    title="Klik untuk memilih kalimat ini sebagai target latihan bicara"
                  >
                    {/* Header Card dengan Badge Target */}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-slate-400">
                        Opsi {idx + 1}
                      </span>
                      {isSelected && (
                        <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>Target Latihan Aktif</span>
                        </span>
                      )}
                    </div>

                    {/* 1. Tulisan Arab dengan ukuran dinamis */}
                    <div
                      dir="rtl"
                      style={{ fontSize: `${arabicFontSize}px` }}
                      className="font-serif text-teal-100 font-bold leading-relaxed transition-all"
                    >
                      {rec.arabic}
                    </div>

                    {/* 2. Di bawah nya Tulisan Latin */}
                    {rec.latin && (
                      <div
                        style={{ fontSize: `${latinFontSize}px` }}
                        className="text-teal-300/90 italic font-medium transition-all"
                      >
                        {rec.latin}
                      </div>
                    )}

                    {/* 3. Di bawah nya Arti terjemahan */}
                    {rec.translation && (
                      <div
                        style={{ fontSize: `${Math.max(11, latinFontSize)}px` }}
                        className="text-slate-300 transition-all leading-normal"
                      >
                        {rec.translation}
                      </div>
                    )}

                    {/* Footer: Tombol Dengar Audio di Kiri, Aksi Praktik & Kirim di Kanan */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-800/60">
                      {/* Sisi Kiri: Tombol Bacakan Teks Arab (Audio TTS) untuk Latihan Mengucap */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isOptionAudioPlaying) {
                            stopAudio();
                          } else {
                            // Sinkronkan juga target latihan agar langsung siap diucapkan di kotak bawah
                            setTargetPractice(rec);
                            setValidationResult(null);
                            setLiveTranscript("");
                            playAudio(rec.arabic, `option-${idx}`);
                          }
                        }}
                        className={`text-[10px] sm:text-[11px] px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all shadow-sm ${
                          isOptionAudioPlaying
                            ? "bg-emerald-600 text-white border-emerald-400 font-bold shadow-emerald-950/60 animate-pulse"
                            : isOptionAudioLoading
                            ? "bg-slate-800 text-emerald-300 border-emerald-500/50"
                            : "bg-slate-900/90 hover:bg-emerald-950/60 text-emerald-300 hover:text-emerald-200 border-slate-700 hover:border-emerald-600/70"
                        }`}
                        title={
                          isOptionAudioPlaying
                            ? "Hentikan pemutaran audio pelafalan Arab"
                            : "Dengarkan pelafalan Arab opsi ini untuk latihan mengucap sebelum bicara ke AI"
                        }
                      >
                        {isOptionAudioPlaying ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-white animate-pulse" />
                            <span>Stop Suara</span>
                          </>
                        ) : isOptionAudioLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 text-emerald-300 animate-spin" />
                            <span>Memuat...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                            <span>Dengar Arab</span>
                          </>
                        )}
                      </button>

                      {/* Sisi Kanan: Latih Kalimat Ini & Kirim Langsung */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTargetPractice(rec);
                            setValidationResult(null);
                            setLiveTranscript("");
                          }}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-colors ${
                            isSelected
                              ? "bg-teal-600 text-white border-teal-500 font-bold shadow-sm"
                              : "bg-slate-800 hover:bg-slate-700 text-teal-300 border-slate-700"
                          }`}
                          title="Jadikan kalimat ini target latihan bicara di bawah"
                        >
                          <Target className="w-3 h-3 text-teal-300" />
                          <span>{isSelected ? "Sedang Dilatih" : "Latih Kalimat Ini"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendVoiceMessage(rec.arabic);
                          }}
                          className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-teal-700 text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors border border-slate-700"
                          title="Langsung kirimkan jawaban ini ke Mudarris AI tanpa latihan bicara"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>Kirim Langsung</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Riwayat Percakapan Suara Pengguna (Ringkas) */}
            {messages.filter((m) => m.sender === "user").length > 0 && (
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-2 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Riwayat Suara Terakhir:
                </span>
                <div className="space-y-1 max-h-24 overflow-y-auto text-xs">
                  {messages
                    .filter((m) => m.sender === "user")
                    .slice(-2)
                    .map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => setLiveTranscript(msg.text)}
                        className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/80 text-slate-200 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                        title="Klik untuk memasukkan kembali teks ini ke kotak ucapan"
                      >
                        <span
                          className="font-serif text-emerald-300 leading-relaxed flex-1"
                          style={{ fontSize: `${Math.max(16, arabicFontSize - 4)}px` }}
                          dir="rtl"
                        >
                          {msg.text}
                        </span>
                        <span className="text-[9px] text-slate-500 shrink-0">
                          {msg.timestamp}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* KOTAK KONTROL BICARA AUDIO DI KOLOM TENGAH (STICKY DI BAWAH)              */}
          {/* ========================================================================= */}
          <div className="shrink-0 bg-slate-950/95 border-t border-slate-800 p-2 sm:p-2.5 backdrop-blur-md shadow-2xl space-y-2">
            {/* 1. KOTAK TEKS BAHASA ARAB TARGET & ARTI NYA (LATIHAN BICARA / KALAM) */}
            <div className="bg-slate-900/95 border border-teal-800/70 rounded-xl p-2.5 shadow-md space-y-1.5 transition-all">
              {/* Header Kotak Target: Judul, Indikator Wajib Benar, & Tombol Aksi */}
              <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-800/80 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-md bg-teal-950 border border-teal-800/60 flex items-center justify-center text-teal-400 shrink-0">
                    <Target className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-200 truncate">
                    Target Latihan Bicara
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-800/70 font-semibold hidden sm:inline">
                    Validasi Wajib Benar
                  </span>
                </div>

                {/* Pintas Pemilihan Rekomendasi 1, 2, 3 & Dengar Audio Target */}
                <div className="flex items-center gap-1 shrink-0">
                  {currentAiSpeech.recommendations.map((rec, i) => {
                    const isRecActive = targetPractice.arabic === rec.arabic;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setTargetPractice(rec);
                          setValidationResult(null);
                          setLiveTranscript("");
                          setIsEditingTranscript(false);
                        }}
                        className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                          isRecActive
                            ? "bg-teal-600 text-white border-teal-500 font-bold shadow-sm"
                            : "bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700"
                        }`}
                        title={`Pilih Opsi ${i + 1} sebagai target kalimat latihan`}
                      >
                        Opsi {i + 1}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => playAudio(targetPractice.arabic, "target")}
                    disabled={isAiAudioLoading}
                    className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 flex items-center gap-1 transition-colors"
                    title="Dengarkan contoh pelafalan audio teks Arab target ini"
                  >
                    <Volume2 className="w-3 h-3 text-teal-400" />
                    <span className="hidden sm:inline">Dengar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                    className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 transition-colors ${
                      isEditingTranscript
                        ? "bg-teal-600 text-white border-teal-500"
                        : "bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700"
                    }`}
                    title="Edit teks target latihan secara manual"
                  >
                    <Pencil className="w-2.5 h-2.5" />
                    <span className="hidden sm:inline">{isEditingTranscript ? "Tutup" : "Kustom"}</span>
                  </button>
                </div>
              </div>

              {/* Teks Arab Berharakat Target (Dapat Disesuaikan Ukurannya) */}
              {isEditingTranscript ? (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Edit Kalimat Target:</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingTranscript(false)}
                      className="text-teal-400 font-semibold hover:underline"
                    >
                      Simpan & Selesai
                    </button>
                  </div>
                  <textarea
                    value={targetPractice.arabic}
                    onChange={(e) =>
                      setTargetPractice((prev) => ({
                        ...prev,
                        arabic: e.target.value,
                      }))
                    }
                    dir="rtl"
                    rows={2}
                    style={{ fontSize: `${Math.max(20, arabicFontSize - 2)}px` }}
                    className="w-full bg-slate-950/80 border border-teal-600/70 rounded-lg p-2 font-serif text-teal-100 font-bold leading-relaxed focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none shadow-inner"
                    placeholder="Masukkan kalimat Arab target..."
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={targetPractice.latin}
                      onChange={(e) =>
                        setTargetPractice((prev) => ({
                          ...prev,
                          latin: e.target.value,
                        }))
                      }
                      placeholder="Transliterasi Latin..."
                      className="bg-slate-950/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-teal-300 italic focus:outline-none focus:border-teal-500"
                    />
                    <input
                      type="text"
                      value={targetPractice.translation}
                      onChange={(e) =>
                        setTargetPractice((prev) => ({
                          ...prev,
                          translation: e.target.value,
                        }))
                      }
                      placeholder="Arti bahasa Indonesia..."
                      className="bg-slate-950/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div
                    dir="rtl"
                    style={{ fontSize: `${Math.max(20, arabicFontSize)}px` }}
                    className="font-serif text-teal-100 font-bold leading-relaxed transition-all tracking-wide"
                  >
                    {targetPractice.arabic}
                  </div>

                  {/* Transliterasi Latin */}
                  {targetPractice.latin && (
                    <div
                      style={{ fontSize: `${Math.max(11, latinFontSize)}px` }}
                      className="text-teal-300/90 italic font-medium leading-tight"
                    >
                      {targetPractice.latin}
                    </div>
                  )}

                  {/* Arti Bahasa Indonesia ("sertakan juga arti nya") */}
                  <div className="text-[11px] sm:text-xs text-slate-200 bg-slate-950/80 border border-slate-800/80 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5 leading-snug">
                    <span className="text-amber-400 font-bold shrink-0">🇮🇩 Arti:</span>
                    <span className="text-slate-200 font-medium">
                      {targetPractice.translation || "Arti belum dicantumkan"}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* 2. AREA INDIKATOR SUARA PEREKAMAN (STT REAL-TIME) */}
            {isRecording ? (
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-red-950/40 border border-red-500/50 rounded-xl text-xs animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                <span className="text-[10px] font-bold text-red-400 uppercase shrink-0">
                  {speechLang === "ar-SA" ? "Mendengarkan Arab:" : "Mendengarkan ID:"}
                </span>
                <span className="truncate flex-1 font-serif text-xs sm:text-sm text-emerald-200 font-bold">
                  {liveTranscript || "Katakan kalimat di atas dengan jelas..."}
                </span>
              </div>
            ) : liveTranscript && !validationResult ? (
              <div className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 shrink-0">Ucapan Anda:</span>
                  <span className="truncate font-serif text-xs sm:text-sm text-emerald-300 font-bold" dir="rtl">
                    {liveTranscript}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleValidateSpeech(liveTranscript)}
                  className="px-2 py-0.5 bg-teal-600 hover:bg-teal-500 text-white rounded text-[10px] font-semibold flex items-center gap-1 shrink-0"
                >
                  <Check className="w-2.5 h-2.5" />
                  <span>Uji Validasi</span>
                </button>
              </div>
            ) : null}

            {/* 3. KARTU VALIDASI UCAPAN: WAJIB DIULANGI JIKA SALAH, AI HANYA MERESPON JIKA BENAR */}
            {validationResult && (
              <div
                className={`p-2 sm:p-2.5 rounded-xl border text-xs space-y-1.5 transition-all shadow-md ${
                  validationResult.isValid
                    ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-200"
                    : "bg-rose-950/40 border-rose-500/60 text-rose-200"
                }`}
              >
                {/* Header Status Validasi */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    {validationResult.isValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-bold text-xs sm:text-sm">
                      {validationResult.isValid
                        ? `Mumtaz! Ucapan Anda Benar (${validationResult.score}%)`
                        : `Ucapan Belum Tepat (${validationResult.score}%) — Wajib Diulangi!`}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold shrink-0 ${
                      validationResult.isValid
                        ? "bg-emerald-900/80 text-emerald-200 border border-emerald-700/60"
                        : "bg-rose-900/80 text-rose-200 border border-rose-700/60"
                    }`}
                  >
                    {validationResult.isValid ? "Respon Dibuka ✅" : "AI Ditahan ⏸️"}
                  </span>
                </div>

                {/* Pesan Petunjuk / Feedback Interaktif */}
                <p className="text-[11px] leading-relaxed opacity-90">
                  {validationResult.isValid
                    ? isAutoSending
                      ? "🚀 Pelafalan fasih dan akurat! Mudarris AI sedang menyiapkan balasan kalam..."
                      : "Māsyā Allāh! Pelafalan Anda tepat. Silakan kirimkan jawaban ini ke Mudarris AI."
                    : "Pelafalan Anda belum sesuai target kalimat. AI belum merespon. Silakan ulangi ucapan sampai benar untuk melanjutkan percakapan!"}
                </p>

                {/* Analisis Kata-per-Kata (Word-by-word Breakdown) */}
                {validationResult.wordMatches && validationResult.wordMatches.length > 0 && (
                  <div className="pt-1 border-t border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-[9px] text-slate-400">
                      <span className="uppercase font-bold">Evaluasi Kata:</span>
                      <span className="font-mono">
                        {validationResult.matchedCount} dari {validationResult.totalWords} kata cocok
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1" dir="rtl">
                      {validationResult.wordMatches.map((wm, i) => (
                        <span
                          key={i}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-serif border transition-all ${
                            wm.matched
                              ? "bg-emerald-900/60 text-emerald-200 border-emerald-600/60"
                              : "bg-rose-900/70 text-rose-100 border-rose-500/70 animate-pulse font-bold"
                          }`}
                          title={wm.matched ? "Pelafalan benar" : "Kata ini salah atau terlewat saat bicara"}
                        >
                          {wm.word} {wm.matched ? "✓" : "✗"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tombol Tindakan Cepat Jika Salah: Dengar Contoh / Ulangi Bicara */}
                {!validationResult.isValid && (
                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => playAudio(targetPractice.arabic, "target")}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-700 flex items-center gap-1 transition-colors"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Dengar Contoh</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => startRecording()}
                      className="text-[10px] px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1 shadow-sm transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Ulangi Bicara Sekarang</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 4. DRAWER SIMULASI / TEST INPUT MANUAL (MEMUDAHKAN PENGUJIAN) */}
            {showTestSpeechInput && (
              <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-2 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-semibold text-teal-300">Uji Validasi via Teks (Tanpa Mikrofon):</span>
                  <button
                    type="button"
                    onClick={() => setShowTestSpeechInput(false)}
                    className="hover:text-white"
                  >
                    Tutup
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={testSpeechInputText}
                    onChange={(e) => setTestSpeechInputText(e.target.value)}
                    dir="rtl"
                    placeholder="Ketik teks Arab untuk diuji..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 font-serif text-xs text-emerald-300 focus:outline-none focus:border-teal-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleValidateSpeech(testSpeechInputText);
                        setLiveTranscript(testSpeechInputText);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleValidateSpeech(testSpeechInputText);
                      setLiveTranscript(testSpeechInputText);
                    }}
                    className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs"
                  >
                    Uji
                  </button>
                </div>
              </div>
            )}

            {/* 5. TOMBOL KONTROL BICARA UTAMA & TOMBOL KIRIM */}
            <div className="flex items-center justify-between gap-2">
              {/* Tombol Bicara Utama (Compact, Tahan/Ketuk) */}
              <button
                type="button"
                onMouseDown={handleHoldStart}
                onMouseUp={handleHoldEnd}
                onTouchStart={handleHoldStart}
                onTouchEnd={handleHoldEnd}
                onClick={() => {
                  if (!isHoldingButtonRef.current) {
                    startRecording();
                  }
                }}
                className={`flex-1 py-1.5 sm:py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm transition-all shadow-md select-none ${
                  isRecording
                    ? "bg-red-600 hover:bg-red-500 text-white ring-2 ring-red-500/50 animate-pulse"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-950/40 active:scale-95"
                }`}
                title={
                  isRecording
                    ? "Lepas atau ketuk untuk berhenti dan validasi ucapan"
                    : "Tahan atau ketuk tombol untuk mulai latihan bicara"
                }
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4 animate-bounce" />
                    <span>Lepas/Selesai & Validasi</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Tahan / Ketuk untuk Bicara</span>
                  </>
                )}
              </button>

              {/* Tombol Uji Input Manual (Ikon Pensil Kecil) */}
              <button
                type="button"
                onClick={() => setShowTestSpeechInput(!showTestSpeechInput)}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-teal-300 border border-slate-800"
                title="Buka kotak tes ucapan manual (bisa ketik untuk uji coba)"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>

              {/* Opsi Kirim Otomatis saat Benar */}
              <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer select-none bg-slate-900 px-2 py-1.5 rounded-xl border border-slate-800 shrink-0">
                <input
                  type="checkbox"
                  checked={autoSendVoice}
                  onChange={(e) => setAutoSendVoice(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-800 w-3 h-3"
                />
                <span className="hidden sm:inline">Auto-Kirim jika Benar</span>
                <span className="sm:hidden">Auto</span>
              </label>

              {/* Tombol Kirim Manual (Terkunci jika belum valid / masih salah - Cukup Icon Saja Saat Terkunci) */}
              <button
                type="button"
                onClick={() => {
                  if (validationResult?.isValid) {
                    handleSendVoiceMessage(targetPractice.arabic);
                  }
                }}
                disabled={!validationResult?.isValid || isAiThinking || isAutoSending}
                className={`rounded-xl text-xs font-bold flex items-center justify-center transition-all shadow-sm ${
                  validationResult?.isValid
                    ? "px-3 py-1.5 gap-1.5 bg-teal-600 hover:bg-teal-500 text-white shadow-teal-950/50 animate-pulse"
                    : "p-2 bg-slate-800/80 text-slate-500 border border-slate-700/40 cursor-not-allowed"
                }`}
                title={
                  validationResult?.isValid
                    ? "Kirimkan jawaban terverifikasi ke Mudarris AI"
                    : "Terkunci: Ucapan wajib divalidasi benar terlebih dahulu agar AI merespon"
                }
              >
                {validationResult?.isValid ? (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Kirim ke AI</span>
                  </>
                ) : (
                  <Lock className="w-4 h-4 text-slate-500" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. KOLOM PALING KANAN: MUDARRIS AI (STICKY AVATAR + SCROLLABLE TEXT)       */}
        {/* ========================================================================= */}
        <section
          className={`lg:col-span-4 h-full min-h-0 flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl ${
            activeMobileTab === "right" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* 1. KOTAK MUDARRIS AI STICKY DI ATAS (Header, Avatar Animasi, Status, Waveform, Audio Player) */}
          <div className="shrink-0 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md shadow-md">
            {/* Header Kolom Kanan */}
            <div className="p-2 sm:p-2.5 flex items-center justify-between border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h2 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5 flex-wrap">
                    Mudarris AI (Ustadz)
                    <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Kalam Berharakat
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedScenarioId(activeScenarioId);
                        setCustomScenarioPrompt(activeScenarioPrompt);
                        setShowScenarioModal(true);
                      }}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 flex items-center gap-1 transition-colors"
                      title="Klik untuk mengubah suasana atau skenario percakapan"
                    >
                      <span>{currentScenario.emoji}</span>
                      <span>{currentScenario.name}</span>
                      <SlidersHorizontal className="w-2.5 h-2.5 opacity-70" />
                    </button>
                  </h2>
                </div>
              </div>

              {/* Status Mini / Badge */}
              <div className="flex items-center gap-1.5 text-[10px]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isAiSpeaking
                      ? "bg-emerald-400 animate-ping"
                      : isAiAudioLoading
                      ? "bg-teal-400 animate-pulse"
                      : isAiThinking
                      ? "bg-amber-400 animate-pulse"
                      : "bg-emerald-500"
                  }`}
                />
                <span className="text-slate-400 font-medium">
                  {isAiSpeaking
                    ? "Melafalkan"
                    : isAiAudioLoading
                    ? "Audio..."
                    : isAiThinking
                    ? "Menyusun..."
                    : "Siap Bicara"}
                </span>
              </div>
            </div>

            {/* Avatar AI & Kontrol Pemutar Audio */}
            <div className="p-2 sm:p-2.5 bg-slate-950/40">
              {/* Baris Utama: Avatar Lingkaran di Kiri (Tanpa Wording), Kontrol Audio di Kanan */}
              <div className="flex items-center gap-2.5">
                {/* 1. Kiri: Avatar Lingkaran AI (Cukup Lingkaran Saja Tanpa Wording) */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-md ${
                      isAiSpeaking
                        ? "border-emerald-400 bg-emerald-950/80 ring-4 ring-emerald-500/25 scale-105"
                        : isAiAudioLoading
                        ? "border-teal-400 bg-teal-950/60 ring-2 ring-teal-500/20 animate-pulse"
                        : isAiThinking
                        ? "border-amber-400 bg-amber-950/50 ring-2 ring-amber-500/20 animate-pulse"
                        : "border-slate-800 bg-slate-900/90 hover:border-slate-700"
                    }`}
                    title={
                      isAiSpeaking
                        ? "Mudarris AI sedang melafalkan kalam"
                        : isAiAudioLoading
                        ? "Memuat audio kalam..."
                        : isAiThinking
                        ? "AI sedang menyusun balasan..."
                        : "Mudarris AI siap bicara"
                    }
                  >
                    <span className="text-xl sm:text-2xl select-none leading-none">
                      {isAiSpeaking ? "🗣️" : isAiAudioLoading ? "🔊" : isAiThinking ? "💭" : "🗣️"}
                    </span>
                  </div>

                  {/* Status Ping Dot di Tepi Lingkaran */}
                  {(isAiSpeaking || isAiAudioLoading || isAiThinking) && (
                    <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          isAiSpeaking ? "bg-emerald-400" : "bg-amber-400"
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                          isAiSpeaking
                            ? "bg-emerald-500 border-2 border-slate-900"
                            : "bg-amber-500 border-2 border-slate-900"
                        }`}
                      />
                    </span>
                  )}
                </div>

                {/* 2. Kanan: Kotak Kontrol Pemutar Audio */}
                <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5 px-2.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs shadow-sm">
                  <div className="flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => {
                        if (
                          isAiSpeaking &&
                          (playingAudioId === "ai-speech" || !playingAudioId)
                        ) {
                          stopAudio();
                        } else {
                          playAudio(currentAiSpeech.arabic, "ai-speech");
                        }
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold transition-all ${
                        isAiSpeaking &&
                        (playingAudioId === "ai-speech" || !playingAudioId)
                          ? "bg-emerald-500 text-white shadow-md animate-pulse"
                          : "bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700"
                      }`}
                      title="Dengarkan ulang pelafalan bahasa Arab dari Mudarris AI"
                    >
                      {isAiSpeaking &&
                      (playingAudioId === "ai-speech" || !playingAudioId) ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Hentikan</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Dengar Bahasa Arab</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setSpeechSpeed(speechSpeed === 1.0 ? 0.75 : 1.0)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-medium whitespace-nowrap"
                      title="Atur kecepatan audio pelan (0.75x) atau normal (1.0x)"
                    >
                      {speechSpeed}x {speechSpeed === 0.75 && "(Tartil)"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
                    <span className="text-[10px] text-slate-400">Suara Otomatis</span>
                    <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={autoPlayAudio}
                        onChange={(e) => setAutoPlayAudio(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-800 w-3 h-3"
                      />
                      <span>Autoplay</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Waveform Visualizer saat AI Bersuara dengan Jarak Longgar (Tidak Menempel) */}
              {isAiSpeaking &&
                (playingAudioId === "ai-speech" || !playingAudioId) && (
                  <div className="mt-2.5 px-3 py-2 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-between gap-2 shadow-sm animate-fadeIn">
                  <div className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-300">
                      AI sedang melafalkan suara...
                    </span>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-900/80 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="w-1.5 h-4 bg-emerald-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-2.5 bg-emerald-300 rounded-full animate-pulse" />
                    <span className="w-1.5 h-5 bg-emerald-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-3 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="w-1.5 h-4 bg-emerald-300 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  </div>
                </div>
              )}

              {/* Peringatan Autoplay jika diblokir browser */}
              {audioBlocked && (
                <div className="mt-2 w-full bg-amber-950/90 border border-amber-500/80 rounded-xl p-1.5 text-center flex flex-col items-center gap-1 shadow-lg animate-bounce">
                  <span className="text-[10px] font-bold text-amber-300">
                    Browser Membatasi Pemutaran Audio Otomatis
                  </span>
                  <button
                    onClick={() => {
                      unlockAudio();
                      setAudioBlocked(false);
                      playAudio(currentAiSpeech.arabic);
                    }}
                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg"
                  >
                    🔊 Buka & Dengarkan Suara AI
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. TEKS DI BAWAH NYA: HANYA INI YANG DI-SCROLL */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-2.5 space-y-2">
            <div className="bg-slate-950/90 border border-emerald-900/40 rounded-2xl p-2.5 sm:p-3 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800 text-slate-400">
                <span className="font-semibold text-emerald-300 flex items-center gap-1 text-[11px]">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Kalam yang Sedang Dibicarakan AI:
                </span>
                <button
                  onClick={() =>
                    handleCopyText(
                      `${currentAiSpeech.arabic}\n${currentAiSpeech.latin}\n${currentAiSpeech.translation}`,
                      "kalam"
                    )
                  }
                  className="p-1 hover:text-slate-200"
                  title="Salin teks ini"
                >
                  {copiedText === "kalam" ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* A. TULISAN BAHASA ARAB YANG AI SEDANG BICARAKAN */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span>العربية (Teks Arab Berharakat):</span>
                  </span>

                  {/* Tombol Dengar Bahasa Arab */}
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        isAiSpeaking &&
                        (playingAudioId === "ai-speech" || !playingAudioId)
                      ) {
                        stopAudio();
                      } else {
                        playAudio(currentAiSpeech.arabic, "ai-speech");
                      }
                    }}
                    className={`text-[10px] sm:text-[11px] px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                      isAiSpeaking &&
                      (playingAudioId === "ai-speech" || !playingAudioId)
                        ? "bg-emerald-500 text-white shadow-emerald-950/50 animate-pulse"
                        : isAiAudioLoading && playingAudioId === "ai-speech"
                        ? "bg-teal-900/60 text-teal-300 border border-teal-700/60"
                        : "bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 hover:text-white border border-emerald-700/60"
                    }`}
                    title="Dengarkan ulang pelafalan bahasa Arab dari Mudarris AI"
                  >
                    {isAiSpeaking &&
                    (playingAudioId === "ai-speech" || !playingAudioId) ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Hentikan</span>
                      </>
                    ) : isAiAudioLoading && playingAudioId === "ai-speech" ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-300" />
                        <span>Memuat...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Dengar Bahasa Arab</span>
                      </>
                    )}
                  </button>
                </div>

                <div
                  dir="rtl"
                  style={{ fontSize: `${Math.max(18, arabicFontSize)}px` }}
                  className="font-serif text-emerald-100 font-bold leading-relaxed p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80 shadow-inner"
                >
                  {currentAiSpeech.arabic}
                </div>
              </div>


              {/* B. BAWAH NYA LATIN */}
              <div className="space-y-0.5">
                <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">
                  Transliterasi Latin:
                </span>
                <p
                  style={{ fontSize: `${latinFontSize}px` }}
                  className="text-teal-200/90 italic font-medium leading-relaxed"
                >
                  {currentAiSpeech.latin}
                </p>
              </div>

              {/* C. BAWAH NYA LAGI ARTI NYA */}
              <div className="space-y-0.5 pt-0.5 border-t border-slate-800/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Arti (Bahasa Indonesia):
                </span>
                <p
                  style={{ fontSize: `${Math.max(11, latinFontSize)}px` }}
                  className="text-slate-300 leading-relaxed"
                >
                  {currentAiSpeech.translation}
                </p>
              </div>

              {/* Catatan / Mufradat bila ada dengan FormattedMessage */}
              {currentAiSpeech.notes && (
                <div className="mt-1.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px] text-slate-300">
                  <span className="font-bold text-amber-300 block mb-0.5">
                    💡 Catatan Kosakata / Kaidah:
                  </span>
                  <FormattedMessage
                    content={currentAiSpeech.notes}
                    theme="emerald"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* MODAL PENGATURAN SUASANA & SKENARIO PERCAKAPAN */}
      {showScenarioModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-emerald-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-900/60 border border-emerald-700/60 flex items-center justify-center text-emerald-300 shadow-inner">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                    Suasana & Skenario Percakapan
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Garda AI Gemma 4
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Arahkan konteks percakapan, kosakata khusus, dan peran Mudarris AI
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScenarioModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-300">
              {/* Insight Rekomendasi (Hybrid Approach) */}
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-200/90 text-xs leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-300">Rekomendasi Fleksibilitas (Hybrid): </span>
                  Pilih salah satu <strong>Preset Pilihan Cepat</strong> di bawah untuk langsung mengaktifkan topik dan mufradat teruji, atau <strong>edit / tuliskan instruksi bebas (Freetext)</strong> di kotak bawah untuk skenario khusus yang Anda inginkan.
                </div>
              </div>

              {/* Bagian 1: Pilihan Cepat (Presets) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <span>1. Pilihan Suasana Populer (Preset Cepat):</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {CONVERSATION_SCENARIOS.length} Pilihan Tersedia
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CONVERSATION_SCENARIOS.map((sc) => {
                    const isSelected = selectedScenarioId === sc.id;
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => {
                          setSelectedScenarioId(sc.id);
                          if (sc.id !== "custom") {
                            setCustomScenarioPrompt(sc.prompt);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? "bg-emerald-950/60 border-emerald-500 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500"
                            : "bg-slate-800/60 border-slate-700 hover:bg-slate-800 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{sc.emoji}</span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold text-xs ${isSelected ? "text-emerald-300" : "text-slate-200"}`}>
                                  {sc.name}
                                </span>
                                {sc.id === "kantor" && <Building2 className="w-3 h-3 text-emerald-400" />}
                                {sc.id === "sekolah" && <GraduationCap className="w-3 h-3 text-emerald-400" />}
                                {sc.id === "rumah" && <Home className="w-3 h-3 text-emerald-400" />}
                                {sc.id === "pasar" && <ShoppingBag className="w-3 h-3 text-emerald-400" />}
                                {sc.id === "santai" && <Coffee className="w-3 h-3 text-emerald-400" />}
                                {sc.id === "pemula" && <Target className="w-3 h-3 text-emerald-400" />}
                                {sc.id === "custom" && <Sparkles className="w-3 h-3 text-emerald-400" />}
                              </div>
                              <span className="block text-[10px] text-slate-400 font-medium">
                                Kategori: {sc.category}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                          {sc.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bagian 2: Teks Bebas (Freetext) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <span>2. Detail Instruksi & Topik Kustom (Freetext):</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Bebas diedit atau ditambah detail
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={customScenarioPrompt}
                    onChange={(e) => {
                      setCustomScenarioPrompt(e.target.value);
                    }}
                    placeholder="Contoh: Simulasikan percakapan saat check-in hotel di Madinah, atau tawar-menawar gamis di toko..."
                    className="w-full bg-slate-950/90 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none leading-relaxed"
                  />
                  {customScenarioPrompt && (
                    <button
                      type="button"
                      onClick={() => setCustomScenarioPrompt("")}
                      className="absolute top-2.5 right-2.5 text-[10px] text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
                    >
                      Bersihkan
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  * Teks instruksi di atas akan disematkan ke Mudarris AI agar balasan, kosakata, dan simulasi kalam menyesuaikan dengan situasi yang Anda tentukan.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedScenarioId("santai");
                  setCustomScenarioPrompt(CONVERSATION_SCENARIOS[0].prompt);
                }}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors text-center"
              >
                Reset ke Default (Santai)
              </button>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowScenarioModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:bg-slate-800 border border-slate-700 transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveScenarioId(selectedScenarioId);
                    setActiveScenarioPrompt(customScenarioPrompt);
                    setShowScenarioModal(false);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-800/60 transition-colors shadow-sm"
                  title="Simpan pengaturan suasana untuk percakapan berikutnya"
                >
                  Terapkan Pengaturan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleApplyAndStartScenario(selectedScenarioId, customScenarioPrompt);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/60 flex items-center justify-center gap-1.5 transition-all"
                  title="Terapkan suasana dan langsung kirimkan salam pembuka baru ke Mudarris AI"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-white" />
                  <span>Terapkan & Mulai Obrolan Baru</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BANTUAN SUARA & DIAGNOSIS MIKROFON */}
      {showVoiceHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-amber-950/40">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-slate-100">
                  Panduan & Diagnosis Masalah Suara (Mic / Audio)
                </h3>
              </div>
              <button
                onClick={() => setShowVoiceHelpModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="bg-emerald-950/40 border border-emerald-800/40 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4" /> 1. Uji Pengeras Suara (Audio AI)
                </h4>
                <p>
                  Pastikan speaker / earphone perangkat Anda berfungsi memutar pelafalan bahasa Arab.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={runAudioTest}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" /> Putar Suara Sampel
                  </button>
                  {testAudioStatus && (
                    <span className="text-xs font-medium text-emerald-300">
                      {testAudioStatus}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-teal-300 flex items-center gap-1.5">
                  <Mic className="w-4 h-4" /> 2. Status Dukungan Mikrofon Browser
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Web Speech API:</span>
                  {micSupported ? (
                    <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      ✓ Didukung oleh browser Anda
                    </span>
                  ) : (
                    <span className="text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded border border-red-800">
                      ✗ Tidak didukung di browser ini
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl space-y-3">
                <h4 className="font-bold text-amber-300">
                  3. Solusi Jika Mikrofon Tidak Merekam:
                </h4>
                <ol className="list-decimal pl-5 space-y-2 text-slate-300">
                  <li>
                    <strong>Izin Mikrofon (Chrome / Edge):</strong> Klik ikon gembok 🔒 di sebelah kiri URL, ubah <strong>Mikrofon</strong> menjadi <strong>Izinkan (Allow)</strong>.
                  </li>
                  <li>
                    <strong>Browser Brave:</strong> Buka <code>brave://settings/privacy</code> lalu aktifkan <em>"Use Google services for speech recognition"</em>.
                  </li>
                  <li>
                    <strong>Mac OS Settings:</strong> Buka <em>System Settings → Privacy & Security → Microphone</em>, pastikan browser dicentang aktif.
                  </li>
                </ol>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setShowVoiceHelpModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                Tutup & Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REKOMENDASI AI & ARSITEKTUR */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-emerald-950/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-slate-100">
                  Arsitektur 3 Kolom & Model AI
                </h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <div className="bg-emerald-950/30 border border-emerald-800/40 p-3.5 rounded-xl space-y-1">
                <h4 className="font-bold text-emerald-300">
                  1. Penjelasan Tata Letak 3 Kolom
                </h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    <strong>Kolom Kiri (2 Baris - Terjemah & Referensi):</strong>
                    <div className="pl-2 mt-0.5 space-y-0.5 text-xs text-slate-300">
                      <div>• <strong>Baris Atas (Penerjemah Arab & Latin):</strong> Menerjemahkan kalimat ke teks Arab berharakat lengkap (tasykil) dan bacaan Latin, lengkap dengan tombol dengar audio dan salin teks.</div>
                      <div>• <strong>Baris Bawah (Chat Referensi Teks):</strong> Chat rujukan tanpa suara untuk kaidah Nahwu, mufradat, dan tabel tasrif fi&apos;il.</div>
                    </div>
                  </li>
                  <li>
                    <strong>Kolom Tengah (Ruang Bicara Saya):</strong> Menampilkan rekomendasi pilihan jawaban (Arab, Latin, Arti) dengan pengatur skala ukuran font (+ / -) serta kontrol bicara sticky compact di bawah.
                  </li>
                  <li>
                    <strong>Kolom Kanan (Mudarris AI):</strong> Kotak avatar Mudarris AI sticky di atas dengan animasi, visualizer suara, dan kontrol pemutar audio, serta area teks kalam Arab berharakat + Latin + Terjemahan di bawahnya yang dapat di-scroll independen.
                  </li>
                </ul>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/60 p-3.5 rounded-xl space-y-1">
                <h4 className="font-bold text-teal-300">
                  2. Engine LLM & TTS
                </h4>
                <p>
                  Menggunakan model <strong>Gemma 4</strong> (<code>gemma4:e4b</code>) via Garda AI API dan server audio multi-chunk streaming berharakat.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
