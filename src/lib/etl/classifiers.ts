/**
 * Procedure classification functions.
 * Ported from etl_conferencia.py lines 86-159.
 */

import { normalizeText } from './normalizers';
import type { ProcedureCategory } from '@/lib/types/database';

const SURGERY_KEYWORDS = [
  'ADENOIDECTOMIA', 'AMIGDALECTOMIA', 'TURBINECTOMIA',
  'TURBINOPLASTIA', 'FRENECTOMIA', 'SEPTOPLASTIA',
  'SINUSOTOMIA', 'OTOPLASTIA', 'TIMPANOPLASTIA',
  'MICROCIRURGIA', 'TUBO DE VENTILACAO',
];

/**
 * Classify a single procedure text into a category.
 */
export function classifyProcedure(procedureText: string): ProcedureCategory {
  const text = normalizeText(procedureText);
  if (!text) return 'outro';

  // No repasse: returns and losses
  if (text === 'RETORNO' || text === 'PERDA' || text.includes('CORTESIA')) {
    return 'sem_repasse';
  }

  // Surgeries
  for (const keyword of SURGERY_KEYWORDS) {
    if (text.includes(keyword)) return 'cirurgia';
  }

  // FEES (swallowing evaluation)
  if (text.includes('DEGLUTICAO') || text.includes('FEES') || text.includes('AVALIACAO ENDOSCOPICA')) {
    return 'fees';
  }

  // Video endoscopy
  if (text.includes('VIDEO') || text.includes('ENDOSCOPIA') || text.includes('LARINGO')) {
    if (text.includes('NASO') || text.includes('SINUSAL')) return 'video_naso';
    if (text.includes('FARINGO') || text.includes('LARINGO')) return 'video_laringo';
    return 'video_generico';
  }

  // Cerumen removal
  if (text.includes('CERUMEN') || text.includes('CERUME') || text.includes('REMOCAO DE CERUME')) {
    return 'cerumen';
  }

  // Foreign bodies / biopsies
  if (text.includes('CORPOS ESTRANHOS') || text.includes('BIOPSIA')) {
    return 'corpo_estranho';
  }

  // Otoneurology
  if (text.includes('OTONEUROLOGIA')) {
    return 'otoneurologia';
  }

  // Allergy tests
  if (text.includes('PRICK') || text.includes('TESTE') || text.includes('ALERGICO')) {
    return 'teste_alergico';
  }

  // Cranial nerves
  if (text.includes('PARES CRANIANOS')) {
    return 'pares_cranianos';
  }

  // Consultation (check last — most generic)
  if (
    text.includes('CONSULTA') ||
    text.includes('PRONTO SOCORRO') ||
    text.includes('PRONTO ATENDIMENTO') ||
    text.includes('CONSULTORIO') ||
    text.includes('TELEMEDICINA')
  ) {
    return 'consulta';
  }

  return 'outro';
}

/**
 * Extract procedure categories from a pipe-separated production TIPO field.
 * Production data uses " | " to separate multiple procedures in a single visit.
 * Ported from etl_conferencia.py lines 144-159.
 */
export function extractProductionProcedures(tipoText: string | null | undefined): ProcedureCategory[] {
  if (!tipoText) return [];

  const parts = String(tipoText).split('|');
  const categories: ProcedureCategory[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed && trimmed !== '-TIPO-') {
      const cat = classifyProcedure(trimmed);
      categories.push(cat);
    }
  }

  return categories.length > 0 ? categories : ['outro'];
}

/**
 * Check if all procedures in a production record are non-billable.
 */
export function allProceduresNonBillable(categories: ProcedureCategory[]): boolean {
  return categories.length > 0 && categories.every((c) => c === 'sem_repasse');
}

/**
 * Check if a convênio name indicates it should be excluded from matching.
 */
export function isExcludedConvenio(convenio: string): boolean {
  const normalized = normalizeText(convenio);
  return normalized === 'CORTESIA' || normalized === '' || normalized.includes('(INATIVO)');
}
