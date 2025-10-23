import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';
import { i18n } from '@/lib/i18n';
import { koTranslations } from '@/lib/i18n-strings';
import type { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

export default async function Layout({
  children,
  params,
}: LayoutProps) {
  const resolvedParams = await params;
  const lang = resolvedParams?.lang || 'en';

  const i18nConfig = {
    ...i18n,
    locale: lang,
    translations: lang === 'ko' ? koTranslations : undefined,
  };

  return (
    <DocsLayout
      tree={source.pageTree[lang]}
      i18n={i18nConfig}
      {...baseOptions()}
    >
      {children}
    </DocsLayout>
  );
}
