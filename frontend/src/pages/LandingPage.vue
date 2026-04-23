<template>
  <div class="page-shell">
    <div class="container-shell">
      <header class="site-header site-header-floating">
        <div class="site-brand">
          <div class="brand-mark">FF</div>
          <div class="brand-copy">
            <p class="brand-title">FrameFlow</p>
            <p class="brand-subtitle">Instagram post generator for fast-moving teams</p>
          </div>
        </div>

        <nav class="nav-links" aria-label="Primary">
          <a class="nav-link" href="#workflow">Workflow</a>
          <a class="nav-link" href="#workspace">Workspace</a>
          <a class="nav-link" href="#plans">Plans</a>
        </nav>

        <div class="nav-actions">
          <template v-if="user">
            <span class="badge badge-accent">{{ user.plan }} plan</span>
            <button class="btn btn-secondary" type="button" @click="$emit('openApp')">
              Open workspace
            </button>
            <button
              v-if="isAdmin"
              class="btn btn-dark"
              type="button"
              @click="$emit('openAdmin')"
            >
              Admin
            </button>
            <button class="btn btn-ghost" type="button" @click="$emit('logout')">Logout</button>
          </template>

          <template v-else>
            <button class="btn btn-secondary" type="button" @click="$emit('login')">
              Log in
            </button>
            <button class="btn btn-primary" type="button" @click="$emit('signup')">
              Get started free
            </button>
          </template>
        </div>
      </header>

      <main class="page-stack landing-stack">
        <section class="spotlight-shell">
          <div class="spotlight-copy">
            <p class="eyebrow eyebrow-inverse">Clear workflow. Faster posting.</p>
            <h1 class="spotlight-title">
              Create ready-to-post Instagram campaigns without juggling tools or messy prompts.
            </h1>
            <p class="spotlight-lede">
              FrameFlow turns a simple brief into a hook, caption, hashtags, and image preview
              inside one calm workspace. Keep the process easy, save each generation, and come
              back later with your history still intact.
            </p>

            <div class="spotlight-actions">
              <button
                class="btn btn-primary"
                type="button"
                @click="user ? $emit('openApp') : $emit('signup')"
              >
                {{ user ? 'Resume workspace' : 'Create workspace' }}
              </button>
              <button class="btn btn-secondary" type="button" @click="$emit('login')">
                Sign in
              </button>
            </div>
          </div>

          <div class="feature-rail">
            <article class="feature-rail-card">
              <span class="mini-pill">01</span>
              <h2 class="feature-card-title">Simple input</h2>
              <p class="feature-card-copy">
                Start with a niche, tone, goal, and a little campaign context.
              </p>
            </article>
            <article class="feature-rail-card">
              <span class="mini-pill">02</span>
              <h2 class="feature-card-title">Real output</h2>
              <p class="feature-card-copy">
                Generate a usable hook, caption, hashtags, and an image preview together.
              </p>
            </article>
            <article class="feature-rail-card">
              <span class="mini-pill">03</span>
              <h2 class="feature-card-title">Brand-aware</h2>
              <p class="feature-card-copy">
                Save brand details once so every new post has better context.
              </p>
            </article>
            <article class="feature-rail-card">
              <span class="mini-pill">04</span>
              <h2 class="feature-card-title">History and control</h2>
              <p class="feature-card-copy">
                Keep saved generations, plan access, and admin visibility in the same product.
              </p>
            </article>
          </div>
        </section>

        <section id="workflow" class="story-grid">
          <article class="panel">
            <div class="panel-stack">
              <div>
                <p class="eyebrow">How it works</p>
                <h2 class="section-title">One path from idea to post draft.</h2>
              </div>

              <ol class="story-list">
                <li>Set the niche, goal, tone, and campaign direction.</li>
                <li>Generate the post package and review the image preview instantly.</li>
                <li>Save the result to history so the next session starts with context.</li>
              </ol>
            </div>
          </article>

          <article class="panel-dark">
            <div class="panel-stack">
              <div>
                <p class="eyebrow eyebrow-inverse">Inside the app</p>
                <h2 class="panel-title">Built for clarity instead of clutter.</h2>
              </div>

              <div class="auth-points">
                <div class="auth-point">
                  <p class="auth-point-title">Dedicated login and workspace routes</p>
                  <p class="auth-point-copy">
                    The app keeps public pages, auth, dashboard, and admin areas easy to follow.
                  </p>
                </div>
                <div class="auth-point">
                  <p class="auth-point-title">Live credits and plans</p>
                  <p class="auth-point-copy">
                    Users can see what plan is active and how many generations remain.
                  </p>
                </div>
                <div class="auth-point">
                  <p class="auth-point-title">Saved generation history</p>
                  <p class="auth-point-copy">
                    Every successful run can return as a reusable reference for later content.
                  </p>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section id="workspace" class="section-grid">
          <article class="story-card">
            <p class="eyebrow">Landing</p>
            <h2 class="panel-title">Show the product fast.</h2>
            <p class="panel-copy">
              The first screen explains the workflow clearly and makes it obvious where to start.
            </p>
          </article>

          <article class="story-card">
            <p class="eyebrow">Dashboard</p>
            <h2 class="panel-title">Generate with less friction.</h2>
            <p class="panel-copy">
              Inputs, preview, brand profile, plan controls, and history live in one easy layout.
            </p>
          </article>

          <article class="story-card">
            <p class="eyebrow">Admin</p>
            <h2 class="panel-title">Keep the back office visible.</h2>
            <p class="panel-copy">
              Admins can monitor users, plans, and recent generations without hunting for tools.
            </p>
          </article>
        </section>

        <section id="plans" class="info-grid">
          <article class="info-card">
            <p class="metric-label">Use case</p>
            <p class="metric-value">Creators</p>
            <p class="metric-note">
              Draft posts faster when you need something usable right now.
            </p>
          </article>
          <article class="info-card">
            <p class="metric-label">Use case</p>
            <p class="metric-value">Small brands</p>
            <p class="metric-note">
              Keep brand voice and campaign direction consistent across new posts.
            </p>
          </article>
          <article class="info-card">
            <p class="metric-label">Use case</p>
            <p class="metric-value">Agencies</p>
            <p class="metric-note">
              Generate quickly, review the image, and keep an auditable history of output.
            </p>
          </article>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AuthUser } from '../types';

defineProps<{
  user: AuthUser | null;
  isAdmin: boolean;
}>();

defineEmits<{
  (event: 'login'): void;
  (event: 'signup'): void;
  (event: 'openApp'): void;
  (event: 'openAdmin'): void;
  (event: 'logout'): void;
}>();
</script>
