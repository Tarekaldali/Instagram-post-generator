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
  FREE: 'For testing your first workflow',
  STARTER: 'For creators shipping consistently',
  PRO: 'For teams running weekly campaigns',
  ENTERPRISE: 'For operators managing scale',
};

export const roleLabels: Record<string, string> = {
  admin: 'Admin',
  user: 'Member',
};
