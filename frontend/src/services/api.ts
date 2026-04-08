import axios from 'axios';
import type { GeneratedPost, GeneratePostPayload } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  timeout: 120000,
});

export const generatePost = async (payload: GeneratePostPayload): Promise<GeneratedPost> => {
  const { data } = await api.post<GeneratedPost>('/generate', payload);
  return data;
};

export const fetchPosts = async (): Promise<GeneratedPost[]> => {
  const { data } = await api.get<GeneratedPost[]>('/posts');
  return data;
};

export default api;
