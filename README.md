# Instagram Post Generator SaaS

Full-stack SaaS starter for generating Instagram-ready content (hooks, captions, hashtags, and preview image), with persistence in MongoDB.

## Project Idea

The product solves a real creator problem:

- Input a niche, tone, goal, and optional campaign context.
- Generate publish-ready Instagram copy in seconds.
- Preview the result in an Instagram-style card.
- Save generated posts so users can reuse and repurpose winning content.

Target users:

- Freelance social media managers
- Small business owners
- Solo creators and coaches
- Agencies handling many client accounts

## What Is Completed

Core product delivery:

- Vue frontend with form + interactive Instagram preview
- NestJS backend with clean module architecture
- Text generation pipeline with model fallback handling
- Image generation flow with resilient fallback
- MongoDB storage + recent posts endpoint
- API diagnostics route and structured runtime logging
- Backend image proxy route for reliable browser image display

Frontend UX:

- Progress bar while generating
- Hook list panel
- Copy caption action
- Responsive layout
- Safe inline-image fallback if remote image fails

Backend reliability:

- Handles provider credit failures gracefully
- Returns usable content even when DB is unavailable
- Attempts DB reconnect before reads/writes

## Short Project Report

Status summary:

- Product architecture: Complete
- Core generation experience: Complete
- Image display in preview: Complete
- DB save/read behavior: Complete (depends on Atlas access/network policy)
- Production readiness: Partial

Main remaining work for production:

- Auth, billing, usage limits, analytics, and security hardening
- Better content quality controls and team workflows
- Deployment and observability setup

## Tech Stack

- Frontend: Vue 3, TypeScript, TailwindCSS, Axios, Vite
- Backend: NestJS, TypeScript, Mongoose, OpenAI SDK (OpenRouter compatible)
- Database: MongoDB Atlas

## Quick Start

### 1) Backend

```bash
cd backend
npm ci
npm start
```

### 2) Frontend

```bash
cd frontend
npm ci
npm run dev
```

Default URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## Environment Configuration

### Backend .env keys

Create backend/.env from backend/.env.example and set:

- OPENROUTER_API_KEY
- OPENROUTER_BASE_URL (default: https://openrouter.ai/api/v1)
- OPENROUTER_SITE_URL (optional)
- OPENROUTER_SITE_NAME (optional)
- OPENAI_API_KEY (optional fallback)
- OPENAI_MODEL
- OPENAI_TEXT_MODELS
- OPENAI_IMAGE_MODEL
- OPENAI_IMAGE_MODELS
- OPENAI_IMAGE_SIZE
- OPENAI_MAX_TOKENS
- OPENAI_IMAGE_TIMEOUT_MS
- ENABLE_CREDIT_FALLBACK
- OPENAI_FALLBACK_TEXT_MODEL
- AI_FALLBACK_IMAGE_BASE_URL
- IMAGE_PROXY_ALLOWED_HOSTS
- MONGODB_URI
- PORT

### Frontend .env keys

- VITE_API_BASE_URL=http://localhost:4000

## How To Change Image Model

You can change image model behavior in one place:

1. Set OPENAI_IMAGE_MODEL in backend/.env to your preferred model.
2. Set OPENAI_IMAGE_MODELS in backend/.env as a comma-separated priority list.
3. Restart backend.

Notes:

- First model in OPENAI_IMAGE_MODELS is attempted first.
- If provider image generation fails, fallback image URL strategy is used.

## API Endpoints

- GET /
  - Service info + runtime status
- POST /generate
  - Generate hooks, caption, hashtags, imageUrl
- GET /posts
  - Recent saved posts
- GET /image-proxy?url=<encoded_url>
  - Fetches remote image through backend for stable frontend rendering

  ## How To Turn This Into a Real Business

  ### Product positioning

  - Niche down first: agencies, coaches, or local businesses.
  - Sell a workflow, not only content generation.

  ### Monetization model

  - Free plan: limited generations per month
  - Pro plan: higher limits, brand presets, saved templates
  - Agency plan: multi-client workspace, team seats, approval flow

  ### Features to add next (highest ROI)

  1. Authentication and user accounts
  2. Stripe subscriptions + usage metering
  3. Brand kits (voice, persona, CTA style, hashtag packs)
  4. Content calendar and scheduling integrations
  5. A/B testing for hooks and caption variants
  6. Performance analytics loop (save best-performing formats)

  ### Reliability and trust upgrades

  1. Queue jobs for generation
  2. Retry policies and dead-letter handling
  3. Error tracking and audit logs
  4. Role-based access and workspace isolation
  5. CDN for generated images

  ### Growth channels

  1. Publish case studies with measurable before/after outcomes
  2. Offer 7-day creator challenge onboarding
  3. Partner with small agencies and micro-influencers
  4. Build referral program with account credits

  ## Suggested Launch Plan

  Phase 1 (1-2 weeks):

  - Auth + Stripe + usage caps
  - Stable deployment (backend + frontend + Mongo)
  - Basic admin metrics

  Phase 2 (2-4 weeks):

  - Brand kits + template library
  - Team workspaces
  - Better onboarding and activation funnel

  Phase 3:

  - Scheduling integrations
  - Performance feedback loop
  - Agency-focused features

## License

Use this repository as a product starter. Add your own license policy before public release.
