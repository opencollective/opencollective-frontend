'use client';

import { useEffect } from 'react';
import { useSidebar } from './SidebarContext';
import { usePathname } from 'next/navigation';

export default function RegisterPage({ page, dashboardSlug }) {
  const { registerPage } = useSidebar();
  const pathname = usePathname();
  useEffect(() => {
    registerPage({ ...page, href: page?.href ?? pathname }, dashboardSlug, 'inoverview');
  }, [page, dashboardSlug]);

  return null;
}
