<template>
  <section class="panel p-6 md:p-7 fade-in">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="font-heading text-lg text-white">Viral Hooks</h3>
      <span class="rounded-full border border-line px-3 py-1 text-xs uppercase tracking-[0.15em] text-steel">
        {{ hooks.length }}/5
      </span>
    </div>

    <div v-if="hooks.length" class="space-y-3">
      <div
        v-for="(hook, index) in hooks"
        :key="`${hook}-${index}`"
        class="rounded-xl border border-line bg-black/20 px-4 py-3 text-sm text-slate-100 transition hover:border-mint/50"
      >
        <span class="mr-2 text-mint">{{ index + 1 }}.</span>{{ hook }}
      </div>
    </div>

    <p v-else class="rounded-xl border border-dashed border-line bg-black/20 px-4 py-6 text-sm text-steel">
      Hooks will appear here after generation.
    </p>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  hooks: string[];
}>();
</script>
