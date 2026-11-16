#!/usr/bin/env bash

# ==============================================================================
# 🌿 Belajar Bahasa Arab Interaktif AI - Unified Startup Script
# Menjalankan Frontend (Next.js :3000) dan Backend (FastAPI :8001) secara bersamaan
# ==============================================================================

set -m # Enable job control

# Warna Terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Direktori Proyek
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -d "$SCRIPT_DIR/python_backend" ] && [ -f "$SCRIPT_DIR/package.json" ]; then
    ROOT_DIR="$SCRIPT_DIR"
elif [ -d "$SCRIPT_DIR/../belajar_bahasa_arab" ]; then
    ROOT_DIR="$(cd "$SCRIPT_DIR/../belajar_bahasa_arab" && pwd)"
elif [ -d "$SCRIPT_DIR/belajar_bahasa_arab" ]; then
    ROOT_DIR="$(cd "$SCRIPT_DIR/belajar_bahasa_arab" && pwd)"
else
    ROOT_DIR="$SCRIPT_DIR"
fi

BACKEND_DIR="$ROOT_DIR/python_backend"
LOG_DIR="$ROOT_DIR/.logs"
mkdir -p "$LOG_DIR"
BACKEND_LOG="$LOG_DIR/backend.log"

echo -e "${CYAN}${BOLD}"
echo "=================================================================="
echo "  🌿 BELAJAR BAHASA ARAB INTERAKTIF AI (مُدَرِّس الذَّكاء الاصطِناعي)"
echo "  🚀 Unified Launcher: Frontend (Next.js) & Backend (FastAPI)"
echo "=================================================================="
echo -e "${NC}"

# Cek Mode Argumen
MODE="full"
if [ "$1" == "--backend-only" ]; then
    MODE="backend"
elif [ "$1" == "--frontend-only" ]; then
    MODE="frontend"
elif [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "Penggunaan: ./run.sh [opsi]"
    echo "Opsi:"
    echo "  (tanpa opsi)      Jalankan Frontend (Next.js) & Backend (FastAPI) bersamaan"
    echo "  --backend-only    Hanya jalankan Backend FastAPI (port 8001)"
    echo "  --frontend-only   Hanya jalankan Frontend Next.js (port 3000)"
    echo "  --help, -h        Tampilkan bantuan ini"
    exit 0
fi

# 1. Validasi Tools (Node.js, npm, Python)
echo -e "${BLUE}🔍 Memeriksa dependensi sistem...${NC}"

if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}❌ Node.js tidak ditemukan! Silakan install Node.js terlebih dahulu.${NC}"
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo -e "${RED}❌ npm tidak ditemukan! Silakan install npm terlebih dahulu.${NC}"
    exit 1
fi

PYTHON_CMD=""
if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    echo -e "${RED}❌ Python 3 tidak ditemukan! Silakan install Python 3 terlebih dahulu.${NC}"
    exit 1
fi

echo -e "   ${GREEN}✓${NC} Node.js: $(node -v)"
echo -e "   ${GREEN}✓${NC} npm: v$(npm -v)"
echo -e "   ${GREEN}✓${NC} Python: $($PYTHON_CMD --version)"

# 2. Cek & Persiapkan Frontend (node_modules)
if [ "$MODE" != "backend" ]; then
    if [ ! -d "$ROOT_DIR/node_modules" ]; then
        echo -e "${YELLOW}📦 Menginstal dependensi Frontend (npm install)...${NC}"
        (cd "$ROOT_DIR" && npm install)
    fi
fi

# 3. Cek & Persiapkan Backend Python
if [ "$MODE" != "frontend" ]; then
    echo -e "${BLUE}🐍 Memeriksa paket Python Backend...${NC}"
    if ! "$PYTHON_CMD" -c "import fastapi, uvicorn, httpx, pydantic" >/dev/null 2>&1; then
        echo -e "${YELLOW}📦 Menginstal paket Python dari requirements.txt...${NC}"
        "$PYTHON_CMD" -m pip install -r "$BACKEND_DIR/requirements.txt"
    else
        echo -e "   ${GREEN}✓${NC} Paket FastAPI, Uvicorn, HTTPX & Pydantic siap."
    fi
fi

# Penanganan Sinyal Keluar (Graceful Shutdown)
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Menutup semua service yang sedang berjalan...${NC}"
    
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo -e "   🛑 Menghentikan Backend (PID: $BACKEND_PID)..."
        kill -TERM "$BACKEND_PID" 2>/dev/null || kill -9 "$BACKEND_PID" 2>/dev/null
    fi
    
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo -e "   🛑 Menghentikan Frontend (PID: $FRONTEND_PID)..."
        kill -TERM "$FRONTEND_PID" 2>/dev/null || kill -9 "$FRONTEND_PID" 2>/dev/null
    fi

    # Bersihkan port jika masih ada proses yang tertahan
    if [ "$MODE" != "frontend" ]; then
        STALE_BACKEND=$(lsof -ti:8001 2>/dev/null || true)
        if [ -n "$STALE_BACKEND" ]; then
            kill -9 $STALE_BACKEND 2>/dev/null || true
        fi
    fi

    echo -e "${GREEN}✅ Semua proses telah dihentikan dengan aman. Sampai jumpa!${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Bersihkan port 8001 terlebih dahulu jika ditempati proses lama
if [ "$MODE" != "frontend" ]; then
    OLD_BACKEND_PID=$(lsof -ti:8001 2>/dev/null || true)
    if [ -n "$OLD_BACKEND_PID" ]; then
        echo -e "${YELLOW}⚠️  Port 8001 sedang digunakan (PID: $OLD_BACKEND_PID). Mereset proses lama...${NC}"
        kill -9 $OLD_BACKEND_PID 2>/dev/null || true
        sleep 1
    fi
fi

# 4. Jalankan Backend FastAPI
if [ "$MODE" != "frontend" ]; then
    echo -e "\n${MAGENTA}${BOLD}🚀 Memulai Backend Python FastAPI (Port 8001)...${NC}"
    (cd "$BACKEND_DIR" && "$PYTHON_CMD" app.py > "$BACKEND_LOG" 2>&1) &
    BACKEND_PID=$!
    
    # Tunggu dan verifikasi health check backend
    echo -ne "   Menunggu FastAPI online..."
    HEALTHY=0
    for i in {1..20}; do
        if curl -s http://localhost:8001/api/health >/dev/null 2>&1; then
            HEALTHY=1
            break
        fi
        echo -ne "."
        sleep 0.5
    done
    echo ""

    if [ $HEALTHY -eq 1 ]; then
        echo -e "   ${GREEN}✓ Backend Berhasil Berjalan!${NC}"
        echo -e "     🔗 Health Endpoint: ${CYAN}http://localhost:8001/api/health${NC}"
        echo -e "     📚 Swagger API Docs: ${CYAN}http://localhost:8001/docs${NC}"
        echo -e "     📝 Log Output:       ${CYAN}$BACKEND_LOG${NC}"
    else
        echo -e "   ${RED}⚠️ Backend belum merespons dalam 10 detik. Periksa log:${NC} $BACKEND_LOG"
        tail -n 10 "$BACKEND_LOG"
    fi
fi

# Jika mode hanya backend, pantau log
if [ "$MODE" == "backend" ]; then
    echo -e "\n${GREEN}Tekan [Ctrl + C] untuk menghentikan server Backend.${NC}\n"
    tail -f "$BACKEND_LOG"
    wait $BACKEND_PID
    exit 0
fi

# 5. Jalankan Frontend Next.js
echo -e "\n${CYAN}${BOLD}🌐 Memulai Frontend Next.js (Port 3000)...${NC}"
echo -e "   🔗 Akses Web: ${BOLD}${GREEN}http://localhost:3000${NC}"
echo -e "   💡 Tekan ${BOLD}[Ctrl + C]${NC} di terminal ini untuk menghentikan seluruh service.\n"

cd "$ROOT_DIR"
npm run dev &
FRONTEND_PID=$!

# Tunggu proses selesai (dikontrol oleh sinyal Ctrl+C)
wait $FRONTEND_PID $BACKEND_PID
