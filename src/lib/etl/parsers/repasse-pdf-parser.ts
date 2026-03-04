/**
 * Parse repasse PDF files from BSB Otorrino.
 *
 * The PDF text (extracted by pdf-parse v2) uses tab-delimited values,
 * but the format varies by month:
 *  - Some months: tabs between all columns
 *  - Other months: tabs only before R$ values, text columns run together
 *
 * Strategy: extract the 4 numeric values (Produzido, Imposto, Líquido, Repasse)
 * from the end of each line, then parse the text portion (date, patient, type,
 * convenio, doctor) from the beginning.
 */

import { normalizePatientName, normalizeConvenio, normalizeDate } from '../normalizers';
import { classifyProcedure } from '../classifiers';
import type { ParsedRepasseRecord, RepasseParseResult } from './repasse-parser';

// Known doctors — used to split convenio from doctor name
const KNOWN_DOCTORS = [
  'LUANA CAROLINA FONTANA',
  'FLAVIA DA GAMA FONSECA SANTOS',
];

// Doctor to filter out (not the target doctor)
const FILTER_DOCTOR = 'FLAVIA';

// Known procedure types — used to split patient name from type
const KNOWN_TYPES = [
  'VIDEO ENDOSCOPIA DO ESFINCTER',
  'VIDEO ENDOSCOPIA',
  'VIDEO LARINGO',
  'VIDEO NASO',
  'REMOÇÃO DE CERUME',
  'AUDIOMETRIA',
  'Telemedicina',
  'Consulta',
  'Otorrino',
  'EXAMES DE VIDEO',
  'CORTESIA',
];

// Sort by length descending so longer types match first
const TYPES_SORTED = [...KNOWN_TYPES].sort((a, b) => b.length - a.length);

/**
 * Parse Brazilian currency: "1.234,56" → 1234.56
 */
function parseBR(val: string): number {
  const cleaned = val.replace(/\./g, '').replace(',', '.').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/**
 * Strip trailing numeric suffix from convenio name.
 * "GEAP - 86" → "GEAP"
 * "PORTO SEGUROS - DIRETO - 64" → "PORTO SEGUROS - DIRETO"
 * "QUALLITY PRÓ SAÚDE - 14" → "QUALLITY PRÓ SAÚDE"
 * "CBMDF - 49" → "CBMDF"
 * "CBMDF -" → "CBMDF"
 */
function stripConvenioSuffix(raw: string): string {
  return raw
    .replace(/\s*-\s*\d+\s*$/, '')  // "- 64" at end
    .replace(/\s*-\s*$/, '')         // trailing "- " with no number
    .trim();
}

/**
 * Split the text portion of a line into: patient, type, convenio, doctor
 *
 * The text comes in one of these formats:
 * 1. Tabbed: "PATIENT \tTYPE \tCONVENIO \tDOCTOR"
 * 2. Non-tabbed: "PATIENT TYPE CONVENIO DOCTOR" (fields run together)
 * 3. Merged: "PATIENT TYPEconvenioDoctor" (no separator at all for some combos)
 */
function parseTextPortion(text: string): {
  patient: string;
  tipo: string;
  convenio: string;
  doctor: string;
} {
  // Strategy 1: If tabs exist, split by tabs
  const parts = text.split('\t').map((s) => s.trim()).filter(Boolean);

  if (parts.length >= 4) {
    return {
      patient: parts[0],
      tipo: parts[1],
      convenio: stripConvenioSuffix(parts[2]),
      doctor: parts[3],
    };
  }

  // Strategy 2: No tabs or not enough tabs — use known patterns
  // First, find and extract the doctor name from the end
  let doctor = '';
  let remaining = text;
  for (const d of KNOWN_DOCTORS) {
    const idx = remaining.lastIndexOf(d);
    if (idx !== -1) {
      doctor = d;
      remaining = remaining.substring(0, idx).trim();
      break;
    }
  }

  // Now remaining = "PATIENT TYPE CONVENIO" (possibly merged)
  // Find the procedure type
  let tipo = '';
  let patient = '';
  let convenio = '';

  const remainingUpper = remaining.toUpperCase();

  for (const t of TYPES_SORTED) {
    const tUpper = t.toUpperCase();
    const idx = remainingUpper.indexOf(tUpper);
    if (idx !== -1) {
      patient = remaining.substring(0, idx).trim();
      const afterType = remaining.substring(idx + t.length).trim();
      tipo = t;
      convenio = stripConvenioSuffix(afterType);
      break;
    }
  }

  // If no type found, try to use the tab-split parts we have
  if (!tipo && parts.length >= 2) {
    patient = parts[0];
    tipo = parts.length >= 2 ? parts[1] : '';
    convenio = stripConvenioSuffix(parts.length >= 3 ? parts[2] : '');
  }

  // Fallback: couldn't parse — put everything as patient
  if (!patient && !tipo) {
    patient = remaining;
  }

  return { patient, tipo, convenio, doctor };
}

/**
 * Parse the full text from a BSB Otorrino repasse PDF.
 */
export function parseRepassePDF(text: string): RepasseParseResult {
  const lines = text.split('\n');
  const records: ParsedRepasseRecord[] = [];
  let totalRows = 0;
  let skippedRows = 0;
  let periodStart: string | null = null;
  let periodEnd: string | null = null;

  // Date pattern: DD/MM/YYYY or D/MM/YYYY at start of line
  const datePattern = /^(\d{1,2}\/\d{2}\/\d{4})\s+/;

  // Value pattern: extract 4 groups of "NUMBER\tR$" from the end of a line
  // Each value appears as "123,45\tR$" or "123,45	R$"
  const valuesPattern = /([\d.,]+)\tR\$\s*([\d.,]+)\tR\$\s*([\d.,]+)\tR\$\s*([\d.,]+)\tR\$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Must start with a date
    const dateMatch = trimmed.match(datePattern);
    if (!dateMatch) continue;

    // Must contain R$ values
    const valMatch = trimmed.match(valuesPattern);
    if (!valMatch) continue;

    totalRows++;

    const rawDate = dateMatch[1];
    const valorProduzido = parseBR(valMatch[1]);
    const imposto = parseBR(valMatch[2]);
    const liquido = parseBR(valMatch[3]);
    const repasse = parseBR(valMatch[4]);

    // Extract the text portion between date and first value
    const textStart = dateMatch[0].length;
    const textEnd = trimmed.indexOf(valMatch[1]);
    const textPortion = trimmed.substring(textStart, textEnd).trim();

    const { patient, tipo, convenio, doctor } = parseTextPortion(textPortion);

    // Filter: skip entries from other doctors
    if (doctor.toUpperCase().includes(FILTER_DOCTOR)) {
      skippedRows++;
      continue;
    }

    // Filter: skip CORTESIA (zero-value entries)
    if (tipo.toUpperCase().includes('CORTESIA') || (valorProduzido === 0 && repasse === 0)) {
      skippedRows++;
      continue;
    }

    // Normalize date
    const serviceDate = normalizeDate(rawDate);
    if (serviceDate) {
      if (!periodStart || serviceDate < periodStart) periodStart = serviceDate;
      if (!periodEnd || serviceDate > periodEnd) periodEnd = serviceDate;
    }

    records.push({
      service_date: serviceDate,
      service_time: '',
      patient_name: patient,
      patient_name_normalized: normalizePatientName(patient),
      convenio_original: convenio,
      convenio_normalized: normalizeConvenio(convenio),
      tuss_code: '',
      procedure_description: tipo,
      category_slug: classifyProcedure(tipo),
      payment_form: '',
      valor_bruto: valorProduzido,
      glosa: 0,
      imposto,
      liquido,
      a_repassar: repasse,
      regra_pct: 80,
    });
  }

  return { records, totalRows, skippedRows, periodStart, periodEnd };
}
