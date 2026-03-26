import { redirect } from 'next/navigation';
import { i18n } from '@/lib/i18n';

export default async function HomePage(props: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await props.params;
  redirect(`/${lang}/docs`);
}

export function generateStaticParams() {
  return i18n.languages.map((lang) => ({ lang }));
}
