# 🚀 Fast Deployment Guide - Vercel + Railway

Get your music streaming app live in **10 minutes** with free tiers!

---

## 📋 Prerequisites

- GitHub account
- Vercel account (sign up at vercel.com with GitHub)
- Railway account (sign up at railway.app with GitHub)

---

## 🎯 Deployment Strategy

| Service  | Platform                     | Purpose           | Cost             |
| -------- | ---------------------------- | ----------------- | ---------------- |
| Frontend | Vercel                       | React app hosting | FREE             |
| Backend  | Railway                      | API + Worker      | FREE ($5 credit) |
| Database | Railway                      | PostgreSQL        | FREE             |
| Redis    | Railway                      | Queue             | FREE             |
| Storage  | Cloudflare R2 / Backblaze B2 | S3-compatible     | FREE (10GB)      |

---

## 🚀 Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - Music streaming MVP"

# Create GitHub repo (using GitHub CLI)
gh repo create sangtamizh-music --public --source=. --remote=origin --push

# Or manually:
# 1. Go to github.com/new
# 2. Create repo "sangtamizh-music"
# 3. Push code:
git remote add origin https://github.com/YOUR_USERNAME/sangtamizh-music.git
git branch -M main
git push -u origin main
```

---

## 🎨 Step 2: Deploy Frontend to Vercel

### A. Via Vercel Dashboard (Easiest)

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Click **"Import Git Repository"**
3. Select your `sangtamizh-music` repo
4. Configure:

   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Environment Variables** (click "Add"):

   ```
   VITE_API_URL=https://YOUR-RAILWAY-APP.up.railway.app/api
   ```

   _(We'll get this URL in Step 3)_

6. Click **"Deploy"**

### B. Via Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy frontend
cd frontend
vercel --prod

# Set environment variable
vercel env add VITE_API_URL
# Enter: https://YOUR-RAILWAY-APP.up.railway.app/api
```

**Your frontend will be live at**: `https://sangtamizh-music.vercel.app`

---

## 🚂 Step 3: Deploy Backend to Railway

### A. Via Railway Dashboard

1. Go to **[railway.app/new](https://railway.app/new)**
2. Click **"Deploy from GitHub repo"**
3. Select `sangtamizh-music`
4. Railway will detect your project

### B. Add Services

#### 1. PostgreSQL Database

```bash
# In Railway dashboard:
1. Click "New" → "Database" → "PostgreSQL"
2. Railway auto-generates DATABASE_URL
3. Copy the connection string
```

#### 2. Redis

```bash
# In Railway dashboard:
1. Click "New" → "Database" → "Redis"
2. Railway auto-generates REDIS_URL
```

#### 3. Backend Service

```bash
# In Railway dashboard:
1. Click "New" → "GitHub Repo"
2. Select your repo
3. Set Root Directory: backend
4. Add environment variables:
```

**Environment Variables for Backend**:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_ACCESS_SECRET=your-super-secret-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-this-too
S3_BUCKET=sangtamizh-music
S3_REGION=auto
S3_ENDPOINT=https://YOUR-R2-ENDPOINT.r2.cloudflarestorage.com
S3_ACCESS_KEY=your-r2-access-key
S3_SECRET_KEY=your-r2-secret-key
FRONTEND_URL=https://sangtamizh-music.vercel.app
```

5. Click **"Deploy"**

### C. Get Your Backend URL

After deployment:

1. Go to your backend service in Railway
2. Click **"Settings"** → **"Networking"**
3. Click **"Generate Domain"**
4. Copy the URL: `https://sangtamizh-music-production.up.railway.app`

### D. Update Vercel Environment Variable

```bash
# Go back to Vercel dashboard
# Settings → Environment Variables
# Update VITE_API_URL to your Railway backend URL
VITE_API_URL=https://sangtamizh-music-production.up.railway.app/api

# Redeploy frontend
vercel --prod
```

---

## 📦 Step 4: Setup Storage (Cloudflare R2)

### Why R2?

- FREE 10GB storage
- S3-compatible API
- No egress fees

### Setup Steps

1. **Sign up**: [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Create R2 Bucket**:

   - Go to R2 → Create bucket
   - Name: `sangtamizh-music`
   - Region: Automatic

3. **Get API Credentials**:

   - R2 → Manage R2 API Tokens
   - Create API Token
   - Copy:
     - Access Key ID
     - Secret Access Key
     - Endpoint URL

4. **Update Railway Environment Variables**:

   ```env
   S3_ENDPOINT=https://YOUR-ACCOUNT-ID.r2.cloudflarestorage.com
   S3_ACCESS_KEY=your-r2-access-key
   S3_SECRET_KEY=your-r2-secret-key
   S3_BUCKET=sangtamizh-music
   ```

5. **Set CORS**:

   ```bash
   # Install Wrangler CLI
   npm install -g wrangler

   # Login
   wrangler login

   # Set CORS
   wrangler r2 bucket cors put sangtamizh-music --rules '[
     {
       "AllowedOrigins": ["https://sangtamizh-music.vercel.app"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]'
   ```

---

## 🗄️ Step 5: Run Database Migrations

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npx prisma migrate deploy

# Or manually via Railway dashboard:
# 1. Go to your backend service
# 2. Click "Deploy" → "Custom Start Command"
# 3. Add: npx prisma migrate deploy && npm start
```

---

## ✅ Step 6: Verify Deployment

### Test Your Live App

1. **Frontend**: `https://sangtamizh-music.vercel.app`
2. **Backend Health**: `https://YOUR-APP.up.railway.app/health`
3. **API Test**:
   ```bash
   curl https://YOUR-APP.up.railway.app/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test123","displayName":"Test User"}'
   ```

---

## 🔧 Troubleshooting

### Frontend shows "Cannot connect to server"

```bash
# Check VITE_API_URL in Vercel
# Should be: https://YOUR-RAILWAY-APP.up.railway.app/api

# Redeploy frontend
vercel --prod
```

### Backend crashes on Railway

```bash
# Check logs
railway logs

# Common issues:
# 1. Missing environment variables
# 2. Database not migrated
# 3. Port not set to 3000
```

### CORS errors

```typescript
// backend/src/index.ts - Update CORS origin
app.use(cors({
  origin: [
    'https://sangtamizh-music.vercel.app',
    'http://localhost:5173' // for local dev
  ],
  credentials: true
}));

// Redeploy
git add .
git commit -m "Fix CORS"
git push
```

---

## 💰 Cost Breakdown (FREE!)

| Service       | Free Tier    | Limits                           |
| ------------- | ------------ | -------------------------------- |
| Vercel        | ✅ FREE      | 100GB bandwidth/month            |
| Railway       | ✅ FREE      | $5 credit/month (enough for MVP) |
| Cloudflare R2 | ✅ FREE      | 10GB storage, unlimited egress   |
| **Total**     | **$0/month** | Perfect for MVP!                 |

---

## 🚀 Quick Deploy Script

Save this as `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying Sangtamizh Music..."

# Push to GitHub
git add .
git commit -m "Deploy: $(date)"
git push origin main

# Deploy frontend
cd frontend
vercel --prod
cd ..

# Railway will auto-deploy backend on git push

echo "✅ Deployment complete!"
echo "Frontend: https://sangtamizh-music.vercel.app"
echo "Backend: Check Railway dashboard for URL"
```

Run: `chmod +x deploy.sh && ./deploy.sh`

---

## 📱 Your Live URLs

After deployment, you'll have:

- **App**: `https://sangtamizh-music.vercel.app`
- **API**: `https://sangtamizh-music-production.up.railway.app`
- **Docs**: `https://sangtamizh-music.vercel.app/docs` (if you add docs page)

---

## 🎯 Next Steps After Deployment

1. ✅ Test signup/login flow
2. ✅ Upload a test song
3. ✅ Verify transcoding works
4. ✅ Test playback
5. 📊 Setup monitoring (Railway has built-in metrics)
6. 🔐 Change JWT secrets to secure values
7. 📧 Add email verification (optional)
8. 🎨 Customize domain (Vercel allows custom domains)

---

## 🆘 Need Help?

- **Vercel Issues**: [vercel.com/docs](https://vercel.com/docs)
- **Railway Issues**: [docs.railway.app](https://docs.railway.app)
- **App Issues**: Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

**Ready to deploy? Start with Step 1!** 🚀
