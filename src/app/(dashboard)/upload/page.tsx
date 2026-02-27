'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseProductionExcel, type ProductionParseResult } from '@/lib/etl/parsers/production-parser';
import { parseRepasseCSV, type RepasseParseResult } from '@/lib/etl/parsers/repasse-parser';
import { formatNumber, formatDateBR } from '@/lib/utils/formatting';

type ParseStatus = 'idle' | 'parsing' | 'done' | 'error';

export default function UploadPage() {
  const [productionResult, setProductionResult] = useState<ProductionParseResult | null>(null);
  const [repasseResult, setRepasseResult] = useState<RepasseParseResult | null>(null);
  const [productionStatus, setProductionStatus] = useState<ParseStatus>('idle');
  const [repasseStatus, setRepasseStatus] = useState<ParseStatus>('idle');
  const [productionFile, setProductionFile] = useState<string>('');
  const [repasseFile, setRepasseFile] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleProductionUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProductionFile(file.name);
    setProductionStatus('parsing');
    setError('');

    try {
      const buffer = await file.arrayBuffer();
      const result = parseProductionExcel(buffer);
      setProductionResult(result);
      setProductionStatus('done');
    } catch (err) {
      setProductionStatus('error');
      setError(`Erro ao processar produção: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  }, []);

  const handleRepasseUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRepasseFile(file.name);
    setRepasseStatus('parsing');
    setError('');

    try {
      const text = await file.text();
      const result = parseRepasseCSV(text);
      setRepasseResult(result);
      setRepasseStatus('done');
    } catch (err) {
      setRepasseStatus('error');
      setError(`Erro ao processar repasse: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload de Dados</h1>
        <p className="text-sm text-muted-foreground">
          Importe planilhas de produção (Excel) e relatórios de repasse (CSV)
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Production Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Produção (iGUT)
            </CardTitle>
            <CardDescription>
              Planilha Excel (.xlsx) com dados de atendimentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-muted-foreground/50">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {productionFile || 'Clique ou arraste um arquivo .xlsx'}
              </span>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleProductionUpload}
              />
            </label>

            {productionStatus === 'parsing' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Processando...</p>
                <Progress value={50} />
              </div>
            )}

            {productionStatus === 'done' && productionResult && (
              <div className="space-y-2 rounded-md border bg-green-50 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Arquivo processado com sucesso
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Registros: <strong>{formatNumber(productionResult.records.length)}</strong></div>
                  <div>Ignorados: <strong>{formatNumber(productionResult.skippedRows)}</strong></div>
                  <div>Início: <strong>{formatDateBR(productionResult.periodStart)}</strong></div>
                  <div>Fim: <strong>{formatDateBR(productionResult.periodEnd)}</strong></div>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  <Badge variant="outline" className="text-xs">
                    {productionResult.records.filter((r) => r.generates_repasse).length} geram repasse
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {productionResult.records.filter((r) => !r.generates_repasse).length} sem repasse
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Repasse Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Repasse (Clínica)
            </CardTitle>
            <CardDescription>
              Arquivo CSV com dados do relatório de repasse
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-muted-foreground/50">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {repasseFile || 'Clique ou arraste um arquivo .csv'}
              </span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleRepasseUpload}
              />
            </label>

            {repasseStatus === 'parsing' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Processando...</p>
                <Progress value={50} />
              </div>
            )}

            {repasseStatus === 'done' && repasseResult && (
              <div className="space-y-2 rounded-md border bg-green-50 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Arquivo processado com sucesso
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Registros: <strong>{formatNumber(repasseResult.records.length)}</strong></div>
                  <div>Ignorados: <strong>{formatNumber(repasseResult.skippedRows)}</strong></div>
                  <div>Início: <strong>{repasseResult.periodStart}</strong></div>
                  <div>Fim: <strong>{repasseResult.periodEnd}</strong></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action: Run Conference */}
      {productionStatus === 'done' && repasseStatus === 'done' && (
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="font-medium">Dados prontos para conferência</p>
              <p className="text-sm text-muted-foreground">
                {formatNumber(productionResult?.records.length ?? 0)} produção ×{' '}
                {formatNumber(repasseResult?.records.length ?? 0)} repasse
              </p>
            </div>
            <Button size="lg">
              Iniciar Conferência
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
