---
description: Deployment Guide for Sangatamizh Music
---

# Deploy Live 🚀

Your project is ready for deployment! Follow these steps to put it online.

## 1. Backend (Railway)

This hosts your API and handles YouTube downloads.

1. Go to [Railway.app](https://railway.app) and create a new project.
2. Select **"Deploy from GitHub repo"**.
3. Choose your repository: `thamodharangm/sangatamizh-music`.
4. **Configuration**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
5. **Variables** (Add these in the Variables tab):
   - `SUPABASE_URL`: (Your Supabase Project URL)
   - `SUPABASE_SERVICE_ROLE_KEY`: (Your Supabase Service Role Key)
   - `YT_API_KEY`: (Optional, if you use the API route, otherwise yt-dlp works without it)

## 2. Frontend (Vercel)

This hosts your React User Interface.

1. Go to [Vercel.com](https://vercel.com) and add a new project.
2. Import from GitHub: `thamodharangm/sangatamizh-music`.
3. **Configuration**:
   - **Root Directory**: `client` (Click 'Edit' next to Root Directory)
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   - `VITE_API_URL`: The URL of your Railway Backend + `/api`.
     - Example: `https://sangtamizh-backend-production.up.railway.app/api`
     - _Important_: Do not forget the `/api` at the end if your backend routes start with it.

## 3. Final Check

Once both are deployed:

1. Open your Vercel URL.
2. The Home page should load songs from the backend.
3. Try playing a song (Music Player should work).
4. Check the "Admin" page to verify uploads work.
