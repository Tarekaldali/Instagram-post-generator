<template>
  <div class="page-shell">
    <div class="container-shell">
      <header class="site-header site-header-floating">
        <div class="site-brand">
          <div class="brand-mark">AD</div>
          <div class="brand-copy">
            <p class="brand-title">FrameFlow admin</p>
            <p class="brand-subtitle">{{ user.email }}</p>
          </div>
        </div>

        <div class="nav-actions">
          <span class="badge badge-admin">Admin only</span>
          <button class="btn btn-secondary" type="button" @click="$emit('goApp')">
            Back to app
          </button>
          <button class="btn btn-secondary" type="button" @click="$emit('goHome')">
            Back to site
          </button>
          <button class="btn btn-ghost" type="button" @click="$emit('logout')">Logout</button>
        </div>
      </header>

      <main class="page-stack">
        <section class="spotlight-shell">
          <div class="story-grid" style="position: relative; z-index: 1; align-items: start;">
            <div class="panel-stack">
              <div>
                <p class="eyebrow eyebrow-inverse">Operations</p>
                <h1 class="spotlight-title">See the live health of accounts, plans, and generation activity.</h1>
              </div>
              <p class="spotlight-lede" style="margin-inline: 0; text-align: left;">
                This admin view keeps the back office clear: who is using the app, what plans are
                active, and how often the generator is being used.
              </p>
            </div>

            <article class="status-card" style="background: rgba(248, 250, 255, 0.12); color: #f8faff;">
              <span class="badge badge-dark">{{ loading ? 'Refreshing' : 'Live data' }}</span>
              <h2 class="panel-title" style="color: #f8faff;">Protected workspace overview</h2>
              <ul class="status-list">
                <li>Users, plans, and generations load from protected backend routes.</li>
                <li>The most recent 100 authenticated content runs are available below.</li>
                <li>Refresh anytime to pull the newest operational data.</li>
              </ul>
            </article>
          </div>

          <div class="metric-grid" style="position: relative; z-index: 1;">
            <article class="metric-card">
              <p class="metric-label">Users</p>
              <p class="metric-value">{{ overview.userCount }}</p>
              <p class="metric-note">Registered accounts currently available to the system.</p>
            </article>
            <article class="metric-card">
              <p class="metric-label">Plans</p>
              <p class="metric-value">{{ overview.planCount }}</p>
              <p class="metric-note">Active plan records seeded and tracked by the backend.</p>
            </article>
            <article class="metric-card">
              <p class="metric-label">Post generations</p>
              <p class="metric-value">{{ overview.generationCount }}</p>
              <p class="metric-note">Saved content runs made through authenticated workspaces.</p>
            </article>
            <article class="metric-card">
              <p class="metric-label">Image generations</p>
              <p class="metric-value">{{ overview.imageGenerationCount }}</p>
              <p class="metric-note">Image requests tracked for visibility and usage monitoring.</p>
            </article>
          </div>
        </section>

        <section class="table-shell">
          <div class="table-title">
            <div>
              <p class="eyebrow">Users</p>
              <h2 class="panel-title">Account list</h2>
            </div>
            <button class="btn btn-secondary" type="button" :disabled="loading" @click="loadAdminData">
              {{ loading ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>

          <div class="table-scroll">
            <table v-if="users.length" class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Plan</th>
                  <th>Credits</th>
                  <th>Workspace</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="account in users" :key="account.id">
                  <td>{{ account.name }}</td>
                  <td>{{ account.email }}</td>
                  <td>{{ roleLabels[account.role] ?? account.role }}</td>
                  <td>{{ account.plan }}</td>
                  <td>{{ account.credits }}</td>
                  <td>{{ account.workspaceName }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-panel">No users are available yet.</div>
          </div>
        </section>

        <section class="table-shell">
          <div class="table-title">
            <div>
              <p class="eyebrow">Plans</p>
              <h2 class="panel-title">Plan inventory</h2>
            </div>
            <p class="field-help" style="margin: 0;">Every plan is visible here with subscriber counts.</p>
          </div>

          <div class="table-scroll">
            <table v-if="plans.length" class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Credits</th>
                  <th>Subscribers</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="plan in plans" :key="plan._id">
                  <td>{{ plan.name }}</td>
                  <td>${{ plan.price }}</td>
                  <td>{{ plan.creditLimit }}</td>
                  <td>{{ plan.subscriberCount ?? 0 }}</td>
                  <td>{{ plan.active ? 'Active' : 'Inactive' }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-panel">No plans are available yet.</div>
          </div>
        </section>

        <section class="table-shell">
          <div class="table-title">
            <div>
              <p class="eyebrow">Generations</p>
              <h2 class="panel-title">Recent content runs</h2>
            </div>
            <p class="field-help" style="margin: 0;">Most recent 100 authenticated generations.</p>
          </div>

          <div class="table-scroll">
            <table v-if="generations.length" class="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Hook</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in generations" :key="item.id">
                  <td>
                    <div>{{ item.userName }}</div>
                    <div class="field-help">{{ item.userEmail }}</div>
                  </td>
                  <td>
                    <div>{{ item.hook }}</div>
                    <div class="field-help">{{ item.caption.slice(0, 120) }}...</div>
                  </td>
                  <td>{{ item.status }}</td>
                  <td>{{ formatDate(item.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-panel">No generations are available yet.</div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isAxiosError } from 'axios';
import { onMounted, reactive, ref } from 'vue';
import {
  fetchAdminGenerations,
  fetchAdminOverview,
  fetchAdminPlans,
  fetchAdminUsers,
} from '../services/api';
import { useToastStore } from '../stores/toasts';
import { roleLabels } from '../theme/tokens';
import type {
  AdminGenerationRecord,
  AdminOverview,
  AdminUserRecord,
  AuthUser,
  PlanRecord,
} from '../types';

defineProps<{
  user: AuthUser;
}>();

defineEmits<{
  (event: 'goApp'): void;
  (event: 'goHome'): void;
  (event: 'logout'): void;
}>();

const toastStore = useToastStore();
const loading = ref(false);
const overview = reactive<AdminOverview>({
  userCount: 0,
  planCount: 0,
  generationCount: 0,
  imageGenerationCount: 0,
});
const users = ref<AdminUserRecord[]>([]);
const plans = ref<PlanRecord[]>([]);
const generations = ref<AdminGenerationRecord[]>([]);

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

const formatDate = (value?: string) => {
  if (!value) {
    return 'Just now';
  }

  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const loadAdminData = async () => {
  loading.value = true;
  try {
    const [overviewResponse, usersResponse, plansResponse, generationsResponse] = await Promise.all([
      fetchAdminOverview(),
      fetchAdminUsers(),
      fetchAdminPlans(),
      fetchAdminGenerations(),
    ]);

    overview.userCount = overviewResponse.userCount;
    overview.planCount = overviewResponse.planCount;
    overview.generationCount = overviewResponse.generationCount;
    overview.imageGenerationCount = overviewResponse.imageGenerationCount;
    users.value = usersResponse;
    plans.value = plansResponse;
    generations.value = generationsResponse;
  } catch (error) {
    toastStore.pushToast('Unable to load admin data', toErrorMessage(error), 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  void loadAdminData();
});
</script>
