import axios from 'axios';
import type {
  AdminGenerationRecord,
  AdminOverview,
  AdminUserRecord,
  AuthResponse,
  AuthUser,
  BrandProfile,
  GenerateAiPostPayload,
  GenerationRecord,
  LoginPayload,
  PlanRecord,
  RegisterPayload,
  SubscriptionRecord,
  UsageCredits,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  timeout: 120000,
});

export const setAccessToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
};

export const registerUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
};

export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  return data;
};

export const logoutUser = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const fetchCurrentUser = async (): Promise<AuthUser> => {
  const { data } = await api.get<AuthUser>('/auth/me');
  return data;
};

export const fetchBrandProfile = async (): Promise<BrandProfile | null> => {
  const { data } = await api.get<BrandProfile | null>('/brand-profile');
  return data;
};

export const saveBrandProfile = async (payload: BrandProfile): Promise<BrandProfile> => {
  const { data } = await api.put<BrandProfile>('/brand-profile', payload);
  return data;
};

export const fetchPlans = async (): Promise<PlanRecord[]> => {
  const { data } = await api.get<PlanRecord[]>('/plans');
  return data;
};

export const fetchSubscription = async (): Promise<SubscriptionRecord | null> => {
  const { data } = await api.get<SubscriptionRecord | null>('/plans/subscription');
  return data;
};

export const subscribeToPlan = async (planId: string) => {
  const { data } = await api.post('/plans/subscribe', { planId });
  return data as { plan: string; creditLimit: number; renewalDate: string; status: string };
};

export const fetchUsageCredits = async (): Promise<UsageCredits> => {
  const { data } = await api.get<UsageCredits>('/usage/credits');
  return data;
};

export const fetchGenerationHistory = async (): Promise<GenerationRecord[]> => {
  const { data } = await api.get<Array<{
    _id: string;
    hook: string;
    caption: string;
    hashtags: string[];
    imageUrl: string;
    status: 'draft' | 'scheduled' | 'published';
    optimizedPrompt: string;
    createdAt?: string;
  }>>('/history/posts');

  return data.map((record) => ({
    id: record._id,
    hook: record.hook,
    caption: record.caption,
    hashtags: record.hashtags,
    imageUrl: record.imageUrl,
    status: record.status,
    optimizedPrompt: record.optimizedPrompt,
    createdAt: record.createdAt,
  }));
};

export const generateAiPost = async (
  payload: GenerateAiPostPayload,
): Promise<GenerationRecord & { creditsRemaining: number; plan: string }> => {
  const { data } = await api.post<{
    postId: string;
    hook: string;
    caption: string;
    hashtags: string[];
    image: { sourceUrl: string };
    optimizedPrompt: string;
    creditsRemaining: number;
    plan: string;
  }>('/ai/generate-post', payload);

  return {
    id: data.postId,
    hook: data.hook,
    caption: data.caption,
    hashtags: data.hashtags,
    imageUrl: data.image?.sourceUrl ?? '',
    optimizedPrompt: data.optimizedPrompt,
    creditsRemaining: data.creditsRemaining,
    plan: data.plan,
  };
};

export const fetchAdminOverview = async (): Promise<AdminOverview> => {
  const { data } = await api.get<AdminOverview>('/admin/overview');
  return data;
};

export const fetchAdminUsers = async (): Promise<AdminUserRecord[]> => {
  const { data } = await api.get<AdminUserRecord[]>('/admin/users');
  return data;
};

export const fetchAdminPlans = async (): Promise<PlanRecord[]> => {
  const { data } = await api.get<PlanRecord[]>('/admin/plans');
  return data;
};

export const fetchAdminGenerations = async (): Promise<AdminGenerationRecord[]> => {
  const { data } = await api.get<AdminGenerationRecord[]>('/admin/generations');
  return data;
};

export default api;
