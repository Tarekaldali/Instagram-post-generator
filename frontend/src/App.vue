<template>
  <main class="relative min-h-screen overflow-hidden px-4 py-8 md:px-8 lg:px-10">
    <div class="pointer-events-none absolute -left-28 top-8 h-64 w-64 rounded-full bg-mint/10 blur-3xl" />
    <div class="pointer-events-none absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-slate-400/10 blur-3xl" />

    <div class="relative mx-auto max-w-7xl">
      <header class="mb-8 md:mb-10">
        <p class="text-xs uppercase tracking-[0.2em] text-steel">SaaS Dashboard</p>
        <h1 class="mt-3 font-heading text-3xl text-white md:text-4xl">Instagram Post Generator</h1>
        <p class="mt-3 max-w-2xl text-sm text-steel md:text-base">
          Generate viral hooks, natural captions, and ready-to-paste hashtags in seconds.
        </p>
      </header>

      <div class="grid gap-6 lg:grid-cols-[1.06fr_0.94fr]">
        <div class="space-y-6">
          <GeneratorForm :loading="loading" @generate="onGenerate" />

          <section class="panel p-6 md:p-7 fade-in">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="font-heading text-lg text-white">Recent Posts</h2>
              <span class="text-xs uppercase tracking-[0.14em] text-steel">MongoDB</span>
            </div>

            <div v-if="recentPosts.length" class="space-y-3">
              <article
                v-for="post in recentPosts.slice(0, 4)"
                :key="post.id || `${post.caption}-${post.createdAt}`"
                class="rounded-xl border border-line bg-black/20 p-4"
              >
                <div class="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.1em] text-steel">
                  <span>{{ post.niche }}</span>
                  <span>{{ post.goal }}</span>
                </div>
                <p class="recent-caption text-sm text-slate-200">{{ post.caption }}</p>
              </article>
            </div>

            <p v-else class="rounded-xl border border-dashed border-line bg-black/20 px-4 py-6 text-sm text-steel">
              Generated posts will be saved and shown here.
            </p>
          </section>
        </div>

        <div class="space-y-6">
          <PostPreview
            :post="generatedPost"
            :loading="loading"
            :progress="progress"
            :username="username"
            @update:username="username = $event"
          />

          <HooksList :hooks="generatedPost?.hooks || []" />

          <p v-if="error" class="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {{ error }}
          </p>
        </div>
      </div>
    </div>

  </main>
</template>

<script setup lang="ts">
import { isAxiosError } from 'axios';
import { onMounted, ref } from 'vue';
import GeneratorForm from './components/GeneratorForm.vue';
import HooksList from './components/HooksList.vue';
import PostPreview from './components/PostPreview.vue';
import { fetchPosts, generatePost } from './services/api';
import type { GeneratedPost, GeneratePostPayload } from './types';

const loading = ref(false);
const error = ref('');
const generatedPost = ref<GeneratedPost | null>(null);
const recentPosts = ref<GeneratedPost[]>([]);
const username = ref('your.brand');
const progress = ref(0);
let progressTimer: number | null = null;

const startProgress = () => {
  if (progressTimer) {
    window.clearInterval(progressTimer);
  }

  progress.value = 7;
  progressTimer = window.setInterval(() => {
    if (progress.value >= 92) {
      return;
    }

    progress.value = Math.min(progress.value + Math.floor(Math.random() * 8) + 3, 92);
  }, 260);
};

const finishProgress = async () => {
  if (progressTimer) {
    window.clearInterval(progressTimer);
    progressTimer = null;
  }

  progress.value = 100;
  await new Promise((resolve) => setTimeout(resolve, 280));
  loading.value = false;
};

const loadRecentPosts = async () => {
  try {
    recentPosts.value = await fetchPosts();
  } catch {
    recentPosts.value = [];
  }
};

const onGenerate = async (payload: GeneratePostPayload) => {
  loading.value = true;
  startProgress();
  error.value = '';

  try {
    generatedPost.value = await generatePost(payload);
    await loadRecentPosts();
  } catch (err) {
    if (isAxiosError(err)) {
      const message = err.response?.data?.message;
      if (typeof message === 'string' && message.length > 0) {
        error.value = message;
      } else if (err.code === 'ECONNABORTED') {
        error.value = 'Generation timed out. Try again or reduce description length.';
      } else {
        error.value = err.message || 'Something went wrong while generating your post.';
      }
    } else {
      error.value = 'Something went wrong while generating your post. Please try again.';
    }
  } finally {
    await finishProgress();
  }
};

onMounted(async () => {
  await loadRecentPosts();
});
</script>

<style scoped>
.recent-caption {
  display: -webkit-box;
  overflow: hidden;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
