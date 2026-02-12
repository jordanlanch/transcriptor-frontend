'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getToken, clearToken } from '@/lib/api';

/**
 * Syncs localStorage token to a cookie so Next.js middleware can read it.
 * Also handles client-side redirect if no token.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = getToken();

    // Sync token to cookie for middleware
    if (token) {
      document.cookie = `transcriptor_token=${token}; path=/; SameSite=Lax`;
    } else {
      document.cookie = 'transcriptor_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      if (pathname !== '/login') {
        router.push('/login');
      }
    }
  }, [pathname, router]);

  return <>{children}</>;
}
