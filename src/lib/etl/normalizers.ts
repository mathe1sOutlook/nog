/**
 * Text normalization functions for matching production × repasse data.
 * Ported from etl_conferencia.py lines 28-83.
 */

/**
 * Remove accents, convert to uppercase, collapse whitespace.
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  let result = String(text).trim();

  // Remove accents via NFD decomposition
  result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Uppercase + collapse whitespace
  result = result.toUpperCase().trim();
  result = result.replace(/\s+/g, ' ');

  // Remove non-breaking spaces
  result = result.replace(/\u00A0/g, ' ').trim();

  return result;
}

/**
 * Normalize patient name for matching.
 * Removes titles (DR., DRA., SR., SRA.) after base normalization.
 */
export function normalizePatientName(name: string | null | undefined): string {
  let result = normalizeText(name);
  // Remove titles
  result = result.replace(/^(DR\.|DRA\.|SR\.|SRA\.)\s*/g, '');
  return result;
}

/**
 * Normalize convênio name for matching.
 * Removes leading pipes, hospital suffixes, and (INATIVO) markers.
 */
export function normalizeConvenio(name: string | null | undefined): string {
  let result = normalizeText(name);
  // Remove pipe at start (present in some iGUT names)
  result = result.replace(/^\|\s*/, '');
  // Remove hospital suffixes
  result = result.replace(/\s*-\s*HOSPITAL\s+.*$/, '');
  // Remove (INATIVO)
  result = result.replace(/\s*\(INATIVO\)\s*/, '');
  return result.trim();
}

/**
 * Normalize date values from various formats to YYYY-MM-DD string.
 * Handles: Date objects, YYYY-MM-DD, DD/MM/YYYY, DD/MM/YYYY - HH:MM:SS
 */
export function normalizeDate(dateVal: Date | string | number | null | undefined): string {
  if (!dateVal) return '';

  // Date object
  if (dateVal instanceof Date) {
    const y = dateVal.getFullYear();
    const m = String(dateVal.getMonth() + 1).padStart(2, '0');
    const d = String(dateVal.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Excel serial number (days since 1900-01-01)
  if (typeof dateVal === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + dateVal * 86400000);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(dateVal).trim();

  // Already YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0];

  // DD/MM/YYYY or DD/MM/YYYY - HH:MM:SS
  const brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;

  return str;
}

/**
 * Create a matching key from patient name, date, and convênio.
 * Used for exact matching between production and repasse records.
 */
export function createMatchingKey(
  patient: string,
  date: string,
  convenio: string,
): string {
  return `${patient}|${date}|${convenio}`;
}

/**
 * Fuzzy patient name matching.
 * Requires at least 2 common words and >= 60% word overlap.
 * Ported from etl_conferencia.py lines 252-265.
 */
export function fuzzyMatchPatientName(name1: string, name2: string): boolean {
  if (name1 === name2) return true;

  const words1 = new Set(name1.split(' ').filter(Boolean));
  const words2 = new Set(name2.split(' ').filter(Boolean));

  // Count common words
  const common = new Set([...words1].filter((w) => words2.has(w)));

  if (common.size >= 2) {
    const total = Math.max(words1.size, words2.size);
    if (common.size / total >= 0.6) return true;
  }

  return false;
}
