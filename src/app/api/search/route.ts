import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

export const revalidate = false;

export const { staticGET: GET } = createFromSource(source, {
  localeMap: {
    // @ts-expect-error -- custom tokenizer for Korean CJK support
    ko: {
      components: {
        tokenizer: {
          tokenize: (text: string) => text.split(/[\s,.!?;:()[\]{}'"]+/).filter(Boolean),
        },
      },
    },
  },
});
