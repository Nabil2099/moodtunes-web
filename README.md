# MoodTunes Web — AI Mood Based Music Player

An AI-powered music player that detects your mood and curates the perfect playlist.

## Features
- **Text Analysis** — Describe your feelings, custom ML classifier detects your mood
- **5-Question Quiz** — Answer emoji-based questions to uncover your vibe
- **Time-Based** — Automatic mood detection based on time of day
- **100+ Mock Tracks** — 20 tracks per mood (happy, sad, energetic, calm, focused)
- **Mini Player** — Bottom bar with play/pause/next, expands to full-screen

## Tech Stack
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion + Zustand
- **Backend**: Node.js + Express + TypeScript + Prisma (SQLite) + Custom ML Classifier

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/moodtunes-web.git
cd moodtunes-web

# Install all dependencies
npm run install:all

# Set up the database
cd server && npx prisma db push && cd ..

# Start dev server (client + server)
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Production Build

```bash
# Build the client
cd client && npm run build

# Start the production server (serves API + client)
cd ../server && npm run build && npm start
```

## Environment Variables

Create `server/.env`:
```
PORT=3001
DATABASE_URL="file:./dev.db"
```

## Deployment

See deployment instructions for:
- **Render** (recommended, free tier)
- **Railway**
- **VPS with PM2**

in the sections below.

### Deploy to Render (Free)

1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo
4. Settings:
   - Build command: `cd client && npm install && npm run build && cd ../server && npm install && npx prisma generate && npx prisma db push && npm run build`
   - Start command: `cd server && node dist/index.js`
   - Environment variables: `DATABASE_URL=file:./dev.db`, `PORT=3001`, `NODE_ENV=production`

### Deploy to Railway

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add environment variables in the dashboard
4. Railway auto-detects Node.js

## License
MIT
