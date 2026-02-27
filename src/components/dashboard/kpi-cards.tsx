'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCheck2, Banknote, AlertTriangle, BarChart3 } from 'lucide-react';
import { formatBRL, formatNumber, formatPercent } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils';

export interface KpiData {
  totalProduction: number;
  totalRepasse: number;
  totalRepasseValue: number;
  totalDivergences: number;
  divergencesAlta: number;
  divergencesMedia: number;
  divergencesBaixa: number;
  matchRate: number;
}

interface KpiCardsProps {
  data: KpiData;
}

export function KpiCards({ data }: KpiCardsProps) {
  const cards = [
    {
      title: 'Total produzido',
      value: formatNumber(data.totalProduction),
      subtitle: 'atendimentos',
      icon: FileCheck2,
      glow: 'bg-sky-500/20',
      iconTone: 'text-sky-700 bg-sky-100/70 border-sky-200/70',
    },
    {
      title: 'Total repassado',
      value: formatBRL(data.totalRepasseValue),
      subtitle: `${formatNumber(data.totalRepasse)} registros`,
      icon: Banknote,
      glow: 'bg-emerald-500/20',
      iconTone: 'text-emerald-700 bg-emerald-100/70 border-emerald-200/70',
    },
    {
      title: 'Divergencias',
      value: formatNumber(data.totalDivergences),
      subtitle: `${data.divergencesAlta} alta, ${data.divergencesMedia} media, ${data.divergencesBaixa} baixa`,
      icon: AlertTriangle,
      glow: 'bg-rose-500/18',
      iconTone: 'text-rose-700 bg-rose-100/70 border-rose-200/70',
      className: data.divergencesAlta > 0 ? 'border-rose-200/60' : '',
    },
    {
      title: 'Taxa de conferencia',
      value: formatPercent(data.matchRate),
      subtitle: 'match rate',
      icon: BarChart3,
      glow:
        data.matchRate >= 90 ? 'bg-emerald-500/18' : data.matchRate >= 70 ? 'bg-amber-500/20' : 'bg-rose-500/18',
      iconTone:
        data.matchRate >= 90
          ? 'text-emerald-700 bg-emerald-100/70 border-emerald-200/70'
          : data.matchRate >= 70
            ? 'text-amber-700 bg-amber-100/70 border-amber-200/70'
            : 'text-rose-700 bg-rose-100/70 border-rose-200/70',
      className:
        data.matchRate >= 90
          ? 'border-emerald-200/60'
          : data.matchRate >= 70
            ? 'border-amber-200/65'
            : 'border-rose-200/60',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          className={cn(
            'group relative overflow-hidden bg-card/85 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10',
            'animate-in fade-in-0 slide-in-from-bottom-2',
            card.className,
          )}
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <span className={cn('pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl', card.glow)} />

          <CardHeader className="relative flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {card.title}
            </CardTitle>
            <span className={cn('rounded-lg border p-2 shadow-sm', card.iconTone)}>
              <card.icon className="h-4 w-4" />
            </span>
          </CardHeader>

          <CardContent className="relative">
            <div className="mb-1 text-2xl font-bold tracking-tight text-foreground">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
