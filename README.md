# Realtime Coding Arena + AI Interview Platform

A hackathon-ready coding platform with realtime race rooms, AI interview mode, AI question generation, contest mode, and analytics.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand, Monaco Editor, Sonner, Recharts
- **Backend:** Next.js API Routes + separate Node.js socket.io server
- **Database:** PostgreSQL, Drizzle ORM
- **Auth:** Clerk
- **AI:** OpenAI / OpenRouter

## Setup

1. Copy `env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` (Clerk dashboard)
   - `DATABASE_URL` (PostgreSQL, e.g. Neon or Supabase)
   - `NEXT_PUBLIC_SOCKET_URL` (e.g. `http://localhost:3001`)
   - `OPENROUTER_API_KEY` (for AI features - recommended) or `OPENAI_API_KEY`
   - Optional OpenRouter model overrides:
     - `OPENROUTER_MODEL_QUESTION` (default: `openai/gpt-4o-mini`)
     - `OPENROUTER_MODEL_CODE` (default: `openai/gpt-4o-mini`)
     - `OPENROUTER_MODEL_INTERVIEW` (default: `openai/gpt-4o-mini`)
     - `OPENROUTER_MODEL_DEFAULT` (default: `openai/gpt-4o-mini`)
   - Optional OpenRouter headers:
     - `OPENROUTER_HTTP_REFERER` (default: `https://coding-arena.com`)
     - `OPENROUTER_X_TITLE` (default: `Coding Arena`)

2. Install and generate DB:
   ```bash
   npm install
   npx drizzle-kit generate
   npx drizzle-kit migrate
   npm run seed
   ```

3. Run the app (two processes):
   ```bash
   npm run dev        # Next.js on :3000
   npm run server     # Socket.io on :3001
   ```
   Or both: `npm run dev:all`

## Features

- **Realtime Race:** Create room → share code → others join → Start race → same problem, independent code, Sonner toasts on run/submit/solve, countdown timer
- **AI Interview:** Chat with an AI interviewer
- **AI Question Generation:** Generate problems by level, company type, topic, source style
- **AI Code Analysis:** Get feedback on your code
- **Contests:** Codeforces-style contests (list and detail pages)
- **Analytics:** Submissions by day, problems solved, accuracy, streak (Recharts)

See `IMPLEMENTATION_PLAN.md` for full architecture and API details.
