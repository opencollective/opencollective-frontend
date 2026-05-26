import { type ReactNode } from 'react';
import localFont from 'next/font/local';

import { useIsomorphicLayoutEffect } from './hooks/useIsomorphicLayoutEffect';

/**
 * Inter loaded via next/font/local so Next.js auto-preloads the primary WOFF2
 * and generates size-adjust CSS for the fallback font, eliminating CLS caused
 * by font-swap. ApplyDocumentFont sets html/body classes for portaled content;
 * _app.js also wraps the app in inter.variable + inter.className for SSR.
 */
export const inter = localFont({
  src: [
    { path: '../public/static/fonts/inter/Inter-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/static/fonts/inter/Inter-Italic.woff2', weight: '400', style: 'italic' },
    { path: '../public/static/fonts/inter/Inter-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../public/static/fonts/inter/Inter-MediumItalic.woff2', weight: '500', style: 'italic' },
    { path: '../public/static/fonts/inter/Inter-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../public/static/fonts/inter/Inter-SemiBoldItalic.woff2', weight: '600', style: 'italic' },
    { path: '../public/static/fonts/inter/Inter-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../public/static/fonts/inter/Inter-BoldItalic.woff2', weight: '700', style: 'italic' },
    { path: '../public/static/fonts/inter/Inter-ExtraBold.woff2', weight: '800', style: 'normal' },
    { path: '../public/static/fonts/inter/Inter-ExtraBoldItalic.woff2', weight: '800', style: 'italic' },
    { path: '../public/static/fonts/inter/Inter-Black.woff2', weight: '900', style: 'normal' },
    { path: '../public/static/fonts/inter/Inter-BlackItalic.woff2', weight: '900', style: 'italic' },
  ],
  display: 'swap',
  variable: '--font-inter',
  adjustFontFallback: 'Arial',
});

export function ApplyDocumentFont({ children }: { children: ReactNode }) {
  useIsomorphicLayoutEffect(() => {
    document.documentElement.classList.add(inter.variable);
    document.body.classList.add(inter.className);

    return () => {
      document.documentElement.classList.remove(inter.variable);
      document.body.classList.remove(inter.className);
    };
  }, []);

  return children;
}
