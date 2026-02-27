/**
 * Parse production Excel files from iGUT.
 * Handles the main format: columns NUMERO, DATA, NOME DO PACIENTE, PLANO, TIPO
 * starting at row 4 in the main sheet.
 */

import * as XLSX from 'xlsx';
import { normalizeDate, normalizePatientName, normalizeConvenio } from '../normalizers';
import { extractProductionProcedures, allProceduresNonBillable, isExcludedConvenio } from '../classifiers';

export interface ParsedProductionRecord {
  row_number: number | null;
  service_date: string;
  patient_name: string;
  patient_name_normalized: string;
  convenio_original: string;
  convenio_normalized: string;
  procedure_original: string;
  categories: string[];
  generates_repasse: boolean;
}

export interface ProductionParseResult {
  records: ParsedProductionRecord[];
  totalRows: number;
  skippedRows: number;
  periodStart: string | null;
  periodEnd: string | null;
}

/**
 * Parse a production Excel file buffer.
 */
export function parseProductionExcel(buffer: ArrayBuffer): ProductionParseResult {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  // Try known sheet names, fallback to first sheet
  const sheetNames = workbook.SheetNames;
  const targetSheet =
    sheetNames.find((n) => n.includes('TODOS')) ||
    sheetNames[0];

  const worksheet = workbook.Sheets[targetSheet];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
  }) as unknown as unknown[][];

  const records: ParsedProductionRecord[] = [];
  let totalRows = 0;
  let skippedRows = 0;
  let periodStart: string | null = null;
  let periodEnd: string | null = null;

  // Find header row (look for PACIENTE or NOME)
  let headerRow = -1;
  let colIndices = { numero: 0, data: 1, paciente: 2, plano: 3, tipo: 4 };

  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i];
    if (!row) continue;
    const headers = row.map((c) => String(c ?? '').toUpperCase().trim());

    const pacienteIdx = headers.findIndex(
      (h) => h.includes('PACIENTE') || h.includes('NOME'),
    );
    if (pacienteIdx >= 0) {
      headerRow = i;
      const dataIdx = headers.findIndex((h) => h === 'DATA' || h.includes('DATA'));
      const planoIdx = headers.findIndex(
        (h) => h.includes('PLANO') || h.includes('CONVENIO'),
      );
      const tipoIdx = headers.findIndex((h) => h === 'TIPO' || h.includes('TIPO'));
      const numIdx = headers.findIndex((h) => h === 'NUMERO' || h === 'NUM' || h === '#');

      colIndices = {
        numero: numIdx >= 0 ? numIdx : 0,
        data: dataIdx >= 0 ? dataIdx : 1,
        paciente: pacienteIdx,
        plano: planoIdx >= 0 ? planoIdx : 3,
        tipo: tipoIdx >= 0 ? tipoIdx : 4,
      };
      break;
    }
  }

  // If no header found, use defaults (skip first 3 rows as in etl_conferencia.py)
  const startRow = headerRow >= 0 ? headerRow + 1 : 3;

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const paciente = row[colIndices.paciente];
    const data = row[colIndices.data];
    if (!paciente || !data) {
      skippedRows++;
      continue;
    }

    totalRows++;
    const dateStr = normalizeDate(data as string | Date | number);
    const patientName = String(paciente).trim();
    const patientNormalized = normalizePatientName(patientName);
    const plano = String(row[colIndices.plano] ?? '').trim();
    const convenioNormalized = normalizeConvenio(plano);
    const tipo = String(row[colIndices.tipo] ?? '').trim();
    const categories = extractProductionProcedures(tipo);
    const numero = row[colIndices.numero];

    // Track period
    if (dateStr) {
      if (!periodStart || dateStr < periodStart) periodStart = dateStr;
      if (!periodEnd || dateStr > periodEnd) periodEnd = dateStr;
    }

    // Check if generates repasse
    const excluded = isExcludedConvenio(plano);
    const nonBillable = allProceduresNonBillable(categories);

    records.push({
      row_number: numero ? Number(numero) : null,
      service_date: dateStr,
      patient_name: patientName,
      patient_name_normalized: patientNormalized,
      convenio_original: plano,
      convenio_normalized: convenioNormalized,
      procedure_original: tipo,
      categories,
      generates_repasse: !excluded && !nonBillable,
    });
  }

  return {
    records,
    totalRows,
    skippedRows,
    periodStart,
    periodEnd,
  };
}
