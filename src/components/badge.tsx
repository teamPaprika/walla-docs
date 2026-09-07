import type { ReactNode } from 'react';

const variants = {
  info: 'bg-[var(--color-walla-info)] text-[var(--color-walla-info-foreground)]',
  pro: 'bg-[#17CFB433] text-[#17CFB4]',
  enterprise: 'bg-[#FE8AB633] text-[#FE8AB6]',
  beta: 'bg-[var(--color-walla-beta)] text-[var(--color-walla-beta-foreground)]',
  new: 'bg-[var(--color-walla-new)] text-[var(--color-walla-new-foreground)]',
} as const;

type BadgeVariant = keyof typeof variants;
export type PlanBadgeVariant = 'pro' | 'enterprise';

export function Badge({
  variant = 'info',
  children,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

const planLabels: Record<PlanBadgeVariant, string> = {
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export function PlanBadge({ plan }: { plan?: PlanBadgeVariant }) {
  if (!plan) return null;

  return <Badge variant={plan}>{planLabels[plan]}</Badge>;
}
