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
  'zh-TW': {
    displayName: '繁體中文',
    search: '搜尋',
    searchNoResult: '沒有結果',
    toc: '目錄',
    lastUpdate: '最後更新',
    nextPage: '下一頁',
    previousPage: '上一頁',
    chooseLanguage: '選擇語言',
    chooseTheme: '選擇主題',
  },
  ja: {
    displayName: '日本語',
    search: '検索',
    searchNoResult: '結果がありません',
    toc: '目次',
    lastUpdate: '最終更新',
    nextPage: '次へ',
    previousPage: '前へ',
    chooseLanguage: '言語を選択',
    chooseTheme: 'テーマを選択',
  },
  es: {
    displayName: 'Español',
    search: 'Buscar',
    searchNoResult: 'Sin resultados',
    toc: 'Contenido',
    lastUpdate: 'Última actualización',
    nextPage: 'Siguiente',
    previousPage: 'Anterior',
    chooseLanguage: 'Elegir idioma',
    chooseTheme: 'Elegir tema',
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
