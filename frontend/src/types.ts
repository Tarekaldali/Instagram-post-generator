export type Tone = 'professional' | 'funny' | 'bold' | 'aggressive';
export type Goal = 'engagement' | 'sales' | 'followers';
export type UserRole = 'user' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  credits: number;
  workspaceId: string;
  role: UserRole;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
}

export interface BrandProfile {
  businessName: string;
  niche: string;
  tone: string;
  targetAudience: string;
  goal: string;
}

export interface PlanRecord {
  _id: string;
  name: string;
  price: number;
  creditLimit: number;
  features: string[];
  active: boolean;
  subscriberCount?: number;
}

export interface UsageCredits {
  plan: string;
  credits: number;
}

export interface SubscriptionRecord {
  _id?: string;
  planId?: PlanRecord | string;
  status?: string;
  renewalDate?: string;
}

export interface GenerateAiPostPayload {
  niche: string;
  tone: Tone;
  goal: Goal;
  description?: string;
}

export interface GenerationRecord {
  id: string;
  hook: string;
  caption: string;
  hashtags: string[];
  imageUrl: string;
  status?: 'draft' | 'scheduled' | 'published';
  optimizedPrompt?: string;
  createdAt?: string;
}

export interface AdminOverview {
  userCount: number;
  planCount: number;
  generationCount: number;
  imageGenerationCount: number;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: string;
  credits: number;
  workspaceId: string;
  workspaceName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminGenerationRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  workspaceId: string;
  hook: string;
  caption: string;
  hashtags: string[];
  imageUrl: string;
  status: 'draft' | 'scheduled' | 'published';
  optimizedPrompt: string;
  createdAt?: string;
}
