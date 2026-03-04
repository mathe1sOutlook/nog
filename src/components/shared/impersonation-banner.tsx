'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function ImpersonationBanner() {
  const user = useAppStore((s) => s.user);
  const [impersonating, setImpersonating] = useState(false);
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    // Check if the /api/auth/me response included impersonation info
    fetch('/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.impersonating) {
          setImpersonating(true);
          setAdminName(data.adminName ?? 'Admin');
        } else {
          setImpersonating(false);
        }
      });
  }, [user]);

  if (!impersonating) return null;

  const stopImpersonation = async () => {
    await fetch('/api/admin/impersonate', { method: 'DELETE' });
    window.location.href = '/admin/doctors';
  };

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950">
      <span>
        Visualizando como <strong>{user?.fullName}</strong> (admin: {adminName})
      </span>
      <Button
        variant="outline"
        size="sm"
        className="h-6 border-amber-700/30 bg-amber-400/50 text-amber-950 hover:bg-amber-400"
        onClick={stopImpersonation}
      >
        <X className="mr-1 h-3 w-3" /> Sair
      </Button>
    </div>
  );
}
