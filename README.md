# 🌸 Bloomie

A focus, planning, and wellness dashboard with a cherry blossom aesthetic — combining a to-do list, Pomodoro-style focus timer, mood tracker, and personal diary in one calm daily workspace.

> ⚠️ **Status: In active development.** Core features are functional; polish, deployment, and additional features are ongoing. See [Roadmap](#roadmap) below.

## ✨ Features

- 🔐 **Authentication** — signup/login with JWT stored in httpOnly cookies
- ✅ **To Do List** — daily tasks that reset each day, with a browsable read-only history of past days
- 🎯 **Focus Timer** — Pomodoro-style sessions (25/50/70/80 min presets) with an alarm, ambient sound options, and session logging
- 😊 **Mood Tracker** — log your daily mood, later shown alongside diary entries
- 📔 **Diary** — daily journal entries tagged with that day's mood; only today's entry is editable, past entries are preserved as read-only
- 📊 **Tracking Panel** — focus sessions, total focus time vs. daily goal, and task completion rate

## 🛠️ Tech Stack

**Frontend:** Next.js (App Router), React, Tailwind CSS v4
**Backend:** Express.js, Prisma ORM
**Database:** PostgreSQL (hosted on Neon)
**Auth:** JWT in httpOnly cookies

## 📁 Project Structure
bloomie/
├── backend_bloomie/     # Express API — auth, tasks, mood, diary, focus sessions
└── frontend_bloomie/    # Next.js app — UI, proxied to the backend via rewrites

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A PostgreSQL database (e.g. free tier on [Neon](https://neon.tech))

### Backend setup
```bash
cd backend_bloomie
npm install
cp .env.example .env   # fill in your DATABASE_URL and JWT_SECRET
npx prisma generate
npx prisma migrate dev
npm run dev             # runs on http://localhost:5001
```

### Frontend setup
```bash
cd frontend_bloomie
npm install
npm run dev              # runs on http://localhost:3000
```

The frontend proxies `/api/*` requests to the backend automatically (see `next.config.mjs`).

## 🗺️ Roadmap

- [ ] Responsive/mobile polish
- [ ] Deploy backend + frontend (Render/Railway + Vercel)
- [ ] Email verification & password reset
- [ ] Weekly/monthly mood and focus history charts

## 📸 Screenshots

*(add a few screenshots here — dashboard, login, diary — makes a huge difference for anyone browsing your repo)*

## 📄 License

MIT