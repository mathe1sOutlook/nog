'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export default function ConveniosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Convênios</h1>
        <p className="text-sm text-muted-foreground">
          Gerenciar convênios, aliases e regras de repasse
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Building2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-lg font-medium">71 convênios cadastrados</p>
          <p className="text-sm text-muted-foreground">
            Os convênios serão populados automaticamente a partir dos uploads de dados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
