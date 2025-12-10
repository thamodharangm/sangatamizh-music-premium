# Deployment Guide: Vercel (Frontend) & Render (Backend)

This guide explains how to deploy your **Sangatamizh Music** application. We will deploy the **Backend** to Render and the **Frontend** to Vercel.

---

## 🚀 Part 1: Prerequisites

1.  **GitHub Repository**: Ensure your code is pushed to a GitHub repository (which we just did).
2.  **Supabase Database**: You should have your `DATABASE_URL` from Supabase.
3.  **Firebase Config**: You will need your Firebase configuration keys for the frontend.

---

## 🛠 Part 2: Backend Deployment (Render)

Render is excellent for hosting Node.js APIs.

1.  **Create a Web Service**:

    - Go to [dashboard.render.com](https://dashboard.render.com/).
    - Click **New +** -> **Web Service**.
    - Connect your GitHub repository (`sangatamizh`).

2.  **Configuration**:

    - **Name**: `sangatamizh-backend` (or unique name).
    - **Region**: Choose closest to you (e.g., Singapore, Frankfurt).
    - **Branch**: `main`.
    - **Root Directory**: `backend` (Important! Do not leave empty).
    - **Runtime**: `Node`.
    - **Build Command**: `npm install && npx prisma generate && npx prisma db push`
      - _Note: This installs dependencies, generates the client, and updates your database schema._
    - **Start Command**: `npm start`
    - **Instance Type**: Free.

3.  **Environment Variables**:

    - Scroll down to **Environment Variables** and add:
      - `DATABASE_URL`: (Paste your Supabase Connection String)
      - `SUPABASE_URL`: (Your Supabase URL)
      - `SUPABASE_KEY`: (Your Supabase Anon Key)
      - `NODE_ENV`: `production`

4.  **Deploy**:
    - Click **Create Web Service**.
    - Wait for the build to finish. Once live, copy the **Backend URL** (e.g., `https://sangatamizh-backend.onrender.com`). You will need this for the frontend!

---

## 🌐 Part 3: Frontend Deployment (Vercel)

Vercel is the best platform for React/Vite apps.

1.  **Import Project**:

    - Go to [vercel.com/new](https://vercel.com/new).
    - Select your `sangatamizh` repository.

2.  **Project Settings**:

    - **Project Name**: `sangatamizh-music`.
    - **Framework Preset**: `Vite` (Should be auto-detected).
    - **Root Directory**: Click `Edit` and select `client`. (Important!).

3.  **Build Settings**:

    - **Build Command**: `npm run build` (Default is fine).
    - **Output Directory**: `dist` (Default is fine).

4.  **Environment Variables**:

    - Expand the **Environment Variables** section. Add the following:
    - `VITE_API_URL`: Paste your **Render Backend URL** here (without trailing slash, e.g., `https://sangatamizh-backend.onrender.com`).
    - **Firebase Keys** (Copy these from your local `.env` or Firebase Console):
      - `VITE_FIREBASE_API_KEY`
      - `VITE_FIREBASE_AUTH_DOMAIN`
      - `VITE_FIREBASE_PROJECT_ID`
      - `VITE_FIREBASE_STORAGE_BUCKET`
      - `VITE_FIREBASE_MESSAGING_SENDER_ID`
      - `VITE_FIREBASE_APP_ID`

5.  **Deploy**:
    - Click **Deploy**.
    - Vercel will build your React app.
    - Once complete, you will get a live URL (e.g., `https://sangatamizh-music.vercel.app`).

---

## ✅ Part 4: Final Checks

1.  **CORS**:

    - If you get network errors, go back to your **Backend Code** (`backend/src/app.js` or `server.js`).
    - Ensure your `cors` configuration allows your new Vercel domain.
    - _Quick Fix for testing_: Set CORS logic to allow all (`origin: '*'`) or add your Vercel domain to the allowed list env var if you implemented that.

2.  **Test**:
    - Open your Vercel URL on your mobile phone.
    - Check if the **Home**, **Playlist**, and **Admin** pages look responsive and perfect!

**Enjoy your deployed app!** 🎵
