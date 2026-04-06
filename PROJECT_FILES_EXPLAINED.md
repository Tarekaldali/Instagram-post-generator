# Project Files Explained

This file explains what each important file in the project does.

## Root

- `.gitignore`: Excludes secrets, dependencies, build outputs, and cache files from git.
- `README.md`: Main setup and usage guide.
- `PROJECT_FILES_EXPLAINED.md`: This file.

## Backend (NestJS)

- `backend/.env`: Runtime environment values for backend (OpenAI, MongoDB, port).
- `backend/.env.example`: Template of backend env keys.
- `backend/package.json`: Backend dependencies and scripts.
- `backend/package-lock.json`: Exact dependency lock file for backend.
- `backend/tsconfig.json`: TypeScript compiler configuration for backend source.
- `backend/tsconfig.build.json`: Build-specific TS config that excludes tests.
- `backend/nest-cli.json`: Nest CLI config (source root and build metadata).

### Backend Source

- `backend/src/main.ts`: App bootstrap, CORS, global validation pipe, and server start.
- `backend/src/app.module.ts`: Root module; wires ConfigModule, Mongoose connection, and PostModule.

### Post Module

- `backend/src/post/post.module.ts`: Registers controller/service and Mongoose schema for posts.
- `backend/src/post/post.controller.ts`: HTTP routes:
  - POST `/generate`
  - GET `/posts`
- `backend/src/post/post.service.ts`: Core business logic:
  - Builds OpenAI prompt
  - Generates hooks/caption/hashtags
  - Generates a post image
  - Validates/parses AI output
  - Saves generated result to MongoDB
  - Returns recent posts
- `backend/src/post/dto/generate-post.dto.ts`: Request validation rules for generate payload.
- `backend/src/post/schemas/post.schema.ts`: Mongoose schema for saved posts.

## Frontend (Vue 3 + Tailwind)

- `frontend/.env`: Runtime env for frontend (API base URL).
- `frontend/.env.example`: Template of frontend env keys.
- `frontend/index.html`: Vite HTML entry point.
- `frontend/package.json`: Frontend dependencies and scripts.
- `frontend/package-lock.json`: Exact dependency lock file for frontend.
- `frontend/vite.config.ts`: Vite config (Vue plugin, dev server settings).
- `frontend/tailwind.config.cjs`: Tailwind theme extension (colors, fonts, animations).
- `frontend/postcss.config.cjs`: PostCSS plugin setup for Tailwind.
- `frontend/tsconfig.json`: TS project references.
- `frontend/tsconfig.app.json`: TS config for app source.
- `frontend/tsconfig.node.json`: TS config for Vite/node tooling files.

### Frontend Source

- `frontend/src/main.ts`: Mounts Vue app.
- `frontend/src/style.css`: Global styles, Tailwind imports, custom dark SaaS visuals.
- `frontend/src/env.d.ts`: Vue + Vite TypeScript module declarations.
- `frontend/src/types.ts`: Shared TypeScript interfaces for request/response objects.
- `frontend/src/services/api.ts`: Axios API layer for `/generate` and `/posts`.
- `frontend/src/App.vue`: Main page layout and orchestration:
  - Form submission
  - Loading/progress overlay
  - Error handling
  - Recent posts loading
- `frontend/src/components/GeneratorForm.vue`: Input form (niche/tone/goal/description).
- `frontend/src/components/HooksList.vue`: Displays generated hooks list.
- `frontend/src/components/PostPreview.vue`: Instagram-like preview card with generated image/caption/hashtags and copy button.
