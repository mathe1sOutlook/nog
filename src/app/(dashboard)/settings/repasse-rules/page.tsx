'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const repasseRules = [
  { category: 'Consultas simples (consultório/PS)', pct: '70%' },
  { category: 'Exames (vídeo-endoscopia, FEES)', pct: '50%' },
  { category: 'Cirurgias (Hospital Santa Luzia)', pct: '75%' },
  { category: 'Otoneurologia PARTICULAR', pct: '70%' },
  { category: 'GEAP — Consultas PS', pct: '50%' },
  { category: 'GEAP — Otoneurologia', pct: '60%' },
  { category: 'STJ — Vídeos', pct: '60%' },
];

export default function RepasseRulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Regras de Repasse</h1>
        <p className="text-sm text-muted-foreground">
          Percentuais de repasse por convênio e tipo de procedimento
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Padrão Observado</CardTitle>
          <CardDescription>
            Baseado na análise do relatório de repasse Jan/2026
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria / Convênio</TableHead>
                <TableHead>Percentual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repasseRules.map((rule) => (
                <TableRow key={rule.category}>
                  <TableCell className="font-medium">{rule.category}</TableCell>
                  <TableCell>{rule.pct}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
