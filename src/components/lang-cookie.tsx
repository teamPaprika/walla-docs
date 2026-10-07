'use client';

import { useEffect } from 'react';

export function LangCookie({ lang }: { lang: string }) {
  useEffect(() => {
    document.cookie = `lang=${lang};path=/;max-age=31536000`;
    document.documentElement.lang = lang;
  }, [lang]);

  return null;
}
