'use client';

import { KpiCards, type KpiData } from '@/components/dashboard/kpi-cards';
import {
  DivergenceByTypeChart,
  DivergenceByConvenioChart,
} from '@/components/dashboard/divergence-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, GitCompare, Sparkles } from 'lucide-react';
import Link from 'next/link';

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
  { convenio: 'QUALLITY PRO SAUDE - ASA SUL', alta: 205, media: 0, baixa: 0 },
  { convenio: 'PARTICULAR', alta: 178, media: 0, baixa: 0 },
  { convenio: 'BRADESCO EMPRESARIAL', alta: 120, media: 0, baixa: 0 },
  { convenio: 'CASSI - ASA SUL', alta: 98, media: 0, baixa: 0 },
  { convenio: 'GDF SAUDE - ASA SUL 23', alta: 82, media: 0, baixa: 0 },
  { convenio: 'GEAP - ASA SUL 23', alta: 76, media: 0, baixa: 0 },
  { convenio: 'UNIMED CNU - DIRETO 23', alta: 72, media: 0, baixa: 0 },
  { convenio: 'ASSEFAZ - ASA NORTE', alta: 55, media: 0, baixa: 0 },
  { convenio: 'SAUDE CAIXA - AMHP 23', alta: 40, media: 0, baixa: 0 },
  { convenio: 'QUALLITY - TAGUATINGA', alta: 38, media: 0, baixa: 0 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="soft-surface relative overflow-hidden rounded-3xl p-6 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-44 w-44 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Resumo operacional
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Visao geral das conferencias e divergencias de repasse.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/conference/new">
                <GitCompare className="mr-2 h-4 w-4" />
                Nova conferencia
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <KpiCards data={mockKpi} />

      <div className="grid gap-4 lg:grid-cols-2">
        <DivergenceByTypeChart data={mockDivergenceByType} />
        <DivergenceByConvenioChart data={mockDivergenceByConvenio} />
      </div>

      <Card className="border-amber-200/60 bg-amber-50/65">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Destaque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <Badge variant="destructive">Critico</Badge>
            <div>
              <p className="text-sm font-semibold text-foreground">
                QUALLITY PRO SAUDE - 205 atendimentos sem repasse
              </p>
              <p className="text-xs text-muted-foreground">
                Estimativa de impacto: acima de R$ 15.000. Recomenda-se auditoria e contato imediato com o convenio.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
