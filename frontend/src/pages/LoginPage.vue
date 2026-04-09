<template>
  <div class="page-shell">
    <div class="container-shell py-10">
      <header class="site-header">
        <div class="site-brand">
          <div class="brand-mark">IG</div>
          <div class="brand-copy">
            <p class="brand-title">Orangeframe Studio</p>
            <p class="brand-subtitle">Dedicated authentication workspace</p>
          </div>
        </div>

        <div class="nav-actions">
          <button class="btn btn-secondary" type="button" @click="$emit('goHome')">
            Back to site
          </button>
          <button
            v-if="authenticated"
            class="btn btn-primary"
            type="button"
            @click="$emit('continueSession')"
          >
            Continue session
          </button>
        </div>
      </header>

      <main class="hero-grid">
        <section class="section-stack">
          <p class="eyebrow">Dedicated route</p>
          <h1 class="display-title">Sign in without losing the rest of the product.</h1>
          <p class="lede">
            This flow is now its own page, with persistent token storage and a backend-backed
            session instead of a transient modal.
          </p>
          <div class="feature-grid">
            <article class="section-card">
              <p class="font-semibold">Stored session</p>
              <p class="field-help">The landing page knows when you are already signed in.</p>
            </article>
            <article class="section-card">
              <p class="font-semibold">Modern notifications</p>
              <p class="field-help">Errors and success states use toasts instead of blocking popups.</p>
            </article>
            <article class="section-card">
              <p class="font-semibold">Admin-aware</p>
              <p class="field-help">Admins can continue straight into `/admin` after login.</p>
            </article>
          </div>
        </section>

        <section class="login-panel p-6 md:p-8">
          <div class="stack-actions">
            <button
              class="btn"
              :class="mode === 'login' ? 'btn-dark' : 'btn-secondary'"
              type="button"
              @click="mode = 'login'"
            >
              Login
            </button>
            <button
              class="btn"
              :class="mode === 'signup' ? 'btn-dark' : 'btn-secondary'"
              type="button"
              @click="mode = 'signup'"
            >
              Signup
            </button>
          </div>

          <div class="mt-6 space-y-5">
            <div v-if="mode === 'signup'">
              <label class="field-label" for="name">Full name</label>
              <input id="name" v-model.trim="name" class="field-input" type="text" placeholder="Jane Founder" />
            </div>

            <div>
              <label class="field-label" for="email">Email</label>
              <input id="email" v-model.trim="email" class="field-input" type="email" placeholder="you@company.com" />
            </div>

            <div>
              <label class="field-label" for="password">Password</label>
              <input
                id="password"
                v-model="password"
                class="field-input"
                type="password"
                placeholder="Minimum 8 characters"
              />
            </div>

            <p v-if="formError" class="field-error">{{ formError }}</p>

            <button class="btn btn-primary w-full" type="button" :disabled="busy" @click="submit">
              {{ busy ? 'Working...' : mode === 'login' ? 'Login to workspace' : 'Create workspace' }}
            </button>

            <p class="field-help">
              {{
                mode === 'login'
                  ? 'Use your existing credentials to restore your dashboard.'
                  : 'The first account becomes the bootstrap admin when no admin exists yet.'
              }}
            </p>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { LoginPayload, RegisterPayload } from '../types';

type FormMode = 'login' | 'signup';

const props = defineProps<{
  busy: boolean;
  authenticated: boolean;
  defaultMode: FormMode;
}>();

const emit = defineEmits<{
  (event: 'goHome'): void;
  (event: 'continueSession'): void;
  (event: 'login', payload: LoginPayload): void;
  (event: 'register', payload: RegisterPayload): void;
}>();

const mode = ref<FormMode>(props.defaultMode);
const name = ref('');
const email = ref('');
const password = ref('');
const formError = ref('');

watch(
  () => props.defaultMode,
  (value) => {
    mode.value = value;
    formError.value = '';
  },
);

const submit = () => {
  formError.value = '';

  if (!email.value.includes('@')) {
    formError.value = 'Please enter a valid email address.';
    return;
  }

  if (password.value.length < 8) {
    formError.value = 'Password must be at least 8 characters.';
    return;
  }

  if (mode.value === 'signup' && name.value.trim().length < 2) {
    formError.value = 'Please enter your full name.';
    return;
  }

  if (mode.value === 'login') {
    emit('login', {
      email: email.value.trim(),
      password: password.value,
    });
    return;
  }

  emit('register', {
    name: name.value.trim(),
    email: email.value.trim(),
    password: password.value,
  });
};
</script>
