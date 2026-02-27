'use client';

import { KpiCards, type KpiData } from '@/components/dashboard/kpi-cards';
import {
  DivergenceByTypeChart,
  DivergenceByConvenioChart,
} from '@/components/dashboard/divergence-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, GitCompare } from 'lucide-react';
import Link from 'next/link';

// Placeholder data based on the known ETL results
const mockKpi: KpiData = {
  totalProduction: 1286,
  totalRepasse: 110,
  totalRepasseValue: 12225.65,
  totalDivergences: 1293,
  divergencesAlta: 1240,
  divergencesMedia: 1,
  divergencesBaixa: 53,
  matchRate: 3.6,
};

const mockDivergenceByType = [
  { type: 'PRODUZIDO_SEM_REPASSE' as const, count: 1240 },
  { type: 'REPASSE_SEM_PRODUCAO' as const, count: 53 },
];

const mockDivergenceByConvenio = [
  { convenio: 'QUALLITY PRÓ SAÚDE - ASA SUL', alta: 205, media: 0, baixa: 0 },
  { convenio: 'PARTICULAR', alta: 178, media: 0, baixa: 0 },
  { convenio: 'BRADESCO EMPRESARIAL', alta: 120, media: 0, baixa: 0 },
  { convenio: 'CASSI - ASA SUL', alta: 98, media: 0, baixa: 0 },
  { convenio: 'GDF SAÚDE - ASA SUL 23', alta: 82, media: 0, baixa: 0 },
  { convenio: 'GEAP - ASA SUL 23', alta: 76, media: 0, baixa: 0 },
  { convenio: 'UNIMED CNU - DIRETO 23', alta: 72, media: 0, baixa: 0 },
  { convenio: 'ASSEFAZ - ASA NORTE', alta: 55, media: 0, baixa: 0 },
  { convenio: 'SAÚDE CAIXA - AMHP 23', alta: 40, media: 0, baixa: 0 },
  { convenio: 'QUALLITY - TAGUATINGA', alta: 38, media: 0, baixa: 0 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral da conferência de repasses
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/conference/new">
              <GitCompare className="mr-2 h-4 w-4" />
              Nova Conferência
            </Link>
          </Button>
        </div>
      </div>

      <KpiCards data={mockKpi} />

      <div className="grid gap-4 lg:grid-cols-2">
        <DivergenceByTypeChart data={mockDivergenceByType} />
        <DivergenceByConvenioChart data={mockDivergenceByConvenio} />
      </div>

      {/* Quick info card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Destaque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <Badge variant="destructive">Crítico</Badge>
            <div>
              <p className="text-sm font-medium">
                QUALLITY PRÓ SAÚDE — 205 atendimentos sem repasse
              </p>
              <p className="text-xs text-muted-foreground">
                Estimativa: ~R$ 15.000+ líquidos não repassados. Convênio possivelmente inadimplente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
