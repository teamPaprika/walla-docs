import '@/app/global.css';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { I18nProvider } from 'fumadocs-ui/i18n';
import { NextProvider } from 'fumadocs-core/framework/next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

const inter = Inter({
  subsets: ['latin'],
});

type RootLayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: RootLayoutProps) {
  const lang = 'en';

  return (
    <html lang={lang} className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <NextProvider>
          <I18nProvider locale={lang}>
            <RootProvider>{children}</RootProvider>
          </I18nProvider>
        </NextProvider>
      </body>
    </html>
  );
}
