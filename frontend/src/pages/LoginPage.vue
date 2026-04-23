<template>
  <div class="page-shell">
    <div class="container-shell">
      <header class="site-header site-header-floating">
        <div class="site-brand">
          <div class="brand-mark">FF</div>
          <div class="brand-copy">
            <p class="brand-title">FrameFlow</p>
            <p class="brand-subtitle">Access your Instagram content workspace</p>
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

      <main class="auth-layout">
        <section class="spotlight-shell">
          <div class="spotlight-copy" style="text-align: left; justify-items: start;">
            <p class="eyebrow eyebrow-inverse">Secure sign in</p>
            <h1 class="spotlight-title">Step back into your workspace without losing momentum.</h1>
            <p class="spotlight-lede" style="margin-inline: 0; text-align: left;">
              Use one page for login or account creation, keep the experience simple, and move
              directly into the generator when your session is ready.
            </p>
          </div>

          <div class="auth-points">
            <div class="auth-point">
              <p class="auth-point-title">Persistent session</p>
              <p class="auth-point-copy">
                Returning users stay connected to the dashboard and protected routes.
              </p>
            </div>
            <div class="auth-point">
              <p class="auth-point-title">Clear branching</p>
              <p class="auth-point-copy">
                Sign up for a new workspace or log in to keep going with the current one.
              </p>
            </div>
            <div class="auth-point">
              <p class="auth-point-title">Admin-aware routing</p>
              <p class="auth-point-copy">
                Admin accounts can continue straight into the back office after authentication.
              </p>
            </div>
          </div>
        </section>

        <section class="panel login-panel auth-card">
          <div class="panel-stack">
            <div class="stack-actions">
              <button
                class="btn"
                :class="mode === 'login' ? 'btn-dark' : 'btn-secondary'"
                type="button"
                @click="mode = 'login'"
              >
                Log in
              </button>
              <button
                class="btn"
                :class="mode === 'signup' ? 'btn-dark' : 'btn-secondary'"
                type="button"
                @click="mode = 'signup'"
              >
                Create account
              </button>
            </div>

            <div>
              <p class="eyebrow">{{ mode === 'login' ? 'Welcome back' : 'New workspace' }}</p>
              <h2 class="panel-title">
                {{ mode === 'login' ? 'Log in to your generator.' : 'Create your FrameFlow account.' }}
              </h2>
              <p class="panel-copy">
                {{
                  mode === 'login'
                    ? 'Use your existing email and password to return to your saved history and plan.'
                    : 'Your first account can become the bootstrap admin if no admin exists yet.'
                }}
              </p>
            </div>

            <div v-if="mode === 'signup'">
              <label class="field-label" for="name">Full name</label>
              <input
                id="name"
                v-model.trim="name"
                class="field-input"
                type="text"
                placeholder="Jane Founder"
              />
            </div>

            <div>
              <label class="field-label" for="email">Email</label>
              <input
                id="email"
                v-model.trim="email"
                class="field-input"
                type="email"
                placeholder="you@company.com"
              />
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

            <button class="btn btn-primary btn-full" type="button" :disabled="busy" @click="submit">
              {{ busy ? 'Working...' : mode === 'login' ? 'Enter workspace' : 'Create workspace' }}
            </button>

            <p class="field-help">
              {{
                mode === 'login'
                  ? 'The app restores the correct route after login based on your account role.'
                  : 'After signup, your workspace opens immediately so you can start generating posts.'
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

watch(mode, () => {
  formError.value = '';
});

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
