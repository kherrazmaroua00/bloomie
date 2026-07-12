# 🌸 Bloomie

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=flat&logo=render&logoColor=white)

A focus, planning, and wellness dashboard with a cherry blossom aesthetic — combining a to-do list, Pomodoro-style focus timer, mood tracker, and personal diary in one calm daily workspace.

**🔗 Live demo:** [bloomie-three.vercel.app](https://bloomie-three.vercel.app)

> ⚠️ **Note:** The backend runs on Render's free tier, which spins down after inactivity. The first request after idle time may take 30–60 seconds to respond while the server wakes up.

## ✨ Features

- 🔐 **Authentication** — signup/login with JWT stored in httpOnly cookies
- ✅ **To Do List** — daily tasks that reset each day, with a browsable read-only history of past days
- 🎯 **Focus Timer** — Pomodoro-style sessions (25/50/70/80 min presets) with a Start/Pause/Resume/Cancel flow, an alarm, synthesized ambient sounds (Rain, Ocean, Stream, Night — no audio files needed), and automatic session logging
- 😊 **Mood Tracker** — log your daily mood with custom icons
- 📔 **Diary** — daily journal entries automatically tagged with that day's mood; only today's entry is editable, past entries are preserved as read-only
- 📊 **Tracking Panel** — focus sessions completed, total focus time vs. daily goal, and task completion rate
- 💬 **Daily motivational quote** — fetched from an external API and cached per calendar day, with a local fallback if the API is unavailable

## 🛠️ Tech Stack

**Frontend:** Next.js (App Router), React, Tailwind CSS v4
**Backend:** Express.js, Prisma ORM
**Database:** PostgreSQL (hosted on Neon)
**Auth:** JWT in httpOnly cookies
**Deployment:** Vercel (frontend) + Render (backend)

## 📁 Project Structure
bloomie/
├── backend_bloomie/     # Express API — auth, tasks, mood, diary, focus sessions, quotes

└── frontend_bloomie/    # Next.js app — UI, proxied to the backend via rewrites
## 🚀 Getting Started (Local Development)

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

The frontend proxies `/api/*` requests to the backend automatically (see `next.config.mjs`). In local dev this defaults to `http://localhost:5001`; in production it reads from the `BACKEND_URL` environment variable.

## 🌍 Deployment

- **Backend** is deployed on [Render](https://render.com) as a Node web service, connected to this repo's `backend_bloomie` folder
- **Frontend** is deployed on [Vercel](https://vercel.com), connected to this repo's `frontend_bloomie` folder
- Environment variables (`DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `BACKEND_URL`) are configured separately on each platform — see `.env.example` in `backend_bloomie` for the required backend variables

## 🗺️ Roadmap

- [x] Deploy backend + frontend (Render + Vercel)
- [ ] Responsive/mobile polish
- [ ] Email verification & password reset
- [ ] Weekly/monthly mood and focus history charts
- [ ] Custom domain

## 📸 Screenshots

**Sign Up / Login**

<img width="1091" height="676" alt="Screenshot 2026-07-11 at 02 11 28" src="https://github.com/user-attachments/assets/7359af2c-78b1-4c88-851a-37b2caf8b6dd" />

**Dashboard** — To Do List, Focus Timer, Mood Tracker, and Diary in one view

<img width="1122" height="688" alt="Bloomie dashboard" src="https://github.com/user-attachments/assets/ca7ee93d-2f0f-4121-a412-f7c0ab72dd7f" />

## 📄 License

MIT
