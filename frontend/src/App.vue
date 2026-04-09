<template>
  <div>
    <div v-if="!auth.state.ready" class="loading-shell">
      <div class="loading-card">
        <p class="eyebrow">Preparing Workspace</p>
        <h1 class="loading-title">Restoring your session and loading the new experience.</h1>
      </div>
    </div>

    <LandingPage
      v-else-if="route.path === '/'"
      :user="auth.state.user"
      :is-admin="auth.isAdmin.value"
      @login="navigateTo('/login?mode=login')"
      @signup="navigateTo('/login?mode=signup')"
      @open-app="navigateTo('/app')"
      @open-admin="navigateTo('/admin')"
      @logout="handleLogout"
    />

    <LoginPage
      v-else-if="route.path === '/login'"
      :busy="auth.state.busy"
      :authenticated="auth.isAuthenticated.value"
      :default-mode="route.query.get('mode') === 'signup' ? 'signup' : 'login'"
      @go-home="navigateTo('/')"
      @continue-session="navigateTo(auth.isAdmin.value ? '/admin' : '/app')"
      @login="handleLogin"
      @register="handleRegister"
    />

    <DashboardPage
      v-else-if="route.path === '/app' && auth.state.user"
      :user="auth.state.user"
      :is-admin="auth.isAdmin.value"
      @go-home="navigateTo('/')"
      @go-admin="navigateTo('/admin')"
      @logout="handleLogout"
    />

    <AdminPage
      v-else-if="route.path === '/admin' && auth.state.user"
      :user="auth.state.user"
      @go-app="navigateTo('/app')"
      @go-home="navigateTo('/')"
      @logout="handleLogout"
    />

    <div v-else class="loading-shell">
      <div class="loading-card">
        <p class="eyebrow">Redirecting</p>
        <h1 class="loading-title">Taking you to the right place.</h1>
      </div>
    </div>

    <ToastViewport />
  </div>
</template>

<script setup lang="ts">
import { isAxiosError } from 'axios';
import { onMounted, watch } from 'vue';
import ToastViewport from './components/ui/ToastViewport.vue';
import { navigateTo, routeState, startRouteSync } from './navigation/route-state';
import AdminPage from './pages/AdminPage.vue';
import DashboardPage from './pages/DashboardPage.vue';
import LandingPage from './pages/LandingPage.vue';
import LoginPage from './pages/LoginPage.vue';
import { useAuthStore } from './stores/auth';
import { useToastStore } from './stores/toasts';
import type { LoginPayload, RegisterPayload } from './types';

const auth = useAuthStore();
const toastStore = useToastStore();
const route = routeState;

const toErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(' ');
    }

    if (typeof message === 'string') {
      return message;
    }

    return error.message;
  }

  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
};

const handleLogin = async (payload: LoginPayload) => {
  try {
    const user = await auth.login(payload);
    toastStore.pushToast('Signed in', `Welcome back, ${user.name}.`, 'success');
    navigateTo(user.role === 'admin' ? '/admin' : '/app', { replace: true });
  } catch (error) {
    toastStore.pushToast('Unable to sign in', toErrorMessage(error), 'error');
  }
};

const handleRegister = async (payload: RegisterPayload) => {
  try {
    const user = await auth.register(payload);
    toastStore.pushToast(
      'Account created',
      `Your workspace is ready, ${user.name}.`,
      'success',
    );
    navigateTo(user.role === 'admin' ? '/admin' : '/app', { replace: true });
  } catch (error) {
    toastStore.pushToast('Unable to create account', toErrorMessage(error), 'error');
  }
};

const handleLogout = async () => {
  await auth.logout();
  toastStore.pushToast('Signed out', 'Your session has been closed safely.', 'info');
  navigateTo('/', { replace: true });
};

watch(
  [
    () => route.value.path,
    () => auth.state.ready,
    () => auth.isAuthenticated.value,
    () => auth.isAdmin.value,
  ],
  ([path, ready, isAuthenticated, isAdmin]) => {
    if (!ready) {
      return;
    }

    if ((path === '/app' || path === '/admin') && !isAuthenticated) {
      navigateTo('/login?mode=login', { replace: true });
      return;
    }

    if (path === '/admin' && isAuthenticated && !isAdmin) {
      toastStore.pushToast(
        'Admin access required',
        'Your account does not currently have admin access.',
        'error',
      );
      navigateTo('/app', { replace: true });
    }
  },
  {
    immediate: true,
  },
);

onMounted(() => {
  startRouteSync();
  void auth.hydrate();
});
</script>
