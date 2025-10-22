import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';
import { i18n } from '@/lib/i18n';

export default async function Layout({
  children,
  params,
}: LayoutProps<'/docs'>) {
  const { lang } = await params;

  return (
    <DocsLayout
      tree={source.pageTree[lang]}
      i18n={{
        locale: lang,
        ...i18n,
      }}
      {...baseOptions()}
    >
      {children}
    </DocsLayout>
  );
}
