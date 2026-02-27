# 🤖 UltraChat AI – Total Suite

Kompletny, modularny system AI oparty na GPT-4o z backendem Node.js, frontendem PWA, SAFE AdSense, offline mode, gamifikacją i panelem admina.

## 📁 Struktura projektu

```
UltraChat AI/
├─ backend/
│  ├─ server.js          # Express API proxy
│  ├─ package.json
│  ├─ .env.example
│  ├─ logs/              # Dzienniki rozmów (auto-tworzone)
│  └─ backups/           # Backupy logów (auto-tworzone)
├─ frontend/
│  ├─ index.html         # Główny interfejs czatu
│  ├─ styles.css         # Motywy dark/light
│  ├─ chat.js            # Logika frontendu
│  ├─ admin.html         # Panel administratora
│  ├─ widget.js          # Osadzalny widget
│  ├─ manifest.json      # PWA manifest
│  └─ sw.js              # Service Worker
├─ README.md
└─ .gitignore
```

## 🚀 Uruchomienie

### 1️⃣ Backend
```bash
cd backend
cp .env.example .env
# Wstaw swój klucz OpenAI w .env
npm install
npm start
```

### 2️⃣ Frontend
```bash
npx http-server frontend -p 8080
# Otwórz: http://localhost:8080
```

## ✨ Funkcje

### Czat
- Prowadzenie rozmów z GPT-4o-mini (lub innym modelem)
- Multi-turn historia z localStorage
- Wiele osobowości AI: domyślna, formalna, humorystyczna, poetycka, futurystyczna

### Komendy (`/help` w czacie)
| Komenda | Opis |
|---------|------|
| `/image <opis>` | Generuj obraz DALL·E 3 |
| `/translate <tekst> [lang:XX]` | Tłumaczenie na dowolny język |
| `/lint ```lang\nkod``` ` | Lintowanie i audyt kodu |
| `/fix ```lang\nkod``` ` | Automatyczna naprawa kodu |
| `/docs <opis> [type:readme\|changelog\|api]` | Generowanie dokumentacji |
| `/analyze <kontekst>` | Proaktywna analiza i sugestie |
| `/rollback [n]` | Cofnij ostatnie n wymian |
| `/help` | Pomoc |

### Multimodalność
- 📎 Przesyłanie obrazów (JPG/PNG/GIF/WebP) → analiza GPT-4 Vision
- 🎙️ Wejście głosowe (STT) – przeglądarkowe Web Speech API
- 🔊 Odczyt głosowy (TTS) – Web Speech Synthesis

### PWA / Offline
- Instalacja jako aplikacja (manifest.json + service worker)
- Cache statycznych zasobów, offline fallback dla API
- Wskaźnik trybu offline

### Bezpieczeństwo
- Klucz API wyłącznie po stronie serwera
- Rate limiting: 30 req/min
- Moderacja treści (OpenAI Moderation API)
- Audit log każdej wiadomości

### SAFE AdSense
- Trzy placeholdery (top/middle/bottom), domyślnie ukryte
- Kontrola `ADSENSE_ENABLED=true/false` w `.env`
- Brak layout shift gdy wyłączone

### Gamifikacja
- ✨ XP za wysyłanie wiadomości, generowanie obrazów, lintowanie
- 🎖️ Odznaki: Pierwsze kroki, Gaduła, Twórca obrazów, Ekspert AI

### Panel Admina (`/admin.html`)
- Uptime, wiadomości dzisiaj, błędy, obrazy
- Lista plików logów
- Auto-refresh co 30s

### Widget (`widget.js`)
Osadź czat na dowolnej stronie:
```html
<script src="http://localhost:8080/widget.js" data-backend="http://localhost:3000"></script>
```

## ⚙️ Zmienne środowiskowe

| Zmienna | Opis | Domyślnie |
|---------|------|-----------|
| `OPENAI_API_KEY` | Klucz API OpenAI | wymagany |
| `OPENAI_MODEL` | Model AI | `gpt-4o-mini` |
| `ADSENSE_ENABLED` | Pokaż reklamy | `false` |
| `PORT` | Port serwera | `3000` |
| `BACKUP_INTERVAL_HOURS` | Co ile h robić backup logów | `24` |

## 📜 Licencja
MIT – Dominik Opałka 🚀
