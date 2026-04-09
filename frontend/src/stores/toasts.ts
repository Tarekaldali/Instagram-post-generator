import { reactive } from 'vue';

export type ToastTone = 'success' | 'error' | 'info';

export type ToastRecord = {
  id: string;
  title: string;
  description: string;
  tone: ToastTone;
};

const state = reactive({
  items: [] as ToastRecord[],
});

const dismissToast = (id: string) => {
  const index = state.items.findIndex((item) => item.id === id);
  if (index >= 0) {
    state.items.splice(index, 1);
  }
};

const pushToast = (
  title: string,
  description: string,
  tone: ToastTone = 'info',
) => {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  state.items.unshift({ id, title, description, tone });

  window.setTimeout(() => {
    dismissToast(id);
  }, 4200);
};

export const useToastStore = () => ({
  state,
  pushToast,
  dismissToast,
});
