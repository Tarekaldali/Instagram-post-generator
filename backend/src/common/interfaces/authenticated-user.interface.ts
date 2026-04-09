export interface AuthenticatedUser {
  userId: string;
  workspaceId: string;
  email: string;
  name: string;
  plan: string;
  credits: number;
  role: 'user' | 'admin';
  tokenVersion: number;
}
