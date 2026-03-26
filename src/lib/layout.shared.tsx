import { i18n } from '@/lib/i18n';
import { defineI18nUI } from 'fumadocs-ui/i18n';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { NavLogo } from '@/components/nav-logo';

export const i18nUI = defineI18nUI(i18n, {
  en: {
    displayName: 'English',
  },
  ko: {
    displayName: '한국어',
    search: '검색',
    searchNoResult: '결과 없음',
    toc: '목차',
    lastUpdate: '마지막 업데이트',
    nextPage: '다음',
    previousPage: '이전',
    chooseLanguage: '언어 선택',
    chooseTheme: '테마 선택',
  },
});

export function baseOptions(lang: string): BaseLayoutProps {
  return {
    nav: {
      title: <NavLogo lang={lang} />,
    },
    links: [],
  };
}
