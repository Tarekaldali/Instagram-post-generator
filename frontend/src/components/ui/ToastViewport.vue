<template>
  <div class="toast-viewport" aria-live="polite" aria-atomic="true">
    <transition-group name="toast">
      <article
        v-for="toast in toastStore.state.items"
        :key="toast.id"
        class="toast-card"
        :data-tone="toast.tone"
      >
        <div>
          <p class="toast-title">{{ toast.title }}</p>
          <p class="toast-description">{{ toast.description }}</p>
        </div>

        <button class="toast-close" type="button" @click="toastStore.dismissToast(toast.id)">
          Close
        </button>
      </article>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '../../stores/toasts';

const toastStore = useToastStore();
</script>
