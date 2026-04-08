<template>
  <section class="panel relative overflow-hidden p-6 md:p-7 fade-in">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="font-heading text-lg text-white">Instagram Preview</h3>
      <button
        class="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-steel transition hover:border-mint/60 hover:text-mint disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="!post"
        @click="copyCaption"
      >
        {{ copied ? 'Copied' : 'Copy Caption' }}
      </button>
    </div>

    <div v-if="loading" class="mb-4 rounded-2xl border border-line bg-black/35 px-4 py-3 backdrop-blur-md">
      <div class="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.12em] text-slate-200">
        <span>Generating post and image</span>
        <span>{{ progress }}%</span>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-black/50">
        <div
          class="h-full rounded-full bg-gradient-to-r from-mint via-emerald-300 to-cyan-300 transition-all duration-300"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>

    <div class="mx-auto w-full max-w-[390px] overflow-hidden rounded-[28px] border border-line bg-[#0b0d12] shadow-glow">
      <div class="flex items-center justify-between px-4 pb-3 pt-4">
        <div class="flex items-center gap-3">
          <div class="grid h-9 w-9 place-content-center rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-indigo-500 p-[2px]">
            <div class="h-full w-full rounded-full bg-card" />
          </div>
          <div>
            <input
              :value="username"
              maxlength="24"
              class="w-full rounded-md bg-transparent text-sm font-semibold text-white outline-none"
              @input="updateUsername"
            />
            <p class="text-[11px] text-steel">Sponsored</p>
          </div>
        </div>
        <button type="button" class="text-slate-300" aria-label="Post menu">
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor">
            <circle cx="5" cy="12" r="1.7" />
            <circle cx="12" cy="12" r="1.7" />
            <circle cx="19" cy="12" r="1.7" />
          </svg>
        </button>
      </div>

      <div class="relative aspect-square overflow-hidden border-y border-line bg-gradient-to-br from-zinc-900 via-zinc-800 to-black">
        <img
          v-if="activeImageUrl && !imageLoadFailed"
          :key="activeImageUrl"
          :src="activeImageUrl"
          alt="Generated Instagram visual"
          class="h-full w-full object-cover"
          @load="onImageLoad"
          @error="onImageError"
        />
        <template v-else>
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(117,247,179,0.16),transparent_40%)]" />
          <div class="absolute inset-x-0 bottom-0 p-4 text-xs uppercase tracking-[0.15em] text-steel">
            {{ imageLoadFailed ? 'Image failed to render' : 'Generated image placeholder' }}
          </div>
        </template>
      </div>

      <div class="px-4 pb-4 pt-3">
      <div class="mb-2 flex items-center justify-between text-slate-200">
        <div class="flex items-center gap-4">
          <button class="transition hover:text-white" type="button" aria-label="Like">
            <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12.001 21s-6.716-4.309-9.297-8.287C.315 9.313 2.16 5 6.254 5c2.206 0 3.718 1.286 4.747 2.788C12.029 6.286 13.541 5 15.747 5c4.094 0 5.939 4.313 3.55 7.713C18.717 16.691 12.001 21 12.001 21z"
              />
            </svg>
          </button>
          <button class="transition hover:text-white" type="button" aria-label="Comment">
            <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M7 8h10M7 12h7m-8 9 1.74-3.48A8 8 0 1 1 20 12a8 8 0 0 1-8 8H6Z"
              />
            </svg>
          </button>
          <button class="transition hover:text-white" type="button" aria-label="Share">
            <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M22 2 11 13" />
              <path stroke-linecap="round" stroke-linejoin="round" d="m22 2-7 20-4-9-9-4 20-7Z" />
            </svg>
          </button>
        </div>

        <button class="transition hover:text-white" type="button" aria-label="Save">
          <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 3h14v18l-7-4-7 4V3Z"
            />
          </svg>
        </button>
      </div>

      <p class="mb-2 text-[13px] font-semibold text-white">{{ likesLine }}</p>

      <div class="space-y-2 text-[14px] leading-relaxed text-slate-100">
        <p class="inline rounded-md bg-white/10 px-2 py-1 text-[12px] font-semibold text-white">
          {{ primaryHook }}
        </p>

        <p>
          <span class="font-semibold">{{ username }}</span>
          {{ captionBody ? ` ${captionBody}` : '' }}
        </p>

        <p class="text-[13px] text-sky-300">{{ hashtagsLine }}</p>
        <p class="text-[12px] text-steel">View all 24 comments</p>
        <p class="text-[11px] uppercase tracking-[0.12em] text-steel">Just now</p>
      </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { GeneratedPost } from '../types';

const props = defineProps<{
  post: GeneratedPost | null;
  loading: boolean;
  progress: number;
  username: string;
}>();

const emit = defineEmits<{
  (event: 'update:username', value: string): void;
}>();

const copied = ref(false);
const imageLoadFailed = ref(false);
const usedInlineFallback = ref(false);
const activeImageUrl = ref('');
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '');

const previewImageUrl = computed(() => {
  const url = props.post?.imageUrl?.trim();
  if (!url) {
    return '';
  }

  if (url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return '';
});

watch(
  () => props.post?.imageUrl,
  (newValue) => {
    imageLoadFailed.value = false;
    usedInlineFallback.value = false;
    activeImageUrl.value = resolveImageUrlForDisplay(previewImageUrl.value) || buildInlineFallbackImage();
    console.info('[Preview] Received image URL for target container', {
      hasValue: Boolean(newValue),
      prefix: newValue ? newValue.slice(0, 20) : 'none',
    });
  },
  {
    immediate: true,
  },
);

const primaryHook = computed(() => props.post?.hooks?.[0] || 'Your strongest hook appears here');

const captionBody = computed(() => {
  if (!props.post?.caption) {
    return 'Generate a post to preview your final caption.';
  }

  const caption = props.post.caption.trim();
  const hook = props.post.hooks?.[0]?.trim();

  if (hook && caption.toLowerCase().startsWith(hook.toLowerCase())) {
    return caption.slice(hook.length).trim();
  }

  return caption;
});

const hashtagsLine = computed(() => {
  if (!props.post?.hashtags?.length) {
    return '#instagram #growth #socialmedia';
  }

  return props.post.hashtags.join(' ');
});

const likesLine = computed(() => {
  if (!props.post) {
    return '1,284 likes';
  }

  const seed = props.post.caption.length + (props.post.hooks[0]?.length || 0);
  const likes = 900 + (seed % 1900);
  return `${likes.toLocaleString()} likes`;
});

const onImageLoad = () => {
  imageLoadFailed.value = false;
  console.info('[Preview] Image rendered inside Instagram image container successfully.');
};

const onImageError = () => {
  if (!usedInlineFallback.value) {
    usedInlineFallback.value = true;
    activeImageUrl.value = buildInlineFallbackImage();
    imageLoadFailed.value = false;
    console.warn('[Preview] Remote image failed. Switched to inline fallback image.');
    return;
  }

  imageLoadFailed.value = true;
  console.error('[Preview] Image failed to render in Instagram image container after fallback.', {
    prefix: activeImageUrl.value ? activeImageUrl.value.slice(0, 50) : 'none',
  });
};

function buildInlineFallbackImage(): string {
  const title = sanitizeForSvg(props.post?.niche || 'Instagram Post');
  const subtitle = sanitizeForSvg(props.post?.goal || 'Generated Visual');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="45%" stop-color="#155e75"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <circle cx="820" cy="210" r="190" fill="rgba(16,185,129,0.22)"/>
  <circle cx="170" cy="860" r="210" fill="rgba(14,165,233,0.18)"/>
  <text x="72" y="150" fill="#a7f3d0" font-family="Verdana, Geneva, sans-serif" font-size="30" letter-spacing="4">INSTAGRAM VISUAL</text>
  <text x="72" y="495" fill="#ffffff" font-family="Verdana, Geneva, sans-serif" font-size="64" font-weight="700">${title}</text>
  <text x="72" y="585" fill="#d1fae5" font-family="Verdana, Geneva, sans-serif" font-size="36">${subtitle}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function resolveImageUrlForDisplay(url: string): string {
  if (!url) {
    return '';
  }

  if (url.startsWith('data:image/')) {
    return url;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `${apiBaseUrl}/image-proxy?url=${encodeURIComponent(url)}`;
  }

  return '';
}

function sanitizeForSvg(value: string): string {
  return value
      .replace(/[&<>"']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 52);
}

const updateUsername = (event: Event) => {
  emit('update:username', (event.target as HTMLInputElement).value);
};

const copyCaption = async () => {
  if (!props.post) {
    return;
  }

  const text = `${props.post.caption}\n\n${props.post.hashtags.join(' ')}`;

  await navigator.clipboard.writeText(text);
  copied.value = true;

  setTimeout(() => {
    copied.value = false;
  }, 1500);
};
</script>
