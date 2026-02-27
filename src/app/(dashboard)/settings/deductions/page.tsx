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
import { formatBRL } from '@/lib/utils/formatting';

const deductions = [
  { type: 'PRO LABORE', amount: 375.72, description: 'Retirada mensal fixa (PJ)' },
  { type: 'TAXA ADM', amount: 300.00, description: 'Taxa administrativa da clínica' },
];

export default function DeductionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deduções Mensais</h1>
        <p className="text-sm text-muted-foreground">
          Valores fixos descontados mensalmente do repasse
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deduções Vigentes</CardTitle>
          <CardDescription>
            Total mensal: {formatBRL(deductions.reduce((sum, d) => sum + d.amount, 0))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deductions.map((d) => (
                <TableRow key={d.type}>
                  <TableCell className="font-medium">{d.type}</TableCell>
                  <TableCell>{formatBRL(d.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{d.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
