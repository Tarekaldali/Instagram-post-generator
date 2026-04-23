<template>
  <div class="page-shell">
    <div class="container-shell">
      <header class="site-header site-header-floating">
        <div class="site-brand">
          <div class="brand-mark">FF</div>
          <div class="brand-copy">
            <p class="brand-title">{{ user.name }}</p>
            <p class="brand-subtitle">{{ user.email }}</p>
          </div>
        </div>

        <div class="nav-actions">
          <span class="badge badge-accent">
            {{ currentPlanName }} plan • {{ currentCredits }} credits
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

      <main class="page-stack">
        <section class="spotlight-shell">
          <div class="story-grid" style="position: relative; z-index: 1; align-items: start;">
            <div class="panel-stack">
              <div>
                <p class="eyebrow eyebrow-inverse">Workspace</p>
                <h1 class="spotlight-title">Build the next Instagram post in one clear flow.</h1>
              </div>
              <p class="spotlight-lede" style="margin-inline: 0; text-align: left;">
                Generate the post package, review the image, adjust the brand profile, and keep
                every saved result in history without bouncing between screens.
              </p>
              <div class="spotlight-actions">
                <button class="btn btn-primary" type="button" :disabled="generating" @click="handleGenerate">
                  {{ generating ? 'Generating...' : 'Generate now' }}
                </button>
                <button class="btn btn-secondary" type="button" :disabled="loading" @click="refreshDashboard">
                  {{ loading ? 'Refreshing...' : 'Refresh data' }}
                </button>
              </div>
            </div>

            <article class="status-card" style="background: rgba(248, 250, 255, 0.12); color: #f8faff;">
              <span class="badge badge-dark">{{ subscriptionStatus }}</span>
              <h2 class="panel-title" style="color: #f8faff;">Ready for today's content run</h2>
              <ul class="status-list">
                <li>Plan: {{ currentPlanName }}</li>
                <li>Credits remaining: {{ currentCredits }}</li>
                <li>Renewal: {{ formattedRenewalDate }}</li>
                <li>{{ loading ? 'Syncing your latest dashboard data.' : 'Workspace synced and ready.' }}</li>
              </ul>
            </article>
          </div>

          <div class="metric-grid" style="position: relative; z-index: 1;">
            <article class="metric-card">
              <p class="metric-label">Current plan</p>
              <p class="metric-value">{{ currentPlanName }}</p>
              <p class="metric-note">Switch plans below whenever your posting volume changes.</p>
            </article>
            <article class="metric-card">
              <p class="metric-label">Credits</p>
              <p class="metric-value">{{ currentCredits }}</p>
              <p class="metric-note">Each generation updates your balance in real time.</p>
            </article>
            <article class="metric-card">
              <p class="metric-label">Saved posts</p>
              <p class="metric-value">{{ history.length }}</p>
              <p class="metric-note">Recent generations stay visible so you can reuse what worked.</p>
            </article>
            <article class="metric-card">
              <p class="metric-label">Latest status</p>
              <p class="metric-value">{{ latestStatus }}</p>
              <p class="metric-note">Your newest run lands here with both copy and image preview.</p>
            </article>
          </div>
        </section>

        <section class="dashboard-grid">
          <article class="panel">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Generate</p>
                <h2 class="panel-title">Describe the post briefly, then let the app do the heavy lifting.</h2>
              </div>
              <span class="badge">{{ loading ? 'Loading' : 'Ready' }}</span>
            </div>

            <div class="steps-grid">
              <div>
                <label class="field-label" for="niche">Niche</label>
                <input
                  id="niche"
                  v-model.trim="generator.niche"
                  class="field-input"
                  type="text"
                  placeholder="SaaS, fitness, skincare"
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
                  placeholder="Product launch, discount push, webinar reminder"
                />
              </div>
            </div>

            <div style="margin-top: 1rem;">
              <label class="field-label" for="description">Context</label>
              <textarea
                id="description"
                v-model.trim="generator.description"
                class="field-textarea"
                placeholder="Add timing, offer details, CTA direction, or anything the post should emphasize."
              />
              <p class="field-help">
                The generator uses this note together with your brand profile to shape both the
                caption and the image prompt.
              </p>
            </div>

            <div class="panel-ghost" style="margin-top: 1rem;">
              <p class="metric-label">Brand context currently in play</p>
              <p class="metric-note">
                {{ brandProfile.businessName || 'Your business' }} • {{ brandProfile.niche || 'Niche not set' }} •
                {{ brandProfile.tone || 'Tone not set' }}
              </p>
              <p class="metric-note">
                Audience: {{ brandProfile.targetAudience || 'No target audience saved yet.' }}
              </p>
            </div>

            <div class="spotlight-actions" style="margin-top: 1rem;">
              <button class="btn btn-primary" type="button" :disabled="generating" @click="handleGenerate">
                {{ generating ? 'Generating...' : 'Generate post package' }}
              </button>
              <button class="btn btn-secondary" type="button" :disabled="loading" @click="refreshDashboard">
                {{ loading ? 'Refreshing...' : 'Refresh workspace' }}
              </button>
            </div>
          </article>

          <article class="panel-dark">
            <div class="panel-header">
              <div>
                <p class="eyebrow eyebrow-inverse">Latest output</p>
                <h2 class="panel-title" style="color: #f8faff;">Preview the generated post before you publish.</h2>
              </div>
              <span class="badge badge-dark">{{ latestStatus }}</span>
            </div>

            <div class="preview-shell">
              <div class="preview-frame">
                <img
                  v-if="currentGeneration && resolvedPreviewImage"
                  :src="resolvedPreviewImage"
                  alt="Latest generated Instagram post preview"
                  class="preview-image"
                />
                <div v-else class="preview-placeholder">
                  Your generated image will appear here after the next successful run.
                </div>
              </div>

              <div class="detail-card">
                <p class="detail-label">Hook</p>
                <p class="detail-value">{{ currentGeneration?.hook ?? 'No hook yet' }}</p>
              </div>

              <div class="detail-card">
                <p class="detail-label">Caption</p>
                <p class="detail-value preview-copy">
                  {{
                    currentGeneration?.caption ??
                    'Your generated caption will appear here as soon as the run completes.'
                  }}
                </p>
              </div>

              <div class="detail-card">
                <p class="detail-label">Hashtags</p>
                <p class="detail-value">
                  {{
                    currentGeneration
                      ? currentGeneration.hashtags.join(' ')
                      : '#instagram #content #marketing'
                  }}
                </p>
              </div>

              <div v-if="currentGeneration?.optimizedPrompt" class="detail-card">
                <p class="detail-label">Prompt summary</p>
                <p class="detail-value">{{ currentGeneration.optimizedPrompt }}</p>
              </div>

              <div class="preview-actions">
                <button
                  class="btn btn-secondary"
                  type="button"
                  :disabled="!currentGeneration?.caption"
                  @click="copyCaption"
                >
                  Copy caption
                </button>
                <a
                  v-if="previewImageHref"
                  class="btn btn-soft"
                  :href="previewImageHref"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open image
                </a>
              </div>

              <p class="field-help" style="color: rgba(248, 250, 255, 0.66); margin: 0;">
                {{ currentGeneration?.createdAt ? `Saved ${formatDate(currentGeneration.createdAt)}.` : 'Generate a post to create a saved draft.' }}
              </p>
            </div>
          </article>
        </section>

        <section class="secondary-grid">
          <article class="panel">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Brand profile</p>
                <h2 class="panel-title">Save the context you want every post to remember.</h2>
              </div>
              <button class="btn btn-secondary" type="button" :disabled="savingProfile" @click="saveProfileChanges">
                {{ savingProfile ? 'Saving...' : 'Save profile' }}
              </button>
            </div>

            <div class="steps-grid">
              <div>
                <label class="field-label" for="business-name">Business name</label>
                <input id="business-name" v-model.trim="brandProfile.businessName" class="field-input" type="text" />
              </div>
              <div>
                <label class="field-label" for="brand-niche">Niche</label>
                <input id="brand-niche" v-model.trim="brandProfile.niche" class="field-input" type="text" />
              </div>
              <div>
                <label class="field-label" for="brand-tone">Brand tone</label>
                <input id="brand-tone" v-model.trim="brandProfile.tone" class="field-input" type="text" />
              </div>
              <div>
                <label class="field-label" for="brand-goal">Business goal</label>
                <input id="brand-goal" v-model.trim="brandProfile.goal" class="field-input" type="text" />
              </div>
            </div>

            <div style="margin-top: 1rem;">
              <label class="field-label" for="brand-audience">Target audience</label>
              <textarea
                id="brand-audience"
                v-model.trim="brandProfile.targetAudience"
                class="field-textarea"
                placeholder="Describe who the post should speak to."
              />
            </div>
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Plans</p>
                <h2 class="panel-title">Upgrade credits without leaving the workspace.</h2>
              </div>
              <p class="field-help" style="margin: 0;">Plan changes refresh your credits right away.</p>
            </div>

            <div class="plan-grid">
              <article
                v-for="plan in plans"
                :key="plan._id"
                class="plan-card"
                :class="{ 'is-current': plan.name === currentPlanName }"
              >
                <div class="panel-stack">
                  <div class="history-meta">
                    <div>
                      <p class="panel-title" style="font-size: 1.45rem;">{{ plan.name }}</p>
                      <p class="field-help">{{ planHighlights[plan.name] ?? 'Flexible credit option' }}</p>
                    </div>
                    <span class="badge badge-accent">${{ plan.price }}</span>
                  </div>

                  <p class="metric-note">{{ plan.creditLimit }} credits each billing cycle</p>

                  <div class="list-stack" style="gap: 0.5rem;">
                    <p
                      v-for="feature in plan.features"
                      :key="feature"
                      class="metric-note"
                      style="margin: 0;"
                    >
                      {{ feature }}
                    </p>
                  </div>

                  <button
                    class="btn"
                    :class="plan.name === currentPlanName ? 'btn-dark' : 'btn-secondary'"
                    type="button"
                    :disabled="activatingPlan === plan._id || plan.name === currentPlanName"
                    @click="activatePlan(plan._id)"
                  >
                    {{
                      plan.name === currentPlanName
                        ? 'Current plan'
                        : activatingPlan === plan._id
                          ? 'Activating...'
                          : 'Activate plan'
                    }}
                  </button>
                </div>
              </article>
            </div>
          </article>
        </section>

        <section class="table-shell">
          <div class="table-title">
            <div>
              <p class="eyebrow">History</p>
              <h2 class="panel-title">Saved generations stay ready for reuse.</h2>
            </div>
            <p class="field-help" style="margin: 0;">Recent content runs are listed with their saved status.</p>
          </div>

          <div class="table-scroll">
            <div v-if="history.length" class="list-stack">
              <article v-for="item in history" :key="item.id" class="history-card">
                <div class="history-meta">
                  <div>
                    <p class="panel-title" style="font-size: 1.3rem;">{{ item.hook }}</p>
                    <p class="field-help">{{ item.createdAt ? formatDate(item.createdAt) : 'Saved recently' }}</p>
                  </div>
                  <span class="badge">{{ item.status ?? 'draft' }}</span>
                </div>

                <p class="history-copy">{{ item.caption }}</p>
                <p class="metric-note" style="margin: 0;">{{ item.hashtags.join(' ') }}</p>
              </article>
            </div>
            <div v-else class="empty-panel">
              Your history will appear here after the first successful generation.
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

const currentPlanName = computed(() => auth.state.user?.plan ?? props.user.plan);
const currentCredits = computed(() => auth.state.user?.credits ?? props.user.credits);
const subscriptionStatus = computed(() => subscription.value?.status ?? 'active');
const latestStatus = computed(() => currentGeneration.value?.status ?? 'draft');
const resolvedPreviewImage = computed(() => resolveImageUrl(currentGeneration.value?.imageUrl ?? ''));
const previewImageHref = computed(() => resolvedPreviewImage.value || currentGeneration.value?.imageUrl || '');
const formattedRenewalDate = computed(() => {
  const value = subscription.value?.renewalDate;
  if (!value) {
    return 'Not scheduled yet';
  }

  return formatDate(value);
});

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

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

const copyCaption = async () => {
  if (!currentGeneration.value?.caption) {
    return;
  }

  try {
    await window.navigator.clipboard.writeText(currentGeneration.value.caption);
    toastStore.pushToast('Caption copied', 'The latest caption is now on your clipboard.', 'success');
  } catch {
    toastStore.pushToast('Unable to copy', 'Clipboard access was blocked by the browser.', 'error');
  }
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
