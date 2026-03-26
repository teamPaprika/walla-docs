import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

export const revalidate = false;

const koTokenizer = {
  tokenize: (text: string) => text.split(/[\s,.!?;:()[\]{}'"]+/).filter(Boolean),
  language: 'english',
  normalizationCache: new Map(),
};

export const { staticGET: GET } = createFromSource(source, {
  localeMap: {
    ko: {
      components: {
        tokenizer: koTokenizer as never,
      },
    },
  },
});
