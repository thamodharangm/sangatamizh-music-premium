# 🚀 Deployment Guide for Sangatamizh Music

This app consists of two parts:

1. **Backend (Node.js)**: Handles API, Database, and YouTube Downloads.
2. **Frontend (React)**: The User Interface.

We will deploy the **Backend to Railway** and the **Frontend to Vercel**.

---

## Prerequisite: Push to GitHub

1. Go to [vercel.com](https://vercel.com/) and Login.
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. **Configure Project**:
   - **Framework Preset**: Vite (Auto-detected).
   - **Root Directory**: Click "Edit" and select `client`.
5. **Set Environment Variables**:
   - Expand the **Environment Variables** section.
   - Key: `VITE_API_URL`
   - Value: **Paste your Railway Backend URL** (e.g., `https://backend-production.up.railway.app`).
     - _Note: Do not add `/api` at the end, the code adds it automatically._
6. **Deploy**:
   - Click **Deploy**.
   - Wait for it to finish.

---

## 🎉 Done!

Your app should now be live!

- Visit the Vercel URL to explore the app.
- Admin Uploads and Music Playback will work via the connected backend.
