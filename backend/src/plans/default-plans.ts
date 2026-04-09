export type SeedPlan = {
  name: string;
  price: number;
  creditLimit: number;
  features: string[];
};

export const DEFAULT_PLANS: SeedPlan[] = [
  {
    name: 'FREE',
    price: 0,
    creditLimit: 100,
    features: ['25 monthly generations', 'Brand profile basics', 'Email support'],
  },
  {
    name: 'STARTER',
    price: 29,
    creditLimit: 1000,
    features: ['250 monthly generations', 'Templates library', 'Priority queue'],
  },
  {
    name: 'PRO',
    price: 79,
    creditLimit: 3500,
    features: ['1,000 monthly generations', 'Team workspace', 'Priority support'],
  },
  {
    name: 'ENTERPRISE',
    price: 199,
    creditLimit: 12000,
    features: ['Unlimited teammates', 'Admin controls', 'White-glove onboarding'],
  },
];

export const FREE_PLAN = DEFAULT_PLANS[0];
