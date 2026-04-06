export type Tone = 'professional' | 'funny' | 'bold' | 'aggressive';
export type Goal = 'engagement' | 'sales' | 'followers';

export interface GeneratePostPayload {
  niche: string;
  tone: Tone;
  goal: Goal;
  description?: string;
}

export interface GeneratedPost {
  id?: string;
  niche: string;
  tone: Tone;
  goal: Goal;
  description?: string;
  hooks: string[];
  caption: string;
  imageUrl?: string;
  hashtags: string[];
  createdAt?: string;
}
