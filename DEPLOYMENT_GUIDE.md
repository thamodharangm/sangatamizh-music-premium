# 🚀 Production Deployment Guide

## Infrastructure Checklist

| Component          | Status | Implementation                    |
| ------------------ | ------ | --------------------------------- |
| Authentication     | ✅     | JWT + Refresh Tokens (httpOnly)   |
| Database           | ✅     | PostgreSQL (Cloud SQL / RDS)      |
| Storage            | ✅     | S3-compatible (AWS S3 / GCS)      |
| Backend API        | ✅     | Cloud Run / ECS                   |
| Transcoding Worker | ✅     | Cloud Run Job / Background Worker |
| Streaming URLs     | ✅     | Signed URLs from S3               |
| CI/CD              | ✅     | GitHub Actions                    |

---

## 🔥 Option A: Google Cloud Platform (Recommended)

### Prerequisites

```bash
# Install gcloud CLI
# https://cloud.google.com/sdk/docs/install

# Login
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Step 1: Build & Push Docker Images

```bash
# Set variables
export PROJECT_ID=sangtamizh-music
export REGION=asia-south1

# Enable APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  sql-component.googleapis.com \
  sqladmin.googleapis.com

# Build & push backend
cd backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/music-api

# Build & push frontend
cd ../frontend
npm run build
gcloud builds submit --tag gcr.io/$PROJECT_ID/music-frontend
```

### Step 2: Setup Cloud SQL (PostgreSQL)

```bash
# Create instance
gcloud sql instances create music-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION

# Create database
gcloud sql databases create music_db --instance=music-db

# Create user
gcloud sql users create music_user \
  --instance=music-db \
  --password=CHANGE_ME_SECURE_PASSWORD

# Get connection name
gcloud sql instances describe music-db --format="value(connectionName)"
```

### Step 3: Setup Cloud Storage

```bash
# Create bucket
gsutil mb -l $REGION gs://$PROJECT_ID-music-files

# Set CORS
cat > cors.json << EOF
[
  {
    "origin": ["https://your-frontend-url.run.app"],
    "method": ["GET", "PUT", "POST"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://$PROJECT_ID-music-files
```

### Step 4: Setup Memorystore (Redis)

```bash
gcloud redis instances create music-cache \
  --size=1 \
  --region=$REGION \
  --redis-version=redis_6_x
```

### Step 5: Deploy Backend API

```bash
# Create secrets
echo -n "your-jwt-secret" | gcloud secrets create JWT_ACCESS_SECRET --data-file=-
echo -n "your-refresh-secret" | gcloud secrets create JWT_REFRESH_SECRET --data-file=-

# Deploy to Cloud Run
gcloud run deploy music-api \
  --image gcr.io/$PROJECT_ID/music-api \
  --region=$REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="JWT_ACCESS_SECRET=JWT_ACCESS_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest" \
  --add-cloudsql-instances=YOUR_CONNECTION_NAME \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10
```

### Step 6: Deploy Worker as Cloud Run Job

```bash
gcloud run jobs create music-worker \
  --image gcr.io/$PROJECT_ID/music-api \
  --region=$REGION \
  --set-env-vars="NODE_ENV=production" \
  --add-cloudsql-instances=YOUR_CONNECTION_NAME \
  --memory=2Gi \
  --cpu=2 \
  --task-timeout=30m \
  --command="npm,run,worker"

# Execute job manually
gcloud run jobs execute music-worker --region=$REGION
```

### Step 7: Deploy Frontend

```bash
# Option 1: Cloud Run (SSR/Static)
gcloud run deploy music-frontend \
  --image gcr.io/$PROJECT_ID/music-frontend \
  --region=$REGION \
  --allow-unauthenticated

# Option 2: Firebase Hosting (Static)
cd frontend
npm run build
firebase deploy --only hosting
```

### Step 8: Run Database Migrations

```bash
# Connect via Cloud SQL Proxy
cloud_sql_proxy -instances=YOUR_CONNECTION_NAME=tcp:5432

# In another terminal
cd backend
DATABASE_URL="postgresql://music_user:password@localhost:5432/music_db" \
  npx prisma migrate deploy
```

---

## 🔥 Option B: AWS Deployment

### Step 1: Setup RDS (PostgreSQL)

```bash
aws rds create-db-instance \
  --db-instance-identifier music-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password CHANGE_ME \
  --allocated-storage 20
```

### Step 2: Setup ElastiCache (Redis)

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id music-cache \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

### Step 3: Setup S3

```bash
aws s3 mb s3://sangtamizh-music-files

# Set CORS
aws s3api put-bucket-cors \
  --bucket sangtamizh-music-files \
  --cors-configuration file://cors.json
```

### Step 4: Deploy to ECS/Fargate

```bash
# Build and push to ECR
aws ecr create-repository --repository-name music-api

docker build -t music-api ./backend
docker tag music-api:latest YOUR_ECR_URI/music-api:latest
docker push YOUR_ECR_URI/music-api:latest

# Create ECS task definition and service
# (Use AWS Console or CloudFormation)
```

---

## 🔧 Environment Variables (Production)

Create `.env.production`:

```bash
# App
NODE_ENV=production
PORT=8080

# Database (Cloud SQL)
DATABASE_URL=postgresql://user:pass@/music_db?host=/cloudsql/PROJECT:REGION:INSTANCE

# Redis (Memorystore)
REDIS_URL=redis://REDIS_IP:6379

# Storage (GCS)
S3_BUCKET=sangtamizh-music-files
S3_REGION=asia-south1
S3_ENDPOINT=https://storage.googleapis.com
GCS_PROJECT_ID=your-project-id

# Auth
JWT_ACCESS_SECRET=use-secrets-manager
JWT_REFRESH_SECRET=use-secrets-manager

# Optional
YOUTUBE_API_KEY=your-key
SENTRY_DSN=your-sentry-dsn
```

---

## 📊 Monitoring & Logging

### Setup Cloud Monitoring

```bash
# Enable APIs
gcloud services enable monitoring.googleapis.com logging.googleapis.com

# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

### Setup Sentry (Error Tracking)

```typescript
// backend/src/index.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## 🔐 Security Checklist

- [ ] Change all default passwords
- [ ] Use Secret Manager for sensitive data
- [ ] Enable Cloud Armor (DDoS protection)
- [ ] Setup VPC for database
- [ ] Enable SSL/TLS
- [ ] Configure CORS properly
- [ ] Setup rate limiting
- [ ] Enable audit logging
- [ ] Regular security scans

---

## 💰 Cost Optimization

### Cloud Run

- Use `--min-instances=0` for auto-scaling to zero
- Set `--max-instances` based on expected load
- Use `--cpu-throttling` for background jobs

### Cloud SQL

- Start with `db-f1-micro` ($7/month)
- Enable automatic backups
- Use read replicas only if needed

### Storage

- Use lifecycle policies to delete old files
- Enable compression
- Use CDN for frequently accessed files

---

## 🚨 Rollback Plan

```bash
# List revisions
gcloud run revisions list --service=music-api

# Rollback to previous
gcloud run services update-traffic music-api \
  --to-revisions=REVISION_NAME=100
```

---

## 📈 Scaling Strategy

### Auto-scaling triggers

- CPU > 70%
- Memory > 80%
- Request latency > 1s

### Manual scaling

```bash
gcloud run services update music-api \
  --min-instances=2 \
  --max-instances=50
```
