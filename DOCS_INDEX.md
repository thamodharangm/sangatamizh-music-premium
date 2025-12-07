# 📚 Documentation Index

Complete guide to the Sangtamizh Music streaming platform.

---

## 🚀 Getting Started

| Document                                                     | Purpose                        | When to Use                |
| ------------------------------------------------------------ | ------------------------------ | -------------------------- |
| **[README.md](./README.md)**                                 | Project overview & quick links | First time setup           |
| **[QUICKSTART.md](./QUICKSTART.md)**                         | Step-by-step local setup       | Running locally            |
| **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** | What's been built              | Understanding the codebase |

---

## 🏗️ Architecture & Design

| Document                                                       | Purpose                           |
| -------------------------------------------------------------- | --------------------------------- |
| **[PRODUCTION_ARCHITECTURE.md](./PRODUCTION_ARCHITECTURE.md)** | High-level system design          |
| **[FRONTEND_DESIGN.md](./FRONTEND_DESIGN.md)**                 | React components & structure      |
| **[BACKEND_DESIGN.md](./BACKEND_DESIGN.md)**                   | Express API & services            |
| **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)**                 | PostgreSQL schema & Redis caching |
| **[TRANSCODING_PIPELINE.md](./TRANSCODING_PIPELINE.md)**       | FFmpeg worker flow                |
| **[YOUTUBE_INTEGRATION.md](./YOUTUBE_INTEGRATION.md)**         | YouTube Data API integration      |
| **[AUTH_SECURITY_PLAN.md](./AUTH_SECURITY_PLAN.md)**           | JWT & security design             |
| **[ADMIN_DASHBOARD_DESIGN.md](./ADMIN_DASHBOARD_DESIGN.md)**   | Admin UI & moderation             |

---

## 🚢 Deployment & Operations

| Document                                             | Purpose                         | When to Use       |
| ---------------------------------------------------- | ------------------------------- | ----------------- |
| **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**     | Production deployment (GCP/AWS) | Going live        |
| **[DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md)**       | Cloud Run deployment details    | Cloud deployment  |
| **[CI_CD_QUALITY_PLAN.md](./CI_CD_QUALITY_PLAN.md)** | GitHub Actions & testing        | Setting up CI/CD  |
| **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**       | Common issues & fixes           | When things break |

---

## 💻 Development

| Document                               | Purpose                | When to Use              |
| -------------------------------------- | ---------------------- | ------------------------ |
| **[DEV_SCRIPTS.md](./DEV_SCRIPTS.md)** | Development commands   | Daily development        |
| **[ROADMAP.md](./ROADMAP.md)**         | Development milestones | Planning work            |
| **[AI_PROMPTS.md](./AI_PROMPTS.md)**   | AI assistant prompts   | Using AI for development |

---

## 📋 Quick Reference

### Local Development

```bash
# Start infrastructure
docker-compose up -d postgres redis minio

# Backend
cd backend && npm install && npx prisma migrate dev && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

### Common Commands

```bash
# View logs
docker-compose logs -f [service]

# Reset database
cd backend && npx prisma migrate reset

# Run tests
npm test

# Build for production
npm run build
```

### Key URLs (Local)

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- MinIO Console: http://localhost:9001
- Prisma Studio: http://localhost:5555 (run `npx prisma studio`)

---

## 🎯 By Use Case

### "I want to run the app locally"

1. [QUICKSTART.md](./QUICKSTART.md)
2. [DEV_SCRIPTS.md](./DEV_SCRIPTS.md)

### "I want to understand the architecture"

1. [PRODUCTION_ARCHITECTURE.md](./PRODUCTION_ARCHITECTURE.md)
2. [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
3. [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

### "I want to deploy to production"

1. [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md)
3. [CI_CD_QUALITY_PLAN.md](./CI_CD_QUALITY_PLAN.md)

### "Something is broken"

1. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. [DEV_SCRIPTS.md](./DEV_SCRIPTS.md) (debugging section)

### "I want to add a feature"

1. [AI_PROMPTS.md](./AI_PROMPTS.md)
2. [ROADMAP.md](./ROADMAP.md)
3. Relevant design doc (FRONTEND_DESIGN.md, BACKEND_DESIGN.md, etc.)

### "I want to understand how [X] works"

- **Authentication**: [AUTH_SECURITY_PLAN.md](./AUTH_SECURITY_PLAN.md)
- **File Upload**: [TRANSCODING_PIPELINE.md](./TRANSCODING_PIPELINE.md)
- **Streaming**: [BACKEND_DESIGN.md](./BACKEND_DESIGN.md)
- **Player**: [FRONTEND_DESIGN.md](./FRONTEND_DESIGN.md)
- **Admin Panel**: [ADMIN_DASHBOARD_DESIGN.md](./ADMIN_DASHBOARD_DESIGN.md)

---

## 📊 Project Stats

- **Total Documentation**: 20+ files
- **Lines of Code**: ~5,000+ (scaffold)
- **Tech Stack**: 15+ technologies
- **Deployment Targets**: GCP, AWS, Docker
- **Features**: Auth, Upload, Transcode, Stream, Admin

---

## 🤝 Contributing

1. Read [ROADMAP.md](./ROADMAP.md) for planned features
2. Check [AI_PROMPTS.md](./AI_PROMPTS.md) for development help
3. Follow patterns in design documents
4. Test locally before deploying
5. Update documentation when adding features

---

## 📞 Support

### Documentation Issues

- Missing information? Create an issue
- Unclear instructions? Suggest improvements
- Found a bug? Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) first

### Development Help

- Use prompts from [AI_PROMPTS.md](./AI_PROMPTS.md)
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review relevant design documents

---

## 🎓 Learning Path

**Beginner** (Understanding the project)

1. README.md
2. IMPLEMENTATION_SUMMARY.md
3. QUICKSTART.md

**Intermediate** (Local development)

1. DEV_SCRIPTS.md
2. FRONTEND_DESIGN.md
3. BACKEND_DESIGN.md
4. DATABASE_SCHEMA.md

**Advanced** (Production deployment)

1. DEPLOYMENT_GUIDE.md
2. CI_CD_QUALITY_PLAN.md
3. TROUBLESHOOTING.md
4. All architecture documents

---

## 🔄 Document Updates

This index is automatically updated when new documentation is added. Last updated: 2025-12-07

---

## ✅ Checklist for New Developers

- [ ] Read README.md
- [ ] Follow QUICKSTART.md to run locally
- [ ] Review IMPLEMENTATION_SUMMARY.md
- [ ] Understand DATABASE_SCHEMA.md
- [ ] Explore codebase with design docs
- [ ] Try adding a small feature
- [ ] Read DEPLOYMENT_GUIDE.md
- [ ] Bookmark AI_PROMPTS.md for help

---

**Ready to build? Start with [QUICKSTART.md](./QUICKSTART.md)!** 🚀
