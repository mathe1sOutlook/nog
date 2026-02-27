'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitCompare, Plus } from 'lucide-react';
import Link from 'next/link';

export default function ConferencePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sessões de Conferência</h1>
          <p className="text-sm text-muted-foreground">
            Histórico de conferências entre produção e repasse
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/conference/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova Conferência
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <GitCompare className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-lg font-medium">Nenhuma conferência realizada</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Faça upload dos dados e inicie uma conferência para detectar divergências.
          </p>
          <Button asChild>
            <Link href="/upload">Fazer Upload</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
