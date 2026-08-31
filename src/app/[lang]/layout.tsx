import { RootProvider } from 'fumadocs-ui/provider/next';
import SearchDialog from '@/components/search';
import { LangCookie } from '@/components/lang-cookie';
import { i18n } from '@/lib/i18n';
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
      <LangCookie lang={lang} />
      {children}
    </RootProvider>
  );
}

export function generateStaticParams() {
  return i18n.languages.map((lang) => ({ lang }));
}
