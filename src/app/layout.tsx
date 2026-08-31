import './global.css';
import type { Metadata } from 'next';
import { ogImage } from '@/lib/shared';

export const metadata: Metadata = {
  // 정적 내보내기라 요청 호스트를 알 수 없다. 없으면 og:image 가 localhost 로 굳는다.
  metadataBase: new URL('https://docs.walla.my'),
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    images: ogImage,
  },
  // 없으면 X 가 작은 정사각 썸네일로 축소해 버린다.
  twitter: {
    card: 'summary_large_image',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/inter-font@3.19.0/inter.min.css"
        />
      </head>
      <body className="flex flex-col min-h-screen">
        {children}
      </body>
    </html>
  );
}
