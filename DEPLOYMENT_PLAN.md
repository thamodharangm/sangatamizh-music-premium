# Deployment Plan: Docker + Cloud Run (GCP)

This plan outlines deploying the Sangtamizh Music platform using Google Cloud Platform (GCP) with **Cloud Run** for compute, **Cloud SQL** for the database, and **Cloud Storage** for files.

## 1. Local Development (Docker Compose)

Use the `docker-compose.yml` defined in the [Production Architecture](./PRODUCTION_ARCHITECTURE.md) for local testing. It spins up:

- `server` (API)
- `client` (Vite dev server)
- `postgres` (DB)
- `redis` (Cache/Queue)
- `minio` (S3 compatible storage)

## 2. Cloud Infrastructure Architecture

### Components

1.  **Compute**:
    - **API Service**: Cloud Run (Autoscaling container).
    - **Worker Service**: Cloud Run (Running as a background worker).
    - **Frontend**: Firebase Hosting (for static assets) or Cloud Run (if Server-Side Rendering is needed). _Recommendation: Cloud Run for unified container workflow._
2.  **Data**:
    - **Database**: Cloud SQL for PostgreSQL 15.
    - **Cache/Queue**: Memorystore for Redis (Version 6+).
    - **Object Storage**: Cloud Storage (GCS) Bucket (configured with CORS).
3.  **Networking**:
    - **Serverless VPC Access Connector**: Allows Cloud Run to connect to Cloud SQL and Memorystore private IPs.

## 3. GitHub Actions CI/CD Pipeline

Creates a workflow `.github/workflows/deploy.yml` that builds images, pushes to Artifact Registry, and deploys to Cloud Run.

### Prerequisites

- GCP Project ID set up.
- Artifact Registry Repository created (`music-repo`).
- Service Account with `run.admin`, `storage.admin`, `iam.serviceAccountUser`, and `artifactregistry.writer` roles.
- GitHub Secrets: `GCP_PROJECT_ID`, `GCP_SA_KEY` (JSON).

### `.github/workflows/deploy.yml`

```yaml
name: Build and Deploy

on:
  push:
    branches: ["main"]

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: us-central1
  REPO_NAME: music-repo
  API_SERVICE: music-api
  WORKER_SERVICE: music-worker
  FRONTEND_SERVICE: music-client

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - id: "auth"
        uses: "google-github-actions/auth@v1"
        with:
          credentials_json: "${{ secrets.GCP_SA_KEY }}"

      - name: "Set up Cloud SDK"
        uses: "google-github-actions/setup-gcloud@v1"
        with:
          project_id: ${{ env.PROJECT_ID }}

      - name: "Configure Docker"
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      # --- BUILD & PUSH API ---
      - name: Build API Image
        run: docker build -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPO_NAME }}/api:${{ github.sha }} ./server

      - name: Push API Image
        run: docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPO_NAME }}/api:${{ github.sha }}

      # --- BUILD & PUSH CLIENT ---
      - name: Build Client Image
        run: docker build -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPO_NAME }}/client:${{ github.sha }} ./client

      - name: Push Client Image
        run: docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPO_NAME }}/client:${{ github.sha }}

      # --- DEPLOY API ---
      - name: Deploy API to Cloud Run
        uses: "google-github-actions/deploy-cloudrun@v1"
        with:
          service: ${{ env.API_SERVICE }}
          image: ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPO_NAME }}/api:${{ github.sha }}
          region: ${{ env.REGION }}
          env_vars: |
            NODE_ENV=production
            DB_HOST=${{ secrets.DB_HOST }}
            DB_USER=${{ secrets.DB_USER }}
            DB_PASS=${{ secrets.DB_PASS }}
            REDIS_URL=${{ secrets.REDIS_URL }}
            S3_BUCKET=${{ secrets.GCS_BUCKET_NAME }}
          secrets: |
            JWT_SECRET=projects/${{ env.PROJECT_ID }}/secrets/JWT_SECRET/versions/latest

      # --- DEPLOY WORKER ---
      - name: Deploy Worker to Cloud Run
        uses: "google-github-actions/deploy-cloudrun@v1"
        with:
          service: ${{ env.WORKER_SERVICE }}
          image: ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPO_NAME }}/api:${{ github.sha }} # Reuses Backend Image
          region: ${{ env.REGION }}
          # Override CMD to start worker instead of API
          flags: '--entry-point="npm run start:worker"'
          env_vars: |
            NODE_ENV=production
            DB_HOST=${{ secrets.DB_HOST }}
            REDIS_URL=${{ secrets.REDIS_URL }}

      # --- DEPLOY FRONTEND ---
      - name: Deploy Frontend to Cloud Run
        uses: "google-github-actions/deploy-cloudrun@v1"
        with:
          service: ${{ env.FRONTEND_SERVICE }}
          image: ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPO_NAME }}/client:${{ github.sha }}
          region: ${{ env.REGION }}
          flags: "--allow-unauthenticated"
```

## 4. Setup Commands (`gcloud`)

Run these commands once to initialize the project infrastructure.

```bash
# 1. Variables
export PROJECT_ID="sangtamizh-music"
export REGION="us-central1"
export DB_PASS="secure_password"

# 2. Artifact Registry
gcloud artifacts repositories create music-repo \
    --repository-format=docker \
    --location=$REGION

# 3. Cloud SQL (PostgreSQL)
gcloud sql instances create music-db-instance \
    --database-version=POSTGRES_15 \
    --cpu=2 --memory=4GB \
    --region=$REGION \
    --root-password=$DB_PASS

gcloud sql databases create music_db --instance=music-db-instance

# 4. Redis (Memorystore)
gcloud redis instances create music-cache \
    --size=1 \
    --region=$REGION \
    --redis-version=redis_6_x

# 5. Cloud Storage (Bucket)
gcloud storage buckets create gs://${PROJECT_ID}-files --location=$REGION
gcloud storage buckets update gs://${PROJECT_ID}-files --cors-file=cors.json

# 6. Secrets Manager (For sensitive config)
echo -n "super-secret-jwt-key" | gcloud secrets create JWT_SECRET --data-file=-
```

## 5. Dockerfile Optimizations for Production

Ensure your Dockerfiles use **Multi-stage builds** (as defined in [Backend Design](./BACKEND_DESIGN.md)).

**Frontend Nginx Container (`client/Dockerfile` for Prod)**:
Instead of `vite preview`, use Nginx for better performance in Cloud Run.

```dockerfile
# Build Stage
FROM node:20-alpine as builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve Stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
