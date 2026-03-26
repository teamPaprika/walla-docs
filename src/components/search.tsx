'use client';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';
import { useDocsSearch } from 'fumadocs-core/search/client';
import { create } from '@orama/orama';
import { usePathname } from 'next/navigation';

function initOrama(locale?: string) {
  if (locale === 'ko') {
    return create({
      schema: { _: 'string' },
      components: {
        tokenizer: {
          tokenize: (text: string) => text.split(/[\s,.!?;:()[\]{}'"]+/).filter(Boolean),
          language: 'english',
          normalizationCache: new Map(),
        } as never,
      },
    });
  }
  return create({
    schema: { _: 'string' },
    language: 'english',
  });
}

function useLocaleFromPath(): string {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const supported = ['en', 'ko', 'ja', 'zh', 'vi', 'th'];
  return supported.includes(segments[0]) ? segments[0] : 'en';
}

export default function DefaultSearchDialog(props: SharedProps) {
  const locale = useLocaleFromPath();
  const { search, setSearch, query } = useDocsSearch({
    type: 'static',
    initOrama,
    locale,
  });

  return (
    <SearchDialog search={search} onSearchChange={setSearch} isLoading={query.isLoading} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={query.data !== 'empty' ? query.data : null} />
      </SearchDialogContent>
    </SearchDialog>
  );
}