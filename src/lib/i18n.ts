import { defineI18n } from 'fumadocs-core/i18n';

export const i18n = defineI18n({
  defaultLanguage: 'en',
  languages: ['en', 'ko', 'zh-TW', 'ja', 'es', 'pt-BR'],
  hideLocale: 'never',
  parser: 'dir',
});
