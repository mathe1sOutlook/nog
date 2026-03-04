'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/stores/app-store';

export function SessionHydrator() {
  const setUserSession = useAppStore((s) => s.setUserSession);
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    if (user) return;
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.doctorId) setUserSession(data);
      });
  }, [setUserSession, user]);

  return null;
}
