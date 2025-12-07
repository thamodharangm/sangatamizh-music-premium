# 🚀 Deployment Checklist

Follow this step-by-step to get your live link!

---

## ✅ Pre-Deployment Checklist

- [ ] Code is working locally
- [ ] All environment variables documented in `.env.example`
- [ ] Database schema is finalized
- [ ] Git repository is clean (no sensitive data)

---

## 📝 Step-by-Step Deployment

### Step 1: Push to GitHub ⏱️ 2 minutes

```bash
# If not already initialized
git init
git add .
git commit -m "Ready for deployment"

# Create GitHub repo
gh repo create sangtamizh-music --public --source=. --remote=origin --push

# Or manually at github.com/new
```

**Verify**: ✅ Code is on GitHub

---

### Step 2: Deploy Frontend to Vercel ⏱️ 3 minutes

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Import your GitHub repo
3. Configure:

   - Root Directory: `frontend`
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. Add Environment Variable:

   ```
   VITE_API_URL = (leave empty for now, we'll update after backend)
   ```

5. Click **Deploy**

**Verify**: ✅ Frontend is live at `https://YOUR-APP.vercel.app`

---

### Step 3: Setup Railway Services ⏱️ 5 minutes

#### A. Create PostgreSQL Database

1. Go to **[railway.app/new](https://railway.app/new)**
2. Click **"New Project"**
3. Click **"Provision PostgreSQL"**
4. Copy the `DATABASE_URL` from Variables tab

**Verify**: ✅ Database is running

#### B. Create Redis

1. In same project, click **"New"**
2. Select **"Redis"**
3. Copy the `REDIS_URL` from Variables tab

**Verify**: ✅ Redis is running

#### C. Deploy Backend

1. Click **"New"** → **"GitHub Repo"**
2. Select your repo
3. Click **"Add variables"** and paste:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_ACCESS_SECRET=CHANGE_THIS_TO_RANDOM_STRING_32_CHARS
JWT_REFRESH_SECRET=CHANGE_THIS_TO_ANOTHER_RANDOM_STRING
S3_BUCKET=sangtamizh-music
S3_REGION=auto
S3_ENDPOINT=https://YOUR-R2-ENDPOINT (we'll add this in Step 4)
S3_ACCESS_KEY=YOUR_KEY (we'll add this in Step 4)
S3_SECRET_KEY=YOUR_SECRET (we'll add this in Step 4)
FRONTEND_URL=https://YOUR-APP.vercel.app
```

4. Click **"Deploy"**
5. Go to **Settings** → **Networking** → **Generate Domain**
6. Copy your backend URL: `https://YOUR-APP.up.railway.app`

**Verify**: ✅ Backend is deployed
**Test**: Visit `https://YOUR-APP.up.railway.app/health`

---

### Step 4: Setup Storage (Cloudflare R2) ⏱️ 5 minutes

1. Sign up at **[dash.cloudflare.com](https://dash.cloudflare.com)**
2. Go to **R2** → **Create bucket** → Name: `sangtamizh-music`
3. Go to **Manage R2 API Tokens** → **Create API Token**
4. Copy:

   - Access Key ID
   - Secret Access Key
   - Endpoint URL

5. Update Railway backend variables:

   ```env
   S3_ENDPOINT=https://YOUR-ACCOUNT-ID.r2.cloudflarestorage.com
   S3_ACCESS_KEY=your-access-key-here
   S3_SECRET_KEY=your-secret-key-here
   ```

6. Set CORS (install wrangler first: `npm i -g wrangler`):
   ```bash
   wrangler login
   wrangler r2 bucket cors put sangtamizh-music --rules '[{"AllowedOrigins":["https://YOUR-APP.vercel.app"],"AllowedMethods":["GET","PUT","POST"],"AllowedHeaders":["*"]}]'
   ```

**Verify**: ✅ Storage is configured

---

### Step 5: Update Frontend Environment ⏱️ 1 minute

1. Go to Vercel dashboard → Your project
2. **Settings** → **Environment Variables**
3. Update `VITE_API_URL`:
   ```
   VITE_API_URL=https://YOUR-RAILWAY-APP.up.railway.app/api
   ```
4. Go to **Deployments** → Click **"Redeploy"** on latest

**Verify**: ✅ Frontend can connect to backend

---

### Step 6: Run Database Migrations ⏱️ 2 minutes

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Select your backend service
# Run migration
railway run npx prisma migrate deploy
```

**Verify**: ✅ Database tables created

---

### Step 7: Test Your Live App! ⏱️ 5 minutes

1. **Open your app**: `https://YOUR-APP.vercel.app`

2. **Test signup**:

   - Create an account
   - Check if you get logged in

3. **Test upload** (will fail without worker, but should accept file):

   - Try uploading a small MP3
   - Check if it reaches the backend

4. **Check backend logs**:
   ```bash
   railway logs
   ```

**Verify**: ✅ App is functional

---

## 🎯 Your Live URLs

After completing all steps:

- **Frontend**: `https://sangtamizh-music.vercel.app`
- **Backend**: `https://sangtamizh-music-production.up.railway.app`
- **API Health**: `https://YOUR-BACKEND/health`

---

## 🔧 Post-Deployment Tasks

### Immediate

- [ ] Change JWT secrets to secure random strings
- [ ] Test all features (signup, login, upload)
- [ ] Setup custom domain (optional)

### This Week

- [ ] Add monitoring (Railway has built-in metrics)
- [ ] Setup error tracking (Sentry)
- [ ] Add email notifications
- [ ] Implement worker for transcoding

### Optional Enhancements

- [ ] Custom domain on Vercel
- [ ] SSL certificate (auto with Vercel)
- [ ] CDN for static assets
- [ ] Analytics (Vercel Analytics)

---

## 🐛 Common Issues

### "Cannot connect to server"

```bash
# Check VITE_API_URL in Vercel
# Should end with /api
# Example: https://my-app.up.railway.app/api
```

### "Database connection failed"

```bash
# Check DATABASE_URL in Railway
# Should start with postgresql://
# Run: railway logs
```

### "CORS error"

```typescript
// Update backend/src/index.ts
app.use(
  cors({
    origin: "https://YOUR-VERCEL-APP.vercel.app",
    credentials: true,
  })
);
```

---

## 📊 Deployment Status

| Service  | Status     | URL |
| -------- | ---------- | --- |
| Frontend | ⏳ Pending | -   |
| Backend  | ⏳ Pending | -   |
| Database | ⏳ Pending | -   |
| Redis    | ⏳ Pending | -   |
| Storage  | ⏳ Pending | -   |

**Update this table as you complete each step!**

---

## 🆘 Need Help?

- **Stuck?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Errors?** Check Railway logs: `railway logs`
- **Questions?** See [DEPLOY_FAST.md](./DEPLOY_FAST.md) for detailed guide

---

**Estimated Total Time**: 20-30 minutes
**Cost**: $0 (all free tiers)

**Let's get your app live!** 🚀
