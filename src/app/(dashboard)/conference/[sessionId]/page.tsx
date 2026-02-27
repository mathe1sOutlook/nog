'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { DivergenceByTypeChart, DivergenceByConvenioChart } from '@/components/dashboard/divergence-charts';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { DivergenceTypeBadge } from '@/components/shared/divergence-type-badge';
import { formatBRL, formatDateBR } from '@/lib/utils/formatting';
import { Download, ArrowLeft } from 'lucide-react';
import type { ConferenceSession, Divergence, DivergenceType, Severity } from '@/lib/types/database';

export default function ConferenceDetailPage() {
  const params = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<ConferenceSession | null>(null);
  const [divergences, setDivergences] = useState<Divergence[]>([]);
  const [summary, setSummary] = useState<{
    typeCounts: Record<string, number>;
    severityCounts: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalDivergences, setTotalDivergences] = useState(0);

  useEffect(() => {
    async function load() {
      const [sessionRes, divRes] = await Promise.all([
        fetch(`/api/conference/${params.sessionId}`),
        fetch(`/api/conference/${params.sessionId}/divergences?limit=50`),
      ]);

      if (sessionRes.ok) {
        setSession(await sessionRes.json());
      }
      if (divRes.ok) {
        const divData = await divRes.json();
        setDivergences(divData.data);
        setTotalDivergences(divData.total);
        setSummary(divData.summary);
      }
      setLoading(false);
    }
    load();
  }, [params.sessionId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Conferência não encontrada.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/conference">Voltar</Link>
        </Button>
      </div>
    );
  }

  // Prepare chart data from summary
  const typeChartData = summary
    ? Object.entries(summary.typeCounts).map(([type, count]) => ({
        type: type as DivergenceType,
        count,
      }))
    : [];

  // Group divergences by convenio for bar chart
  const convenioMap = new Map<string, Record<string, number>>();
  for (const d of divergences) {
    const convenio = d.convenio_name || 'Sem convênio';
    if (!convenioMap.has(convenio)) {
      convenioMap.set(convenio, {});
    }
    const counts = convenioMap.get(convenio)!;
    counts[d.severity] = (counts[d.severity] || 0) + 1;
  }
  const convenioChartData = [...convenioMap.entries()]
    .map(([name, counts]) => ({
      convenio: name,
      alta: counts['ALTA'] || 0,
      media: counts['MEDIA'] || 0,
      baixa: counts['BAIXA'] || 0,
    }))
    .sort((a, b) => (b.alta + b.media + b.baixa) - (a.alta + a.media + a.baixa))
    .slice(0, 10);

  const matchRate = session.total_production_records > 0
    ? (session.total_matched / session.total_production_records * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/conference"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{session.name}</h1>
            <p className="text-sm text-muted-foreground">
              Produção: {formatDateBR(session.production_period_start)} — {formatDateBR(session.production_period_end)}
              {' | '}
              Repasse: {formatDateBR(session.repasse_period_start)} — {formatDateBR(session.repasse_period_end)}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <a href={`/api/conference/${params.sessionId}/export`} download>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </a>
        </Button>
      </div>

      {/* KPIs */}
      <KpiCards
        data={{
          totalProduction: session.total_production_records,
          totalRepasse: session.total_repasse_records,
          totalRepasseValue: session.total_valor_repassado,
          totalDivergences: session.total_divergences,
          divergencesAlta: summary?.severityCounts['ALTA'] ?? 0,
          divergencesMedia: summary?.severityCounts['MEDIA'] ?? 0,
          divergencesBaixa: summary?.severityCounts['BAIXA'] ?? 0,
          matchRate,
        }}
      />

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{session.total_matched}</div>
            <p className="text-sm text-muted-foreground">Matches encontrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{session.total_unmatched_production}</div>
            <p className="text-sm text-muted-foreground">Produção sem repasse</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatBRL(session.total_valor_bruto)}</div>
            <p className="text-sm text-muted-foreground">Valor bruto total</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {typeChartData.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <DivergenceByTypeChart data={typeChartData} />
          {convenioChartData.length > 0 && (
            <DivergenceByConvenioChart data={convenioChartData} />
          )}
        </div>
      )}

      {/* Divergence table */}
      <Card>
        <CardHeader>
          <CardTitle>Divergências ({totalDivergences})</CardTitle>
          <CardDescription>
            Mostrando {Math.min(50, divergences.length)} de {totalDivergences} divergências
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-3 font-medium">Severidade</th>
                  <th className="pb-2 pr-3 font-medium">Tipo</th>
                  <th className="pb-2 pr-3 font-medium">Data</th>
                  <th className="pb-2 pr-3 font-medium">Paciente</th>
                  <th className="pb-2 pr-3 font-medium">Convênio</th>
                  <th className="pb-2 pr-3 font-medium">Valores</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {divergences.map((d) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      <SeverityBadge severity={d.severity} />
                    </td>
                    <td className="py-2 pr-3">
                      <DivergenceTypeBadge type={d.type} />
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {formatDateBR(d.service_date)}
                    </td>
                    <td className="py-2 pr-3 max-w-[200px] truncate" title={d.patient_name ?? ''}>
                      {d.patient_name}
                    </td>
                    <td className="py-2 pr-3 max-w-[150px] truncate" title={d.convenio_name ?? ''}>
                      {d.convenio_name}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {d.valor_esperado != null && d.valor_recebido != null ? (
                        <span>
                          {formatBRL(d.valor_esperado)} → {formatBRL(d.valor_recebido)}
                          {d.diferenca != null && (
                            <span className={d.diferenca < 0 ? 'text-red-600 ml-1' : 'text-green-600 ml-1'}>
                              ({d.diferenca > 0 ? '+' : ''}{formatBRL(d.diferenca)})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2">
                      <Badge variant={d.resolution_status === 'open' ? 'destructive' : 'secondary'} className="text-xs">
                        {d.resolution_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {divergences.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Nenhuma divergência encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
