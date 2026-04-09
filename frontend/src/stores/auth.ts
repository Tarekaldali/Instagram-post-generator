import { computed, reactive } from 'vue';
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  setAccessToken,
} from '../services/api';
import type { AuthUser, LoginPayload, RegisterPayload } from '../types';

const AUTH_TOKEN_STORAGE_KEY = 'instagram-post-generator.access-token';

const state = reactive({
  user: null as AuthUser | null,
  token: '',
  ready: false,
  busy: false,
});

const clearSession = () => {
  state.user = null;
  state.token = '';
  setAccessToken(null);
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

const applySession = (user: AuthUser, token: string) => {
  state.user = user;
  state.token = token;
  setAccessToken(token);
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

const hydrate = async () => {
  if (state.ready) {
    return;
  }

  const savedToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (!savedToken) {
    state.ready = true;
    setAccessToken(null);
    return;
  }

  try {
    setAccessToken(savedToken);
    const user = await fetchCurrentUser();
    state.user = user;
    state.token = savedToken;
  } catch {
    clearSession();
  } finally {
    state.ready = true;
  }
};

const login = async (payload: LoginPayload) => {
  state.busy = true;
  try {
    const response = await loginUser(payload);
    applySession(response.user, response.accessToken);
    return response.user;
  } finally {
    state.busy = false;
  }
};

const register = async (payload: RegisterPayload) => {
  state.busy = true;
  try {
    const response = await registerUser(payload);
    applySession(response.user, response.accessToken);
    return response.user;
  } finally {
    state.busy = false;
  }
};

const logout = async () => {
  try {
    if (state.token) {
      await logoutUser();
    }
  } catch {
    // Local logout should still succeed if the server token is already invalid.
  } finally {
    clearSession();
  }
};

const refreshUser = async () => {
  if (!state.token) {
    clearSession();
    return null;
  }

  const user = await fetchCurrentUser();
  state.user = user;
  return user;
};

const patchUser = (patch: Partial<AuthUser>) => {
  if (!state.user) {
    return;
  }

  state.user = {
    ...state.user,
    ...patch,
  };
};

export const useAuthStore = () => ({
  state,
  hydrate,
  login,
  register,
  logout,
  refreshUser,
  patchUser,
  isAuthenticated: computed(() => Boolean(state.user && state.token)),
  isAdmin: computed(() => state.user?.role === 'admin'),
});
