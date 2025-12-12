# 🚨 Backend Connection Fix

We detected that your Vercel frontend is unable to connect to your Render backend. This is usually due to a missing or incorrect Environment Variable in Vercel.

## 🛠️ Step-by-Step Fix

1.  **Find Your Render URL**:

    - Go to **dashboard.render.com**.
    - Click on your backend service (e.g., `sangatamizh-backend`).
    - Copy the URL from the top left (it looks like `https://something.onrender.com`).

2.  **Update Vercel Configuration**:

    - Go to **vercel.com** and open your project `sangatamizh-music-premium`.
    - Click **Settings** (top tab) -> **Environment Variables** (left sidebar).
    - Find `VITE_API_URL`.
    - **Edit** it (or Add if missing):
      - **Key**: `VITE_API_URL`
      - **Value**: `https://YOUR-RENDER-URL.onrender.com/api`
      - _(Important: Make sure to add `/api` at the end!)_
    - Click **Save**.

3.  **Redeploy Vercel**:

    - Go to the **Deployments** tab in Vercel.
    - Click the **three dots (...)** next to the latest deployment.
    - Select **Redeploy**.

4.  **Verify**:
    - Once the deployment finishes, open your website.
    - The "Trending" / "Hits" sections should now load!

## 🧪 Common Issues

- **404 Not Found**: You forgot `/api` at the end of the URL.
- **Network Error**: The backend is "sleeping". Render free tier spins down after inactivity. Wait 60 seconds and refresh the page.
- **CORS Error**: We already fixed this in the code, so just ensure the backend is freshly deployed.
