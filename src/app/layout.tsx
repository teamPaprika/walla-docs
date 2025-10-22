import '@/app/global.css';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { I18nProvider } from 'fumadocs-ui/i18n';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
});

export default async function Layout({
  children,
  params,
}: LayoutProps<'/'>) {
  const { lang } = await params;

  return (
    <html lang={lang || 'en'} className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <I18nProvider locale={lang || 'en'}>
          <RootProvider>{children}</RootProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
