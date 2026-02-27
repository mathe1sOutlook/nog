'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBRL, formatDateBR, formatNumber } from '@/lib/utils/formatting';
import { Plus, FileSearch } from 'lucide-react';
import type { ConferenceSession } from '@/lib/types/database';

export default function ConferencePage() {
  const [sessions, setSessions] = useState<ConferenceSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/conference/list')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSessions(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conferências</h1>
          <p className="text-sm text-muted-foreground">
            Sessões de conferência produção × repasse
          </p>
        </div>
        <Button asChild>
          <Link href="/upload">
            <Plus className="mr-2 h-4 w-4" />
            Nova Conferência
          </Link>
        </Button>
      </div>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <FileSearch className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Nenhuma conferência realizada</p>
              <p className="text-sm text-muted-foreground">
                Faça upload dos arquivos de produção e repasse para iniciar.
              </p>
            </div>
            <Button asChild>
              <Link href="/upload">Ir para Upload</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && sessions.length > 0 && (
        <div className="space-y-4">
          {sessions.map((s) => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <Link href={`/conference/${s.id}`} className="block">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{s.name}</h3>
                        <Badge
                          variant={s.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {s.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDateBR(s.created_at)}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <div>{formatBRL(s.total_valor_repassado)}</div>
                      <div className="text-xs text-muted-foreground">repassado</div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                    <div>
                      <span className="text-muted-foreground">Produção:</span>{' '}
                      <strong>{formatNumber(s.total_production_records)}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Repasse:</span>{' '}
                      <strong>{formatNumber(s.total_repasse_records)}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Matches:</span>{' '}
                      <strong>{formatNumber(s.total_matched)}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Divergências:</span>{' '}
                      <strong className={s.total_divergences > 0 ? 'text-red-600' : ''}>
                        {formatNumber(s.total_divergences)}
                      </strong>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
