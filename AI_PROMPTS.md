# 🤖 AI Prompts for Development & Debugging

Use these prompts with AI assistants (ChatGPT, Claude, Gemini) to accelerate development.

---

## 🏗️ Project Generation Prompts

### Full Stack Scaffold

```
Generate a production-ready music streaming platform with:
- React + Vite + TypeScript frontend with Tailwind CSS
- Node.js + Express + TypeScript backend
- PostgreSQL database with Prisma ORM
- S3-compatible storage (MinIO for dev, AWS S3 for prod)
- BullMQ job queue with Redis
- FFmpeg transcoding worker (128kbps, 64kbps, 30s preview)
- JWT authentication with refresh tokens
- Signed URL streaming
- Admin panel for moderation
- Docker Compose for local development
- GitHub Actions CI/CD
- Cloud Run deployment configuration

Include:
- Complete folder structure
- All configuration files (tsconfig, vite.config, docker-compose)
- Sample code for key components
- Environment variable templates
- README with setup instructions
```

### Feature Addition

```
Add [FEATURE] to my music streaming app:

Current stack:
- Frontend: React + Vite + TypeScript
- Backend: Express + Prisma + PostgreSQL
- Storage: S3
- Queue: BullMQ

Requirements:
- [List specific requirements]
- Must integrate with existing auth system
- Follow current code patterns
- Include tests

Provide:
- File changes needed
- New files to create
- Database migration (if needed)
- API endpoints
- Frontend components
```

---

## 🐛 Bug Fix Prompts

### General Debug

```
Act as a senior full-stack engineer. Debug this issue in my music streaming app:

**Error:**
[Paste full error message]

**Context:**
- Stack: React + Express + PostgreSQL + S3
- Environment: [development/production]
- What I tried: [List attempts]

**Logs:**
[Paste relevant logs]

Analyze the root cause and provide:
1. Explanation of what's wrong
2. Step-by-step fix
3. Code changes needed
4. Prevention strategy
```

### Deployment Issue

```
Act as a DevOps engineer. Fix this deployment error:

**Platform:** [Cloud Run / AWS / Docker]
**Error:** [Paste error]
**Service:** [backend / frontend / worker]

**Current config:**
[Paste docker-compose.yml or deployment config]

**Environment variables:**
[List relevant env vars - REDACT SECRETS]

Provide:
- Root cause analysis
- Corrected configuration
- Deployment commands
- Verification steps
```

### Performance Issue

```
My music streaming app has performance issues:

**Problem:** [e.g., slow upload, streaming lag, high memory]
**Metrics:** [Response time, memory usage, etc.]
**Scale:** [Users, songs, requests/sec]

**Current architecture:**
[Describe setup]

Analyze and suggest:
1. Bottlenecks
2. Optimization strategies
3. Code improvements
4. Infrastructure changes
5. Monitoring setup
```

---

## 🚀 Deployment Prompts

### Cloud Run Deployment

```
Generate complete Cloud Run deployment for my music streaming app:

**Services:**
- Backend API (Express)
- Worker (FFmpeg transcoding)
- Frontend (React static)

**Dependencies:**
- Cloud SQL (PostgreSQL)
- Memorystore (Redis)
- Cloud Storage (GCS)

Provide:
1. gcloud commands for all services
2. Dockerfile optimizations
3. Secret management setup
4. Environment variable configuration
5. CI/CD GitHub Actions workflow
6. Monitoring & logging setup
7. Cost optimization tips
```

### AWS Deployment

```
Create AWS deployment guide for music streaming app:

**Stack:**
- ECS/Fargate for containers
- RDS PostgreSQL
- ElastiCache Redis
- S3 for storage

Include:
- CloudFormation/Terraform templates
- ECS task definitions
- Load balancer configuration
- Auto-scaling policies
- IAM roles and policies
- Cost estimates
```

---

## 🔐 Security Audit Prompt

```
Perform a security audit on my music streaming app:

**Code:**
[Paste relevant code sections]

**Architecture:**
- JWT authentication
- S3 signed URLs
- PostgreSQL database
- Express API

Check for:
1. Authentication vulnerabilities
2. SQL injection risks
3. XSS vulnerabilities
4. CORS misconfigurations
5. Secrets exposure
6. Rate limiting gaps
7. Input validation issues

Provide:
- Severity ratings
- Exploit scenarios
- Fix recommendations
- Code examples
```

---

## 📊 Database Optimization Prompt

```
Optimize my PostgreSQL database for music streaming:

**Current schema:**
[Paste Prisma schema]

**Usage patterns:**
- [e.g., Heavy reads on songs table]
- [e.g., Frequent joins on playlists]
- [e.g., Analytics queries]

**Performance issues:**
- [Slow queries]
- [High CPU]

Suggest:
1. Index optimizations
2. Query improvements
3. Schema changes
4. Caching strategies
5. Migration plan
```

---

## 🎨 UI/UX Enhancement Prompt

```
Improve the UI/UX of my music player component:

**Current implementation:**
[Paste PlayerBar.tsx code]

**Requirements:**
- Modern, premium design
- Smooth animations
- Mobile responsive
- Accessibility (ARIA labels)
- Keyboard shortcuts
- Waveform visualization (optional)

Provide:
- Updated React component
- Tailwind CSS classes
- Animation examples
- Mobile optimizations
```

---

## 🧪 Testing Prompt

```
Generate comprehensive tests for my music streaming app:

**Component/Service:**
[Paste code]

**Testing requirements:**
- Unit tests (Jest)
- Integration tests
- E2E tests (Playwright/Cypress)
- API tests (Supertest)

Cover:
- Happy paths
- Error scenarios
- Edge cases
- Authentication flows
- File upload/download

Provide:
- Test files
- Mock data
- Test utilities
- CI integration
```

---

## 📈 Monitoring & Observability Prompt

```
Set up monitoring for my music streaming platform:

**Stack:**
- Cloud Run / ECS
- PostgreSQL
- Redis
- S3

**Requirements:**
- Error tracking (Sentry)
- Performance monitoring (Prometheus/Grafana)
- Logging (Cloud Logging / CloudWatch)
- Alerts (critical errors, high CPU, failed jobs)

Provide:
1. Instrumentation code
2. Dashboard configurations
3. Alert rules
4. Log aggregation setup
5. SLO/SLA definitions
```

---

## 🔄 Migration Prompt

```
Help me migrate from [OLD_TECH] to [NEW_TECH]:

**Current:**
- [e.g., MongoDB → PostgreSQL]
- [e.g., Firebase → S3]

**Codebase size:** [files, lines of code]
**Data volume:** [records, storage]

Provide:
1. Migration strategy
2. Data transformation scripts
3. Code changes needed
4. Rollback plan
5. Testing checklist
6. Downtime estimate
```

---

## 💡 Feature Brainstorming Prompt

```
Suggest innovative features for my music streaming app:

**Current features:**
- Upload & transcode
- Streaming with quality switching
- Playlists
- Search

**Target audience:** [e.g., independent artists, Tamil music lovers]
**Differentiator:** [What makes it unique]

Suggest:
1. 5 unique features
2. Implementation complexity (1-10)
3. User value (1-10)
4. Technical approach
5. MVP version
```

---

## 🎯 Quick Fix Templates

### "It's not working"

```
My [FEATURE] is not working:

**Expected:** [What should happen]
**Actual:** [What's happening]
**Steps to reproduce:**
1. [Step 1]
2. [Step 2]

**Error message:** [If any]
**Browser/Environment:** [Details]
**Code:** [Relevant snippet]

Debug and fix.
```

### "How do I implement X?"

```
How do I implement [FEATURE] in my music app?

**Context:**
- Current stack: [List]
- Related code: [Paste]

**Requirements:**
- [Requirement 1]
- [Requirement 2]

Provide:
- Step-by-step guide
- Code examples
- Best practices
- Potential pitfalls
```

---

## 📚 Documentation Prompt

```
Generate comprehensive documentation for:

**Component/API:** [Name]
**Code:** [Paste code]

Include:
- Overview
- API reference
- Usage examples
- Props/Parameters
- Return values
- Error handling
- Best practices
- Common pitfalls

Format: Markdown with code blocks
```

---

## 🎓 Learning Prompt

```
Explain [CONCEPT] in the context of my music streaming app:

**Concept:** [e.g., Signed URLs, JWT refresh tokens, FFmpeg]
**My current understanding:** [What you know]

Explain:
1. What it is
2. Why we use it
3. How it works in our app
4. Common mistakes
5. Best practices
6. Alternatives

Use examples from our codebase.
```

---

## 💬 Code Review Prompt

````
Review this code from my music streaming app:

**File:** [Filename]
**Purpose:** [What it does]

```typescript
[Paste code]
````

Review for:

- Code quality
- Performance
- Security
- Best practices
- TypeScript usage
- Error handling
- Readability

Provide:

- Issues found (with severity)
- Suggested improvements
- Refactored code

```

---

## 🚨 Emergency Prompt

```

URGENT: Production issue in music streaming app!

**Impact:** [Users affected, severity]
**Error:** [Error message]
**Service:** [Which service is down]
**Started:** [When]

**Quick checks done:**

- [ ] Logs reviewed
- [ ] Recent deployments checked
- [ ] Resource usage checked

**Logs:**
[Paste recent logs]

Need:

1. Immediate fix/workaround
2. Root cause
3. Prevention strategy

```

---

## 💡 Pro Tips for Using AI Prompts

1. **Be specific** - Include exact error messages, code snippets, and context
2. **Provide structure** - Use the templates above as starting points
3. **Iterate** - Ask follow-up questions to refine solutions
4. **Verify** - Always test AI-generated code before deploying
5. **Learn** - Ask "why" to understand the reasoning
6. **Context matters** - Mention your tech stack and constraints
7. **Security first** - Never paste real secrets or credentials
8. **Version control** - Commit before applying AI suggestions

---

## 📝 Prompt Customization

Replace these placeholders in any prompt:
- `[FEATURE]` - Feature name
- `[ERROR]` - Error message
- `[CODE]` - Code snippet
- `[TECH]` - Technology name
- `[ENVIRONMENT]` - dev/staging/production
- `[PLATFORM]` - Cloud provider
```
