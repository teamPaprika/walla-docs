import type { ReactNode } from 'react';
import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import {BookMarked, BookOpen, Code, SquareCode} from 'lucide-react';

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: ReactNode;
}) {
  const { lang } = await params;
  const isKo = lang === 'ko';

  return (
    <DocsLayout
      {...baseOptions(lang)}
      tree={source.getPageTree(lang)}
      sidebar={{
        tabs: [
          {
            title: isKo ? '헬프센터' : 'Help Center',
            description: isKo ? '사용법 및 FAQ' : 'Guides & FAQ',
            url: `/${lang}/docs/help-center`,
            icon: (
              <div className="size-full rounded-md flex items-center justify-center" style={{ backgroundColor: 'rgba(254, 138, 182, 0.15)' }}>
                <BookMarked className="size-5 md:size-4" style={{ color: '#FE8AB6' }} />
              </div>
            ),
            props: { style: { '--color-fd-primary': '#FE8AB6' } as React.CSSProperties },
          },
          {
            title: isKo ? '개발자 문서' : 'Developer Docs',
            description: isKo ? 'REST API 연동 가이드' : 'REST API Integration',
            url: `/${lang}/docs/developer-docs`,
            icon: (
              <div className="size-full rounded-md flex items-center justify-center" style={{ backgroundColor: 'rgba(23, 207, 180, 0.15)' }}>
                <SquareCode className="size-5 md:size-4" style={{ color: '#17CFB4' }} />
              </div>
            ),
            props: { style: { '--color-fd-primary': '#17CFB4' } as React.CSSProperties },
          },
        ],
      }}
    >
      {children}
    </DocsLayout>
  );
}
