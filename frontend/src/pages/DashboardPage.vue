<template>
  <div class="page-shell">
    <div class="container-shell pb-20">
      <header class="site-header">
        <div class="site-brand">
          <div class="brand-mark">IG</div>
          <div class="brand-copy">
            <p class="brand-title">{{ user.name }}</p>
            <p class="brand-subtitle">{{ user.email }}</p>
          </div>
        </div>

        <div class="nav-actions">
          <span class="badge badge-accent">
            {{ auth.state.user?.plan ?? user.plan }} • {{ auth.state.user?.credits ?? user.credits }} credits
          </span>
          <button class="btn btn-secondary" type="button" @click="$emit('goHome')">
            Back to site
          </button>
          <button v-if="isAdmin" class="btn btn-dark" type="button" @click="$emit('goAdmin')">
            Admin
          </button>
          <button class="btn btn-ghost" type="button" @click="$emit('logout')">Logout</button>
        </div>
      </header>

      <main class="space-y-8">
        <section class="section-stack">
          <p class="eyebrow">Workspace</p>
          <h1 class="section-title">Generate, package, and manage campaign-ready content.</h1>
          <p class="lede">
            The dashboard now runs on real auth state, real credits, real plans, and the
            authenticated AI generation flow.
          </p>
        </section>

        <section class="metric-grid">
          <article class="metric-card">
            <p class="metric-label">Current plan</p>
            <p class="metric-value">{{ auth.state.user?.plan ?? user.plan }}</p>
          </article>
          <article class="metric-card">
            <p class="metric-label">Credits remaining</p>
            <p class="metric-value">{{ auth.state.user?.credits ?? user.credits }}</p>
          </article>
          <article class="metric-card">
            <p class="metric-label">Recent generations</p>
            <p class="metric-value">{{ history.length }}</p>
          </article>
        </section>

        <section class="content-grid">
          <article class="section-card">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="eyebrow">Generate content</p>
                <h2 class="mt-3 font-['Syne'] text-3xl leading-none">Prompt the next campaign.</h2>
              </div>
              <span class="badge">{{ subscriptionStatus }}</span>
            </div>

            <div class="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label class="field-label" for="niche">Niche</label>
                <input
                  id="niche"
                  v-model.trim="generator.niche"
                  class="field-input"
                  type="text"
                  placeholder="SaaS, Fitness, Real Estate"
                />
              </div>

              <div>
                <label class="field-label" for="goal">Goal</label>
                <select id="goal" v-model="generator.goal" class="field-select">
                  <option value="engagement">Engagement</option>
                  <option value="sales">Sales</option>
                  <option value="followers">Followers</option>
                </select>
              </div>

              <div>
                <label class="field-label" for="tone">Tone</label>
                <select id="tone" v-model="generator.tone" class="field-select">
                  <option value="professional">Professional</option>
                  <option value="funny">Funny</option>
                  <option value="bold">Bold</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>

              <div>
                <label class="field-label" for="topic">Campaign topic</label>
                <input
                  id="topic"
                  v-model.trim="campaignTopic"
                  class="field-input"
                  type="text"
                  placeholder="Spring launch, webinar push, product update"
                />
              </div>
            </div>

            <div class="mt-4">
              <label class="field-label" for="description">Context</label>
              <textarea
                id="description"
                v-model.trim="generator.description"
                class="field-textarea"
                placeholder="Add timing, offer, CTA direction, or what matters most in this generation."
              />
            </div>

            <div class="mt-5 hero-actions">
              <button class="btn btn-primary" type="button" :disabled="generating" @click="handleGenerate">
                {{ generating ? 'Generating...' : 'Generate content' }}
              </button>
              <button class="btn btn-secondary" type="button" :disabled="loading" @click="refreshDashboard">
                {{ loading ? 'Refreshing...' : 'Refresh data' }}
              </button>
            </div>
          </article>

          <article class="dark-card p-6">
            <div class="preview-shell">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="eyebrow text-orange-200">Latest output</p>
                  <h2 class="mt-3 font-['Syne'] text-3xl leading-none">Campaign preview</h2>
                </div>
                <span class="badge badge-dark">{{ latestStatus }}</span>
              </div>

              <img
                v-if="currentGeneration && resolvedPreviewImage"
                :src="resolvedPreviewImage"
                alt="Latest generated post preview"
                class="preview-image"
              />
              <div v-else class="preview-placeholder">
                Generate a post to see the latest hook, caption, and image here.
              </div>

              <div class="section-stack">
                <div>
                  <p class="field-label text-orange-200">Hook</p>
                  <p class="text-lg font-semibold">{{ currentGeneration?.hook ?? 'No hook yet' }}</p>
                </div>
                <div>
                  <p class="field-label text-orange-200">Caption</p>
                  <p class="text-sm leading-7 text-orange-50/86">
                    {{ currentGeneration?.caption ?? 'Your generated caption will appear here.' }}
                  </p>
                </div>
                <div>
                  <p class="field-label text-orange-200">Hashtags</p>
                  <p class="text-sm text-orange-50/78">
                    {{
                      currentGeneration
                        ? currentGeneration.hashtags.join(' ')
                        : '#instagram #marketing #content'
                    }}
                  </p>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section class="content-grid">
          <article class="section-card">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="eyebrow">Brand profile</p>
                <h2 class="mt-3 font-['Syne'] text-3xl leading-none">Shape every output.</h2>
              </div>
              <button class="btn btn-secondary" type="button" :disabled="savingProfile" @click="saveProfileChanges">
                {{ savingProfile ? 'Saving...' : 'Save profile' }}
              </button>
            </div>

            <div class="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label class="field-label" for="business-name">Business name</label>
                <input id="business-name" v-model.trim="brandProfile.businessName" class="field-input" type="text" />
              </div>
              <div>
                <label class="field-label" for="brand-niche">Niche</label>
                <input id="brand-niche" v-model.trim="brandProfile.niche" class="field-input" type="text" />
              </div>
              <div>
                <label class="field-label" for="brand-tone">Tone</label>
                <input id="brand-tone" v-model.trim="brandProfile.tone" class="field-input" type="text" />
              </div>
              <div>
                <label class="field-label" for="brand-goal">Goal</label>
                <input id="brand-goal" v-model.trim="brandProfile.goal" class="field-input" type="text" />
              </div>
            </div>

            <div class="mt-4">
              <label class="field-label" for="brand-audience">Target audience</label>
              <textarea
                id="brand-audience"
                v-model.trim="brandProfile.targetAudience"
                class="field-textarea"
              />
            </div>
          </article>

          <article class="section-card">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="eyebrow">Plans</p>
                <h2 class="mt-3 font-['Syne'] text-3xl leading-none">Seeded and ready.</h2>
              </div>
              <p class="field-help">Plan changes immediately update your account credits.</p>
            </div>

            <div class="plan-grid mt-6">
              <article
                v-for="plan in plans"
                :key="plan._id"
                class="plan-card"
                :class="{ 'is-current': plan.name === (auth.state.user?.plan ?? user.plan) }"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-['Syne'] text-2xl">{{ plan.name }}</p>
                    <p class="field-help">{{ planHighlights[plan.name] ?? 'Flexible plan option' }}</p>
                  </div>
                  <span class="badge badge-accent">${{ plan.price }}</span>
                </div>

                <p class="mt-4 text-sm font-semibold">{{ plan.creditLimit }} credits / cycle</p>
                <ul class="mt-4 space-y-2 text-sm leading-6 text-[color:var(--color-text-muted)]">
                  <li v-for="feature in plan.features" :key="feature">{{ feature }}</li>
                </ul>

                <button
                  class="btn mt-5 w-full"
                  :class="plan.name === (auth.state.user?.plan ?? user.plan) ? 'btn-dark' : 'btn-secondary'"
                  type="button"
                  :disabled="activatingPlan === plan._id || plan.name === (auth.state.user?.plan ?? user.plan)"
                  @click="activatePlan(plan._id)"
                >
                  {{
                    plan.name === (auth.state.user?.plan ?? user.plan)
                      ? 'Current plan'
                      : activatingPlan === plan._id
                        ? 'Activating...'
                        : 'Activate plan'
                  }}
                </button>
              </article>
            </div>
          </article>
        </section>

        <section class="table-shell">
          <div class="table-title">
            <div>
              <p class="eyebrow">History</p>
              <h2 class="mt-3 font-['Syne'] text-3xl leading-none">Recent generations</h2>
            </div>
            <p class="field-help">Authenticated AI runs now appear here after each generation.</p>
          </div>

          <div class="table-scroll">
            <div v-if="history.length" class="list-stack">
              <article v-for="item in history" :key="item.id" class="history-card">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div class="max-w-3xl">
                    <p class="font-semibold">{{ item.hook }}</p>
                    <p class="mt-2 text-sm leading-7 text-[color:var(--color-text-muted)]">
                      {{ item.caption }}
                    </p>
                    <p class="mt-3 text-sm text-[color:var(--color-accent-strong)]">
                      {{ item.hashtags.join(' ') }}
                    </p>
                  </div>
                  <span class="badge">{{ item.status ?? 'draft' }}</span>
                </div>
              </article>
            </div>
            <div v-else class="empty-panel">
              Your authenticated generation history will appear here after the first run.
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isAxiosError } from 'axios';
import { computed, onMounted, reactive, ref } from 'vue';
import {
  fetchBrandProfile,
  fetchGenerationHistory,
  fetchPlans,
  fetchSubscription,
  fetchUsageCredits,
  generateAiPost,
  saveBrandProfile,
  subscribeToPlan,
} from '../services/api';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toasts';
import { planHighlights } from '../theme/tokens';
import type {
  AuthUser,
  BrandProfile,
  GenerationRecord,
  Goal,
  PlanRecord,
  SubscriptionRecord,
  Tone,
} from '../types';

const props = defineProps<{
  user: AuthUser;
  isAdmin: boolean;
}>();

defineEmits<{
  (event: 'goHome'): void;
  (event: 'goAdmin'): void;
  (event: 'logout'): void;
}>();

const auth = useAuthStore();
const toastStore = useToastStore();
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '');

const loading = ref(true);
const generating = ref(false);
const savingProfile = ref(false);
const activatingPlan = ref('');
const history = ref<GenerationRecord[]>([]);
const plans = ref<PlanRecord[]>([]);
const subscription = ref<SubscriptionRecord | null>(null);
const currentGeneration = ref<GenerationRecord | null>(null);
const campaignTopic = ref('');

const brandProfile = reactive<BrandProfile>({
  businessName: props.user.name,
  niche: 'SaaS',
  tone: 'Confident and practical',
  targetAudience: 'Founders and owner-operators',
  goal: 'Generate qualified inbound interest',
});

const generator = reactive<{
  niche: string;
  tone: Tone;
  goal: Goal;
  description: string;
}>({
  niche: 'SaaS',
  tone: 'professional',
  goal: 'engagement',
  description: '',
});

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

  return error instanceof Error ? error.message : 'Unexpected error.';
};

const resolveImageUrl = (rawUrl: string) => {
  if (!rawUrl) {
    return '';
  }

  if (rawUrl.startsWith('data:image/')) {
    return rawUrl;
  }

  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return `${apiBaseUrl}/image-proxy?url=${encodeURIComponent(rawUrl)}`;
  }

  return '';
};

const subscriptionStatus = computed(() => subscription.value?.status ?? 'active');
const latestStatus = computed(() => currentGeneration.value?.status ?? 'draft');
const resolvedPreviewImage = computed(() => resolveImageUrl(currentGeneration.value?.imageUrl ?? ''));

const applyBrandProfile = (value: BrandProfile | null) => {
  if (!value) {
    return;
  }

  brandProfile.businessName = value.businessName;
  brandProfile.niche = value.niche;
  brandProfile.tone = value.tone;
  brandProfile.targetAudience = value.targetAudience;
  brandProfile.goal = value.goal;
  generator.niche = value.niche;
};

const refreshDashboard = async () => {
  loading.value = true;
  try {
    const [profile, plansResponse, subscriptionResponse, historyResponse, credits] = await Promise.all([
      fetchBrandProfile(),
      fetchPlans(),
      fetchSubscription(),
      fetchGenerationHistory(),
      fetchUsageCredits(),
    ]);

    applyBrandProfile(profile);
    plans.value = plansResponse;
    subscription.value = subscriptionResponse;
    history.value = historyResponse;
    currentGeneration.value = historyResponse[0] ?? currentGeneration.value;
    auth.patchUser({
      plan: credits.plan,
      credits: credits.credits,
    });
  } catch (error) {
    toastStore.pushToast('Unable to load dashboard', toErrorMessage(error), 'error');
  } finally {
    loading.value = false;
  }
};

const saveProfileChanges = async () => {
  savingProfile.value = true;
  try {
    const saved = await saveBrandProfile({
      businessName: brandProfile.businessName,
      niche: brandProfile.niche,
      tone: brandProfile.tone,
      targetAudience: brandProfile.targetAudience,
      goal: brandProfile.goal,
    });
    applyBrandProfile(saved);
    toastStore.pushToast('Brand profile saved', 'Future generations will use the latest profile.', 'success');
  } catch (error) {
    toastStore.pushToast('Unable to save profile', toErrorMessage(error), 'error');
  } finally {
    savingProfile.value = false;
  }
};

const buildGenerationDescription = () => {
  return [
    generator.description.trim(),
    campaignTopic.value.trim() ? `Campaign topic: ${campaignTopic.value.trim()}` : '',
    `Business: ${brandProfile.businessName}`,
    `Audience: ${brandProfile.targetAudience}`,
    `Brand tone: ${brandProfile.tone}`,
    `Goal context: ${brandProfile.goal}`,
  ]
    .filter(Boolean)
    .join(' | ');
};

const handleGenerate = async () => {
  if (!generator.niche.trim()) {
    toastStore.pushToast('Missing niche', 'Please provide a niche before generating.', 'error');
    return;
  }

  generating.value = true;
  try {
    const generated = await generateAiPost({
      niche: generator.niche.trim(),
      tone: generator.tone,
      goal: generator.goal,
      description: buildGenerationDescription(),
    });

    currentGeneration.value = {
      id: generated.id,
      hook: generated.hook,
      caption: generated.caption,
      hashtags: generated.hashtags,
      imageUrl: generated.imageUrl,
      optimizedPrompt: generated.optimizedPrompt,
      status: 'draft',
    };

    auth.patchUser({
      credits: generated.creditsRemaining,
      plan: generated.plan,
    });

    await refreshDashboard();
    toastStore.pushToast('Generation complete', 'Your latest post has been saved to history.', 'success');
  } catch (error) {
    toastStore.pushToast('Unable to generate content', toErrorMessage(error), 'error');
  } finally {
    generating.value = false;
  }
};

const activatePlan = async (planId: string) => {
  activatingPlan.value = planId;
  try {
    const response = await subscribeToPlan(planId);
    auth.patchUser({
      plan: response.plan,
      credits: response.creditLimit,
    });
    await refreshDashboard();
    toastStore.pushToast('Plan updated', `${response.plan} is now active on this account.`, 'success');
  } catch (error) {
    toastStore.pushToast('Unable to activate plan', toErrorMessage(error), 'error');
  } finally {
    activatingPlan.value = '';
  }
};

onMounted(() => {
  void refreshDashboard();
});
</script>
