'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { i18n } from '@/lib/i18n';

function getPreferredLang(): string {
  const langs: string[] = [...i18n.languages];

  const cookie = document.cookie
    .split('; ')
    .find((c) => c.startsWith('lang='));
  if (cookie) {
    const val = cookie.split('=')[1];
    if (langs.includes(val)) return val;
  }

  // 번체 중국어는 지역 코드까지 봐야 간체와 갈린다. zh-CN 등은 매칭시키지 않는다.
  const browserLang = navigator.language;
  if (langs.includes(browserLang)) return browserLang;
  if (/^zh-(TW|HK|MO|Hant)/i.test(browserLang)) return 'zh-TW';

  const base = browserLang.split('-')[0];
  if (langs.includes(base)) return base;

  return i18n.defaultLanguage;
}

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${getPreferredLang()}/docs/help-center`);
  }, [router]);

  return null;
}
