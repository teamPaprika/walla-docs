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
import { i18n } from '@/lib/i18n';
import { localeTokenizers } from '@/lib/tokenizer';

function initOrama(locale?: string) {
  const tokenize = locale ? localeTokenizers[locale] : undefined;
  if (tokenize) {
    return create({
      schema: { _: 'string' },
      components: {
        tokenizer: {
          tokenize,
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
  const segment = pathname.split('/').filter(Boolean)[0];
  return (i18n.languages as readonly string[]).includes(segment)
    ? segment
    : i18n.defaultLanguage;
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