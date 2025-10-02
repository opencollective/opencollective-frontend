import React from 'react';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';

// Ensure this runs on every request (no static caching)
export const dynamic = 'force-dynamic'; // or: export const revalidate = 0;
export const fetchCache = 'force-no-store'; // optional extra safety

function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <React.Fragment>
      <header>Public Nav</header>
      <main>{children}</main>
    </React.Fragment>
  );
}

function AuthedLayout({ children }: { children: ReactNode }) {
  return (
    <React.Fragment>
      <aside>Sidebar authed</aside>
      <main>{children}</main>
    </React.Fragment>
  );
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  //   const isLoggedIn = Boolean((await cookies()).get('accessTokenPayload')?.value); // or your cookie name
  const cookieData = await cookies();
  const accessTokenPayload = cookieData.get('accessTokenPayload');
  const accessTokenSignature = cookieData.get('accessTokenSignature');

  const token =
    accessTokenPayload && accessTokenSignature ? [accessTokenPayload, accessTokenSignature].join('.') : null;

  return token ? <AuthedLayout>{children}</AuthedLayout> : <PublicLayout>{children}</PublicLayout>;
}
