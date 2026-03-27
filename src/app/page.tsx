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

  const browserLang = navigator.language.split('-')[0];
  if (langs.includes(browserLang)) return browserLang;

  return i18n.defaultLanguage;
}

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${getPreferredLang()}/docs/help-center`);
  }, [router]);

  return null;
}
