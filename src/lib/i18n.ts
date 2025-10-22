import { defineI18n } from 'fumadocs-core/i18n';

export const i18n = defineI18n({
  defaultLanguage: 'en',
  languages: [
    { name: 'English', locale: 'en' },
    { name: '한국어', locale: 'ko' },
  ],
  hideLocale: 'default-locale',
});
