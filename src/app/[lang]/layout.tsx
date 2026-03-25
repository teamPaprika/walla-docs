import { RootProvider } from 'fumadocs-ui/provider/next';
import SearchDialog from '@/components/search';
import { i18nUI } from '@/lib/layout.shared';
import type { ReactNode } from 'react';

export default async function LangLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: ReactNode;
}) {
  const { lang } = await params;

  return (
    <RootProvider
      i18n={i18nUI.provider(lang)}
      search={{ SearchDialog }}
    >
      {children}
    </RootProvider>
  );
}

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }];
}
