<template>
  <div class="page-shell">
    <div class="container-shell">
      <header class="site-header">
        <div class="site-brand">
          <div class="brand-mark">IG</div>
          <div class="brand-copy">
            <p class="brand-title">Orangeframe Studio</p>
            <p class="brand-subtitle">Instagram systems for modern operators</p>
          </div>
        </div>

        <div class="nav-actions">
          <template v-if="user">
            <span class="badge badge-accent">{{ user.plan }} plan</span>
            <button class="btn btn-secondary" type="button" @click="$emit('openApp')">
              Open dashboard
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
            <button class="btn btn-secondary" type="button" @click="$emit('login')">Login</button>
            <button class="btn btn-primary" type="button" @click="$emit('signup')">
              Start free
            </button>
          </template>
        </div>
      </header>

      <main class="space-y-12 pb-20">
        <section class="hero-grid">
          <div class="section-stack">
            <p class="eyebrow">White / Black / Orange</p>
            <h1 class="display-title">A sharper Instagram engine for brands that move fast.</h1>
            <p class="lede">
              Build a content workflow that actually survives contact with the real world:
              sign in once, generate campaign-ready posts, manage plans, and give admins a
              live view of users, plans, and generations.
            </p>

            <div class="hero-actions">
              <button
                class="btn btn-primary"
                type="button"
                @click="user ? $emit('openApp') : $emit('signup')"
              >
                {{ user ? 'Resume workspace' : 'Create account' }}
              </button>
              <button class="btn btn-secondary" type="button" @click="$emit('login')">
                Sign in
              </button>
            </div>

            <div class="metric-grid">
              <article class="metric-card">
                <p class="metric-label">Session aware navigation</p>
                <p class="metric-value">Persistent</p>
              </article>
              <article class="metric-card">
                <p class="metric-label">Plan system</p>
                <p class="metric-value">4 tiers</p>
              </article>
              <article class="metric-card">
                <p class="metric-label">Admin visibility</p>
                <p class="metric-value">Live tables</p>
              </article>
            </div>
          </div>

          <article class="dark-card p-6 md:p-8">
            <div class="section-stack">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <span class="badge badge-dark">Product snapshot</span>
                <span class="badge badge-dark">/app + /admin</span>
              </div>

              <div class="preview-placeholder">
                <div>
                  <p class="eyebrow text-orange-200">Campaign Preview</p>
                  <h2 class="mt-4 font-['Syne'] text-3xl leading-tight">
                    “Stop wasting good ideas on weak packaging.”
                  </h2>
                  <p class="mt-4 max-w-md text-sm leading-7 text-orange-50/78">
                    Dedicated auth, persistent state, seeded plans, and admin oversight now
                    live inside one cohesive interface.
                  </p>
                </div>
              </div>

              <div class="feature-grid">
                <article class="insight-card bg-white/5 text-white">
                  <p class="text-sm font-semibold">Dedicated login page</p>
                  <p class="mt-2 text-sm text-white/72">
                    No more modal auth dead ends.
                  </p>
                </article>
                <article class="insight-card bg-white/5 text-white">
                  <p class="text-sm font-semibold">Seeded plans on boot</p>
                  <p class="mt-2 text-sm text-white/72">
                    FREE, STARTER, PRO, ENTERPRISE.
                  </p>
                </article>
                <article class="insight-card bg-white/5 text-white">
                  <p class="text-sm font-semibold">Admin visibility</p>
                  <p class="mt-2 text-sm text-white/72">
                    Users, plans, and generations in one view.
                  </p>
                </article>
              </div>
            </div>
          </article>
        </section>

        <section class="feature-grid">
          <article class="section-card">
            <p class="eyebrow">01</p>
            <h2 class="mt-3 font-['Syne'] text-2xl">Real authentication flow</h2>
            <p class="mt-3 lede">
              Signup and login now connect to the backend instead of simulating success in
              local component state.
            </p>
          </article>
          <article class="section-card">
            <p class="eyebrow">02</p>
            <h2 class="mt-3 font-['Syne'] text-2xl">Operator-grade dashboard</h2>
            <p class="mt-3 lede">
              Generate content, manage brand context, inspect credits, and activate plans
              from a single workspace.
            </p>
          </article>
          <article class="section-card">
            <p class="eyebrow">03</p>
            <h2 class="mt-3 font-['Syne'] text-2xl">Protected admin route</h2>
            <p class="mt-3 lede">
              Admins get a dedicated route with data tables instead of guessing how to
              reach internal tooling.
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
