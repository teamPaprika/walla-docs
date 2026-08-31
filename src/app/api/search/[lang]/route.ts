import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';
import { localeTokenizers } from '@/lib/tokenizer';
import { i18n } from '@/lib/i18n';

export const revalidate = false;

const localeMap = Object.fromEntries(
  Object.entries(localeTokenizers).map(([locale, tokenize]) => [
    locale,
    {
      components: {
        tokenizer: {
          tokenize,
          language: 'english',
          normalizationCache: new Map(),
        } as never,
      },
    },
  ]),
);

const { staticGET } = createFromSource(source, { localeMap });

/**
 * 로케일별로 쪼개 내보낸다. 정적 검색 클라이언트는 받은 파일을 통째로 파싱해
 * 그 안의 모든 로케일 인덱스를 복원하므로, 한 파일로 두면 검색창을 여는 순간
 * 안 쓰는 언어까지 전부 내려받는다.
 */
let exported: Promise<{ data: Record<string, unknown> }> | undefined;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params;
  exported ??= staticGET().then((res) => res.json());

  return Response.json({ type: 'i18n', data: { [lang]: (await exported).data[lang] } });
}

export function generateStaticParams() {
  return i18n.languages.map((lang) => ({ lang }));
}
