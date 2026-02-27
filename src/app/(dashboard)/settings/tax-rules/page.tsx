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
import { PROCEDURE_CATEGORY_LABELS } from '@/lib/utils/constants';

const taxRules = [
  { category: 'consulta', rate: '17,03%', description: 'Consultas e procedimentos em consultório' },
  { category: 'video_naso', rate: '17,03%', description: 'Vídeo-endoscopia nasal' },
  { category: 'video_laringo', rate: '17,03%', description: 'Vídeo-faringo-laringoscopia' },
  { category: 'fees', rate: '17,03%', description: 'FEES' },
  { category: 'cerumen', rate: '17,03%', description: 'Remoção de cerúmen' },
  { category: 'otoneurologia', rate: '17,03%', description: 'Otoneurologia' },
  { category: 'cirurgia', rate: '7,93%', description: 'Cirurgias' },
];

export default function TaxRulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Regras de Impostos</h1>
        <p className="text-sm text-muted-foreground">
          Alíquotas de imposto por categoria de procedimento (configuráveis por médico/estado)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alíquotas Vigentes</CardTitle>
          <CardDescription>
            Dra. Luana Carolina Fontana — Otorrino DF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Alíquota</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxRules.map((rule) => (
                <TableRow key={rule.category}>
                  <TableCell className="font-medium">
                    {PROCEDURE_CATEGORY_LABELS[rule.category as keyof typeof PROCEDURE_CATEGORY_LABELS] ?? rule.category}
                  </TableCell>
                  <TableCell>{rule.rate}</TableCell>
                  <TableCell className="text-muted-foreground">{rule.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
