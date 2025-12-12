# 🚀 Deployment Guide: Sangatamizh Music

This guide covers how to deploy the **Backend** to Render and the **Frontend** to Vercel.

---

## 🏗️ 1. Backend Deployment (Render)

1.  **Push Code to GitHub**: Ensure your latest code is on GitHub (we just did this!).
2.  **Create New Web Service**:
    - Go to dashboard.render.com
    - Click "New +" -> "Web Service".
    - Connect your GitHub repository `sangatamizh-music-premium`.
3.  **Configure Settings**:
    - **Root Directory**: `backend` (Important!)
    - **Environment**: `Node`
    - **Build Command**: `npm install && npm run build` (or `npm install && npx prisma generate`)
    - **Start Command**: `npm start`
4.  **Environment Variables**:

    - Add the following variables in the "Environment" tab:
      - `DATABASE_URL`: Your Postgres connection string (e.g. from Supabase or Neon).
      - `Direct_Url`: (If using Supabase/Prisma) Same as DB URL usually or specific direct link.
      - `PORT`: `3002` (Optional, Render assigns one automatically usually, but app listens on 3002 default).
      - `YT_API_KEY`: (Optional) Your YouTube API Key.
      - `YOUTUBE_COOKIES`: (Optional) If you have them.

5.  **Deploy**: Click "Create Web Service". Wait for it to show "Live".
6.  **Copy URL**: Copy your new backend URL (e.g., `https://sangatamizh-backend.onrender.com`).

---

## 🎨 2. Frontend Deployment (Vercel)

1.  **Create New Project**:
    - Go to vercel.com
    - Button "Add New..." -> "Project".
    - Import `sangatamizh-music-premium`.
2.  **Configure Settings**:
    - **Root Directory**: `client` (Important! Click Edit next to Root Directory and select `client`).
    - **Framework**: Vite (Should auto-detect).
    - **Build Command**: `npm run build` (Default).
    - **install Command**: `npm install` (Default).
3.  **Environment Variables**:
    - Add the variable:
      - `VITE_API_URL`: Paste your **Render Backend URL** here (e.g., `https://sangatamizh-backend.onrender.com/api`).
      - _Note: Ensure you add `/api` at the end if your Config expects it, OR just the base and code adds `/api` - checking code: `baseURL: env.VITE_API_URL || '/api'`. If you set it to `...onrender.com/api`, it uses that. If you set it to `...onrender.com` it might fallback to `/api` relative path which is wrong on Vercel. **Set it to the full API URL including /api**._
      - _Correction_: Code says `baseURL: import.meta.env.VITE_API_URL || '/api'`. So set `VITE_API_URL` to `https://your-backend.onrender.com/api`.
4.  **Deploy**: Click "Deploy".
5.  **Test**: Open your Vercel URL.

---

## ✅ Post-Deployment Checks

1.  Open Vercel App.
2.  Login (if using Firebase/Supabase credentials).
3.  Check "Tamil Hits" or "Recently Played" (should be empty initially) to verify Backend connection.
