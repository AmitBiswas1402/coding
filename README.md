<div align="center">

# 🏁 Keep Coding — Realtime Coding Arena

### Race, Practice & Level Up Your Code

Compete with friends in real-time coding races, prepare for interviews with AI, solve 150+ curated problems, and climb the leaderboard.

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🏎️ **Realtime Race Rooms** | Create a room, share the code, race friends on the same problem live |
| 🤖 **AI Interview Mode** | Conversational AI interviewer that adapts questions to your level |
| 🧠 **AI Code Analysis** | Get instant AI feedback on time complexity, style, and correctness |
| 📝 **AI Question Generation** | Generate problems by topic, difficulty, company style, or source |
| 🏆 **Contests** | Codeforces-style timed contests with live ranking boards |
| 📊 **Analytics Dashboard** | LeetCode-style heatmap, streak tracking, difficulty breakdown, AI weakness analysis |
| 💻 **Monaco Code Editor** | VS Code–powered editor with syntax highlighting and multi-language support |
| 🌐 **150+ Problems** | Seeded LeetCode 150 problem set with topics and difficulty |

---

## 🛠️ Tech Stack

**Frontend**
- [Next.js 16](https://nextjs.org) (App Router + Turbopack)
- TypeScript, Tailwind CSS
- [shadcn/ui](https://ui.shadcn.com) + [Framer Motion](https://framer.com/motion) for bento grid animations
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the code editor
- [Zustand](https://zustand-demo.pmnd.rs/) for state management
- Recharts for graphs

**Backend**
- Next.js API Routes (REST)
- Node.js + Socket.IO (`server/index.ts`) for realtime race rooms
- [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL (Neon)

**Auth & AI**
- [Clerk](https://clerk.com) for authentication
- [OpenRouter](https://openrouter.ai) (OpenAI-compatible) for all AI features

---

## 🚀 Getting Started (Local)

### Prerequisites
- Node.js 20+
- A [Neon](https://neon.tech) or any PostgreSQL database
- A [Clerk](https://dashboard.clerk.com) account
- An [OpenRouter](https://openrouter.ai) API key

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/AmitBiswas1402/coding.git
cd coding
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Set up environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

Open `.env` and set:

```env
# Clerk (from dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# PostgreSQL (Neon, Supabase, or local)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Socket server (for local dev)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3000
SOCKET_PORT=3001

# OpenRouter AI
OPENROUTER_API_KEY=sk-or-v1-...
```

### Step 4 — Set up the database

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
npm run seed
```

> This creates all tables and seeds the 150 LeetCode problems.

### Step 5 — Run the app

You need **two terminals** (Next.js + Socket.IO server):

```bash
# Terminal 1 — Next.js frontend + API
npm run dev

# Terminal 2 — Socket.IO server for race rooms
npm run server
```

Or run both at once:

```bash
npm run dev:all
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker (Self-hosted)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Step 1 — Build the image

```bash
docker build -t keep-coding .
```

> This runs a 3-stage build: installs deps → builds Next.js → creates a lean runner image. Takes ~2–3 minutes on first run.

### Step 2 — Run the container

```bash
docker run -p 3000:3000 -p 3001:3001 \
  -e DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... \
  -e CLERK_SECRET_KEY=sk_live_... \
  -e NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in \
  -e NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up \
  -e NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard \
  -e NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard \
  -e OPENROUTER_API_KEY=sk-or-v1-... \
  -e NEXT_PUBLIC_SOCKET_URL=http://localhost:3001 \
  -e CORS_ORIGIN=http://localhost:3000 \
  -e SOCKET_PORT=3001 \
  keep-coding
```

Open [http://localhost:3000](http://localhost:3000).

Both services start automatically inside the container:
- **:3000** → Next.js app
- **:3001** → Socket.IO server (race rooms)

### Step 3 (optional) — Use an env file instead

Create a file called `docker.env`:

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
OPENROUTER_API_KEY=sk-or-v1-...
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3000
SOCKET_PORT=3001
```

Then run:

```bash
docker run -p 3000:3000 -p 3001:3001 --env-file docker.env keep-coding
```

### Useful Docker commands

```bash
# List running containers
docker ps

# View logs
docker logs <container-id>

# Stop the container
docker stop <container-id>

# Remove old image and rebuild fresh
docker rmi keep-coding
docker build -t keep-coding .
```

---

## ☁️ Vercel Deployment

The Next.js app is deployable to Vercel. The Socket.IO server must be hosted separately (Railway, Render, or Fly.io).

**1. Deploy Next.js to Vercel**

Push to GitHub, import at [vercel.com](https://vercel.com), and add these env vars in the dashboard:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL         = /sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL         = /sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL   = /dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL   = /dashboard
DATABASE_URL
OPENROUTER_API_KEY
NEXT_PUBLIC_SOCKET_URL                = https://your-socket-server.railway.app
```

**2. Deploy Socket server to Railway**

- New project → Deploy from GitHub → set start command: `npx tsx server/index.ts`
- Add env vars: `CORS_ORIGIN=https://your-app.vercel.app`, `DATABASE_URL`, `SOCKET_PORT=3001`
- Copy the Railway public URL → set as `NEXT_PUBLIC_SOCKET_URL` in Vercel → Redeploy

---

## 📦 What Was Built & Added

### UI & Design
- **Animated landing page** with Web3-style gradient background
- **Bento grid layout** across the entire analytics dashboard with Framer Motion enter animations and color-coded hover effects
- **LeetCode-style activity heatmap** — year-view, 14×14px cells, correct month label alignment, green-gradient intensity
- **Difficulty donut ring** (SVG) for Easy/Medium/Hard breakdown
- **Streak cards** with current streak, max streak, acceptance rate, active days
- **AI Weakness Analysis section** with per-topic accuracy bars
- **Recent Submissions table** in bento motion style
- Favicon served via `app/icon.svg` (Next.js App Router file convention)

### Infrastructure
- **Standalone Docker build** — 3-stage Dockerfile (deps → builder → runner), entrypoint script running both Next.js + Socket.IO
- **Vercel-ready config** — `vercel.json`, removed `output: "standalone"` for Vercel compatibility
- `.env.example` documenting all required environment variables
- `.dockerignore` for clean Docker builds

---

## 🐛 Issues Fixed

| Issue | Fix |
|---|---|
| Favicon not showing | Replaced `icons` metadata with `app/icon.svg` file convention (Next.js auto-generates correct MIME type) |
| Heatmap month labels misaligned | Switched from dynamic CSS widths to absolute pixel positioning using `stride = CELL(14) + GAP(3) = 17px` |
| Bento cards too dark / low contrast | Upgraded backgrounds from `zinc-900` → `zinc-800`, borders from `zinc-800` → `zinc-600`, text to `zinc-100` |
| Docker build failing (fake SHA digests) | Rewrote Dockerfile using valid `node:20-alpine` base images |
| `output: standalone` breaking Vercel | Removed from `next.config.ts` — Vercel uses its own bundling pipeline |
| Analytics API missing fields | Extended `/api/analytics/me` with `difficultyBreakdown`, `maxStreak`, `recentSubmissions` |

---

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages + API routes
│   ├── dashboard/          # Main app (practice, analytics, race, interview, contest)
│   ├── api/                # REST API endpoints
│   └── (auth)/             # Clerk sign-in / sign-up pages
├── components/             # Reusable UI components
│   ├── editor/             # Monaco code editor wrapper
│   ├── race/               # Race room components
│   ├── contest/            # Contest timer + ranking board
│   └── ui/                 # shadcn/ui primitives
├── lib/
│   ├── ai/                 # OpenRouter prompts + client
│   ├── db/                 # Drizzle schema + database client
│   └── sandbox/            # Code execution sandbox
├── server/                 # Socket.IO server (runs separately)
├── drizzle/                # DB migrations
└── scripts/                # Database seeding scripts
```

---

## 📄 License

MIT — feel free to use, fork, and build on top of this.
