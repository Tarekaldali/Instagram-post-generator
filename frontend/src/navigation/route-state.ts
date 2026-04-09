import { computed, ref } from 'vue';

export type AppPath = '/' | '/login' | '/app' | '/admin';

const allowedPaths = new Set<AppPath>(['/', '/login', '/app', '/admin']);

const normalizePath = (rawPath: string): AppPath => {
  const value = rawPath.trim() || '/';
  return allowedPaths.has(value as AppPath) ? (value as AppPath) : '/';
};

const currentPath = ref<AppPath>(normalizePath(window.location.pathname));
const currentSearch = ref(window.location.search);

let started = false;

const syncRoute = () => {
  currentPath.value = normalizePath(window.location.pathname);
  currentSearch.value = window.location.search;
};

export const startRouteSync = () => {
  if (started) {
    syncRoute();
    return;
  }

  window.addEventListener('popstate', syncRoute);
  started = true;
  syncRoute();
};

export const routeState = computed(() => ({
  path: currentPath.value,
  search: currentSearch.value,
  query: new URLSearchParams(currentSearch.value),
}));

export const navigateTo = (path: string, options: { replace?: boolean } = {}) => {
  const normalizedPath = normalizePath(path.split('?')[0] || '/');
  const nextUrl = `${normalizedPath}${path.includes('?') ? `?${path.split('?')[1]}` : ''}`;

  if (options.replace) {
    window.history.replaceState({}, '', nextUrl);
  } else {
    window.history.pushState({}, '', nextUrl);
  }

  syncRoute();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
