/**
 * Parse repasse CSV files.
 * Expected columns: convenio, data_atendimento, hora, paciente, procedimento_cod,
 * procedimento_desc, forma_pgt, valor, glosa_estorno, imposto_abatimento,
 * liquido, a_repassar, regra_pct
 */

import { normalizePatientName, normalizeConvenio } from '../normalizers';
import { classifyProcedure } from '../classifiers';

export interface ParsedRepasseRecord {
  service_date: string;
  service_time: string;
  patient_name: string;
  patient_name_normalized: string;
  convenio_original: string;
  convenio_normalized: string;
  tuss_code: string;
  procedure_description: string;
  category_slug: string;
  payment_form: string;
  valor_bruto: number;
  glosa: number;
  imposto: number;
  liquido: number;
  a_repassar: number;
  regra_pct: number;
}

export interface RepasseParseResult {
  records: ParsedRepasseRecord[];
  totalRows: number;
  skippedRows: number;
  periodStart: string | null;
  periodEnd: string | null;
}

function parseFloat_(val: string): number {
  if (!val || val.trim() === '') return 0;
  // Handle both "1234.56" and "1234,56"
  const cleaned = val.trim().replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseInt_(val: string): number {
  if (!val || val.trim() === '') return 0;
  const num = parseInt(val.trim(), 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse a repasse CSV string.
 */
export function parseRepasseCSV(csvText: string): RepasseParseResult {
  const lines = csvText.split('\n').filter((l) => l.trim());
  if (lines.length < 2) {
    return { records: [], totalRows: 0, skippedRows: 0, periodStart: null, periodEnd: null };
  }

  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.split(',').map((h) => h.trim().toLowerCase());

  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    colMap[h] = i;
  });

  const records: ParsedRepasseRecord[] = [];
  let totalRows = 0;
  let skippedRows = 0;
  let periodStart: string | null = null;
  let periodEnd: string | null = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parsing (no quoted commas in this data)
    const cols = line.split(',');
    totalRows++;

    const paciente = cols[colMap['paciente'] ?? 3]?.trim() ?? '';

    // Skip estornos and empty rows
    if (!paciente || paciente.toUpperCase().includes('ESTORNO')) {
      skippedRows++;
      continue;
    }

    const dateStr = cols[colMap['data_atendimento'] ?? 1]?.trim() ?? '';
    const convenio = cols[colMap['convenio'] ?? 0]?.trim() ?? '';
    const procedimentoDesc = cols[colMap['procedimento_desc'] ?? 5]?.trim() ?? '';

    // Track period
    if (dateStr) {
      if (!periodStart || dateStr < periodStart) periodStart = dateStr;
      if (!periodEnd || dateStr > periodEnd) periodEnd = dateStr;
    }

    records.push({
      service_date: dateStr,
      service_time: cols[colMap['hora'] ?? 2]?.trim() ?? '',
      patient_name: paciente,
      patient_name_normalized: normalizePatientName(paciente),
      convenio_original: convenio,
      convenio_normalized: normalizeConvenio(convenio),
      tuss_code: cols[colMap['procedimento_cod'] ?? 4]?.trim() ?? '',
      procedure_description: procedimentoDesc,
      category_slug: classifyProcedure(procedimentoDesc),
      payment_form: cols[colMap['forma_pgt'] ?? 6]?.trim() ?? '',
      valor_bruto: parseFloat_(cols[colMap['valor'] ?? 7] ?? ''),
      glosa: parseFloat_(cols[colMap['glosa_estorno'] ?? 8] ?? ''),
      imposto: parseFloat_(cols[colMap['imposto_abatimento'] ?? 9] ?? ''),
      liquido: parseFloat_(cols[colMap['liquido'] ?? 10] ?? ''),
      a_repassar: parseFloat_(cols[colMap['a_repassar'] ?? 11] ?? ''),
      regra_pct: parseInt_(cols[colMap['regra_pct'] ?? 12] ?? ''),
    });
  }

  return { records, totalRows, skippedRows, periodStart, periodEnd };
}
