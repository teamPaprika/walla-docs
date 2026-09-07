import { source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { i18n } from '@/lib/i18n';
import { ogImage } from '@/lib/shared';
import { PlanBadge } from '@/components/badge';

export default async function Page(props: {
  params: Promise<{ lang: string; slug?: string[] }>;
}) {
  const { slug, lang } = await props.params;
  const page = source.getPage(slug, lang);
  if (!page) notFound();

  const MDX = page.data.body;
  const planSourcePage =
    slug?.[0] === 'help-center' && lang !== 'ko'
      ? source.getPage(slug, 'ko')
      : page;
  const plan =
    slug?.[0] === 'help-center' &&
    (planSourcePage?.data.plan === 'pro' ||
      planSourcePage?.data.plan === 'enterprise')
      ? planSourcePage.data.plan
      : undefined;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>
        <span className="inline-flex flex-wrap items-center gap-2">
          {page.data.title}
          <PlanBadge plan={plan} />
        </span>
      </DocsTitle>
      <DocsDescription className="bg-fd-muted rounded-xl p-4 text-sm leading-6">
        {page.data.description}
      </DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  const params = source.generateParams('slug', 'lang');
  for (const lang of i18n.languages) {
    params.push({ lang, slug: [] });
  }
  return params;
}

export async function generateMetadata(props: {
  params: Promise<{ lang: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { slug, lang } = await props.params;
  const page = source.getPage(slug, lang);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: ogImage,
    },
  };
}
