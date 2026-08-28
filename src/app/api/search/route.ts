import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';
import { localeTokenizers } from '@/lib/tokenizer';

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

export const { staticGET: GET } = createFromSource(source, { localeMap });
