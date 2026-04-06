import type { ReactNode } from 'react';

const variants = {
  info: 'bg-[var(--color-walla-info)] text-[var(--color-walla-info-foreground)]',
  pro: 'bg-[var(--color-walla-pro)] text-[var(--color-walla-pro-foreground)]',
  enterprise: 'bg-[var(--color-walla-enterprise)] text-[var(--color-walla-enterprise-foreground)]',
  beta: 'bg-[var(--color-walla-beta)] text-[var(--color-walla-beta-foreground)]',
  new: 'bg-[var(--color-walla-new)] text-[var(--color-walla-new-foreground)]',
} as const;

type BadgeVariant = keyof typeof variants;

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
