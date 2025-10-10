import React from 'react';

interface MinimalLayoutProps {
  children: React.ReactNode;
}

/**
 * Minimal layout for pages like sign-in, sign-up, password reset, etc.
 * No header, no footer, just centered content.
 */
export default function MinimalLayout({ children }: MinimalLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
