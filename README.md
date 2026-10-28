# 📌 Save — AI-Powered Action-Oriented Knowledge Vault

> **Save organizes content by WHY you saved it (Action Intent), not just what format it is.**  
> A cross-platform knowledge ingestion engine featuring instant AI intent classification, automated deadline tracking, bi-directional sync to external destinations (Notion, Google Sheets, Airtable, Spotify), real-time OLAP analytics telemetry, and Model Context Protocol (MCP) support for AI assistants.

---

## 📸 Application Showcase

### 1. Clips Vault (`/ #clips`)
The central knowledge repository indexing captured web clips, Reddit discussions, YouTube videos, Instagram reels, and articles. Features rich multi-dimensional filtering by **Action Intent**, source platform, content type, and deadlines, along with live destination sync badges.

![Save Clips Vault](docs/screenshots/clips_page.png)

---

### 2. Analytics & OLAP Insights (`/ #analytics`)
Real-time dimensional metrics and ingestion telemetry across all connected vaults. Displays rolling velocity, opportunity conversion rates, P95 pipeline sync latency (88ms), habit streaks, daily goals, and intent breakdowns.

![Save Analytics & OLAP Insights](docs/screenshots/analytics_page.png)

---

### 3. Home Dashboard (`/ #dashboard`)
An executive command center featuring urgent deadline countdowns, reading backlogs, live sync health, weekly activity digests, and quick-action opportunity cards.

![Save Dashboard](docs/screenshots/dashboard_page.png)

---

## 🎯 The 7 Action Intents

Traditional bookmark managers sort by media type (*article*, *video*, *PDF*). **Save** organizes by **user objective**:

| Intent | Purpose | Examples | Smart Action |
| :--- | :--- | :--- | :--- |
| 🎯 **`apply`** | Items with hard deadlines | Job postings, grants, fellowships, hackathons | ⏳ *Extract Deadline & Add to Calendar* |
| 📚 **`learn`** | In-depth educational material | System designs, tutorials, research papers | ⏱️ *Read Time & Mark as Studied* |
| 🛒 **`buy`** | Products, subscriptions, gear | Hardware deals, SaaS pricing, books | 🏷️ *Track Price & View Deal* |
| 🗓️ **`attend`** | Time-bound events & sessions | Webinars, Twitter spaces, meetups, demos | 📅 *Add to Google Calendar* |
| 🤝 **`hire`** | Portfolios & talent profiles | GitHub profiles, Dribbble portfolios, resumes | ✉️ *Contact & Outreach Queue* |
| 📈 **`track`** | Market & competitor intelligence | Competitor updates, earnings, changelogs | 📊 *Market Intel Feed* |
| 📌 **`other`** | General bookmarks & ideas | Quotes, aesthetic inspiration, memes | 🔖 *Vault Reference Bookmark* |

---

## 🏗️ Architecture & Stack Overview

```
Save/
├── backend/         # Django 5, DRF, Celery, PostgreSQL + pgvector, Redis, Gemini AI
├── web/             # React 19, TypeScript, Vite, Tailwind CSS, Recharts, Zustand
├── extension/       # Browser Extension (Chrome / Firefox / Edge) via WXT + React
├── mobile/          # Flutter Cross-Platform Client (iOS, Android, Windows, macOS)
├── mcp-server/      # Model Context Protocol (MCP) server for Claude Desktop / Cursor
├── clipper/         # Native helper utilities & content extraction engine
└── docs/screenshots/# High-resolution application screenshots
```

### Technology Matrix
- **Backend**: Python 3.12+, Django 5.x, Django REST Framework, Celery (asynchronous tasks)
- **Database & Cache**: PostgreSQL (Neon Serverless + `pgvector`), Redis 8.x
- **AI & Processing**: Google Gemini API (`gemini-flash` for summarization & intent detection, `gemini-embedding-001` for vector semantic search)
- **Frontend Web**: React 19, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts
- **Browser Extension**: WXT (Next-gen WebExtension framework), Manifest V3
- **Mobile**: Flutter 3.x, Dart, Riverpod / Provider state management
- **Integrations**: Google Sheets API, Notion API, Airtable, Spotify Web API, YouTube Music, Custom Webhooks, Brevo (Transactional Email)
- **AI Tooling**: Model Context Protocol (MCP) standard

---

## ⚡ Key Features

1. **Dual-Tier Intent Detection**:
   - **Tier 1 (0ms Heuristic Rule Engine)**: Instant keyword and domain matching (`greenhouse.io` $\rightarrow$ `apply`, `gumroad.com` $\rightarrow$ `buy`).
   - **Tier 2 (Gemini LLM Inference)**: Deep contextual analysis extracting core summaries, action intents, target audiences, and reading time estimates.

2. **Automated Deadline & Temporal Extraction**:
   - Scans text for dates, time zones, and deadlines (`deadline_extractor.py`).
   - Alerts users to expiring opportunities (<48 hours) on the home dashboard.

3. **Multi-Destination Bi-Directional Adapters**:
   - Automatically route saved clips into Notion databases, Google Sheets spreadsheets, or Airtable bases.
   - Detect music links (Spotify / YouTube Music) and append to designated playlists.

4. **Real-Time OLAP Telemetry & Habit Momentum**:
   - Track daily clipping habits, reading velocity, and pipeline latency metrics.
   - Visual Apple Fitness-style activity rings and weekly goals.

5. **AI Assistant Integration (MCP Server)**:
   - Connect Claude Desktop, Cursor, Zed, or Antigravity directly to your vault.
   - Use natural language to query, summarize, cite, and save clips right from your AI chat.

---

## 🚀 Quickstart Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [Python](https://www.python.org/) (3.11 or 3.12)
- [Redis](https://redis.io/) (Local or Windows Winget binary)

---

### Starting the Stack

#### 1. Start Redis
```powershell
redis-server
```

#### 2. Start Django Backend & Celery
```powershell
cd backend
.\.venv\Scripts\activate

# Run database migrations
python manage.py migrate

# Launch Celery worker (solo pool on Windows)
celery -A config worker -l info -P solo

# In another terminal: Launch Django API
python manage.py runserver 0.0.0.0:8000
```

#### 3. Start Web Frontend
```powershell
cd web
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

#### 4. Start Browser Extension Dev Mode
```powershell
cd extension
npm install
npm run dev
```

#### 5. Start Mobile App (Optional)
```powershell
cd mobile
flutter pub get
flutter run
```

---

## 🤖 MCP (Model Context Protocol) Integration

Connect **Save** with Claude Desktop or Cursor so your AI assistant can search and cite your vault:

### Claude Desktop Setup
Add this to `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "save": {
      "command": "python",
      "args": ["-m", "save_mcp.server"],
      "cwd": "C:\\path\\to\\Save\\Save\\mcp-server",
      "env": {
        "SAVE_API_KEY": "save_live_your_api_key",
        "SAVE_API_URL": "http://127.0.0.1:8000/api/v1"
      }
    }
  }
}
```

### Supported MCP Tools:
- `search_clips`: Hybrid semantic search with pgvector + keyword matching
- `list_clips`: Filter clips by Intent (`apply`, `learn`, `buy`, etc.)
- `get_clip`: Retrieve metadata, tags, and AI summary
- `read_clip_content`: Read the full extracted webpage text
- `save_clip`: Save a new bookmark or snippet directly from conversation
- `update_clip`: Modify tags, notes, or categorization

---

## 🔒 Environment Variables

Key configuration parameters inside `.env`:

```ini
DJANGO_SECRET_KEY='your-secret-key'
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
FRONTEND_URL=http://localhost:3000

# Database & Cache
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
REDIS_URL=redis://127.0.0.1:6379/0
CELERY_BROKER_URL=redis://127.0.0.1:6379/0

# Generative AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-flash-latest
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

# OAuth Integrations
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
```

---

## 🛑 Stopping the Stack

To cleanly terminate all running servers and background workers:

```powershell
..\stop_all_servers.ps1
```

---

## 📄 License
This project is proprietary and maintained for personal knowledge management, productivity intelligence, and research automation.
