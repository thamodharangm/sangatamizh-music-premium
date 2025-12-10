# 🚀 Deployment Guide: Netlify (Frontend) + Render (Backend)

This is the perfect **Free Student Stack**. Netlify is excellent for hosting your React site, and Render offers a free tier for your Backend API.

---

## 🛠️ Step 1: Backend Deployment (Render)

1.  **Sign Up**: Go to [render.com](https://render.com/) and log in with GitHub.
2.  **Create Service**:
    - Click **New +** -> **Web Service**.
    - Connect your `sangatamizh-music` repository.
3.  **Settings**:
    - **Name**: `sangatamizh-api` (or similar)
    - **Region**: Choose the one closest to you (e.g., Singapore).
    - **Root Directory**: `backend` <-- **CRITICAL!**
    - **Runtime**: `Node`
    - **Build Command**: `npm install && npx prisma generate`
    - **Start Command**: `npm start`
    - **Instance Type**: **Free**
4.  **Environment Variables**:
    - Scroll down to "Environment Variables".
    - Copy and paste these values from your local computer:
      - `DATABASE_URL` : (Your Supabase URI)
      - `SUPABASE_URL` : (Your Supabase URL)
      - `SUPABASE_KEY` : (Your Supabase Key)
      - `YT_API_KEY` : (Your YouTube Key)
      - `PORT` : `10000`
5.  **Deploy**: Click "Create Web Service".
    - Wait for it to go live.
    - **Copy the URL** (e.g., `https://sangatamizh-api.onrender.com`). You need this for the next step.

---

## 🌐 Step 2: Frontend Deployment (Netlify)

1.  **Sign Up**: Go to [netlify.com](https://www.netlify.com/) and log in with GitHub.
2.  **Create Site**:
    - Click **"Add new site"** -> **"Import from Git"**.
    - Select **GitHub** and choose `sangatamizh-music`.
3.  **Build Settings**:
    - **Base directory**: `client` <-- **CRITICAL!**
    - **Build command**: `npm run build`
    - **Publish directory**: `dist`
4.  **Environment Variables**:
    - Click **"Add environment variables"**.
    - Add this specific one to connect to your backend:
      - Key: `VITE_API_URL`
      - Value: `https://sangatamizh-api.onrender.com` (The URL you got from Render in Step 1)
    - Add your Firebase variables (copy from local `.env`):
      - `VITE_FIREBASE_API_KEY`
      - `VITE_FIREBASE_AUTH_DOMAIN`
      - `VITE_FIREBASE_PROJECT_ID`
      - ...etc
5.  **Deploy**: Click **"Deploy site"**.

---

## 🧪 Step 3: Final Logic Check

Once deployed:

1.  Open your **Netlify URL**.
2.  Try to **Log In** (this tests Firebase + Firestore).
3.  Try to **Play a Song** (this tests Backend + Database).

### ⚠️ Note on "Sleeping" Backend

Render's free plan "sleeps" after 15 minutes of inactivity. The first time you load your site, it might take **30-60 seconds** to wake up. This is normal for free hosting!
