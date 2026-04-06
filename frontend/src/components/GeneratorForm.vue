<template>
  <section class="panel p-6 md:p-7 animate-fadeUp">
    <div class="mb-6">
      <p class="text-xs uppercase tracking-[0.18em] text-steel">Generator</p>
      <h2 class="mt-2 font-heading text-2xl text-white">Create Scroll-Stopping Copy</h2>
      <p class="mt-2 text-sm text-steel">
        Pick your niche and intent, then generate hooks, a caption, and hashtags in one click.
      </p>
    </div>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <div>
        <label class="mb-2 block text-sm font-semibold text-white">Niche</label>
        <select
          v-model="form.niche"
          class="w-full rounded-xl border border-line bg-card px-4 py-3 text-sm text-white outline-none transition focus:border-mint"
        >
          <option v-for="niche in niches" :key="niche" :value="niche">{{ niche }}</option>
        </select>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-2 block text-sm font-semibold text-white">Tone</label>
          <select
            v-model="form.tone"
            class="w-full rounded-xl border border-line bg-card px-4 py-3 text-sm text-white outline-none transition focus:border-mint"
          >
            <option v-for="tone in tones" :key="tone" :value="tone">
              {{ tone }}
            </option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-semibold text-white">Goal</label>
          <select
            v-model="form.goal"
            class="w-full rounded-xl border border-line bg-card px-4 py-3 text-sm text-white outline-none transition focus:border-mint"
          >
            <option v-for="goal in goals" :key="goal" :value="goal">
              {{ goal }}
            </option>
          </select>
        </div>
      </div>

      <div>
        <label class="mb-2 block text-sm font-semibold text-white">Optional Description</label>
        <textarea
          v-model="form.description"
          rows="4"
          maxlength="400"
          class="w-full resize-none rounded-xl border border-line bg-card px-4 py-3 text-sm text-white outline-none transition focus:border-mint"
          placeholder="Add specific context, offer details, or campaign angle"
        />
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-mint/60 bg-mint/10 px-4 py-3 font-semibold text-mint transition hover:bg-mint/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span
          v-if="loading"
          class="h-4 w-4 animate-spin rounded-full border-2 border-mint border-r-transparent"
        />
        {{ loading ? 'Generating...' : 'Generate Post' }}
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import type { GeneratePostPayload, Goal, Tone } from '../types';

defineProps<{
  loading: boolean;
}>();

const emit = defineEmits<{
  (event: 'generate', payload: GeneratePostPayload): void;
}>();

const niches = [
  'SaaS',
  'Fitness',
  'E-commerce',
  'Personal Branding',
  'Real Estate',
  'Finance',
  'Travel',
  'Fashion',
  'Food',
  'Education',
];

const tones: Tone[] = ['professional', 'funny', 'bold', 'aggressive'];
const goals: Goal[] = ['engagement', 'sales', 'followers'];

const form = reactive<GeneratePostPayload>({
  niche: niches[0],
  tone: 'professional',
  goal: 'engagement',
  description: '',
});

const handleSubmit = () => {
  emit('generate', {
    ...form,
    description: form.description?.trim() || undefined,
  });
};
</script>
