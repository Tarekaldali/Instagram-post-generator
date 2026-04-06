# Instagram Post Generator SaaS

A complete full-stack SaaS app for generating Instagram-ready content with OpenAI and persisting results in MongoDB Atlas.

## Tech Stack

- Frontend: Vue 3 (Composition API), TailwindCSS, Axios, Vite
- Backend: NestJS, Mongoose, OpenAI SDK
- Database: MongoDB Atlas

## Folder Structure

```
instagram-post-generator/
  backend/
    src/
      app.module.ts
      main.ts
      post/
        dto/
          generate-post.dto.ts
        schemas/
          post.schema.ts
        post.controller.ts
        post.module.ts
        post.service.ts
    .env.example
    nest-cli.json
    package.json
    tsconfig.build.json
    tsconfig.json
  frontend/
    src/
      components/
        GeneratorForm.vue
        HooksList.vue
        PostPreview.vue
      services/
        api.ts
      App.vue
      env.d.ts
      main.ts
      style.css
      types.ts
    .env.example
    index.html
    package.json
    postcss.config.cjs
    tailwind.config.cjs
    tsconfig.app.json
    tsconfig.json
    tsconfig.node.json
    vite.config.ts
  .gitignore
  README.md
```

## Backend Environment

Create `backend/.env` and add:

- OPENROUTER_API_KEY (recommended if you use OpenRouter)
- OPENROUTER_BASE_URL (optional, defaults to https://openrouter.ai/api/v1)
- OPENROUTER_SITE_URL (optional attribution header)
- OPENROUTER_SITE_NAME (optional attribution header)
- OPENAI_API_KEY (optional fallback)
- OPENAI_MODEL (optional, defaults to openai/gpt-4o-mini when using OpenRouter)
- OPENAI_IMAGE_MODEL (optional, defaults to openai/dall-e-2 when using OpenRouter)
- OPENAI_IMAGE_SIZE (optional, defaults to 512x512)
- MONGODB_URI
- PORT (optional, default 4000)

## Frontend Environment

Create `frontend/.env` and add:

- VITE_API_BASE_URL (example: http://localhost:4000)

## Install and Run

### 1) Backend

```bash
cd backend
npm install
npm run start:dev
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173 and calls the backend API.

## API Endpoints

### POST /generate

Body:

```json
{
  "niche": "SaaS",
  "tone": "bold",
  "goal": "engagement",
  "description": "Launching a social media analytics dashboard"
}
```

Response:

```json
{
  "id": "...",
  "niche": "SaaS",
  "tone": "bold",
  "goal": "engagement",
  "description": "Launching a social media analytics dashboard",
  "hooks": ["...", "...", "...", "...", "..."],
  "caption": "...",
  "imageUrl": "https://...",
  "hashtags": ["#...", "#..."],
  "createdAt": "2026-04-06T09:22:31.000Z"
}
```

### GET /posts

Returns recent generated posts (latest first).

## OpenAI Prompt Example

The backend uses a structured prompt similar to this inside `post.service.ts`:

```text
Generate an Instagram post package as JSON only.
Input context:
- Niche: SaaS
- Tone: bold
- Goal: engagement
- Optional description: Launching a new creator tool

Rules:
1) hooks must be exactly 5 short hooks, each maximum 9 words.
2) hooks must feel human, punchy, and viral.
3) caption must be natural, story-driven, and engaging.
4) avoid overused AI phrases.
5) hashtags should be 12-18 items, lowercase, with #.

Return JSON:
{
  "hooks": ["...", "...", "...", "...", "..."],
  "caption": "...",
  "hashtags": ["#...", "#..."]
}
```

## Feature Coverage

- Post generator inputs: niche, tone, goal, optional description
- OpenAI generation: 5 hooks, caption, hashtags
- OpenAI image generation for post preview
- Realistic Instagram dark preview card
- Live loading and dynamic update on generate
- Copy caption + hashtags button
- MongoDB persistence with createdAt timestamp
- Responsive dark SaaS UI with subtle animations
