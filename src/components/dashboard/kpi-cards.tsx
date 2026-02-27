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
      title: 'Total Produzido',
      value: formatNumber(data.totalProduction),
      subtitle: 'atendimentos',
      icon: FileCheck2,
      className: '',
    },
    {
      title: 'Total Repassado',
      value: formatBRL(data.totalRepasseValue),
      subtitle: `${formatNumber(data.totalRepasse)} registros`,
      icon: Banknote,
      className: '',
    },
    {
      title: 'Divergências',
      value: formatNumber(data.totalDivergences),
      subtitle: `${data.divergencesAlta} alta, ${data.divergencesMedia} média, ${data.divergencesBaixa} baixa`,
      icon: AlertTriangle,
      className: data.divergencesAlta > 0 ? 'border-red-200 bg-red-50/50' : '',
    },
    {
      title: 'Taxa de Conferência',
      value: formatPercent(data.matchRate),
      subtitle: 'match rate',
      icon: BarChart3,
      className:
        data.matchRate >= 90
          ? 'border-green-200 bg-green-50/50'
          : data.matchRate >= 70
            ? 'border-yellow-200 bg-yellow-50/50'
            : 'border-red-200 bg-red-50/50',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className={cn(card.className)}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
