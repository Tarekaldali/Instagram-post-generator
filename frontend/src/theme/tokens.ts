import { themeColors } from './colors';

export const themeTokens = {
  shadowSoft: '0 18px 50px rgba(17, 17, 17, 0.08)',
  shadowStrong: '0 30px 80px rgba(17, 17, 17, 0.18)',
  radiusLarge: '28px',
  radiusMedium: '18px',
  radiusSmall: '12px',
  colors: themeColors,
} as const;

export const planHighlights: Record<string, string> = {
  FREE: 'A simple starting point for your first post flow',
  STARTER: 'For solo creators posting on a real schedule',
  PRO: 'For brands running repeat campaigns each week',
  ENTERPRISE: 'For teams that need volume, control, and oversight',
};

export const roleLabels: Record<string, string> = {
  admin: 'Admin',
  user: 'Member',
};
