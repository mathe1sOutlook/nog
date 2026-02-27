/**
 * Core matching engine for production × repasse cross-referencing.
 * Ported from etl_conferencia.py lines 247-327.
 */

import {
  createMatchingKey,
  fuzzyMatchPatientName,
  normalizeConvenio,
} from '../normalizers';
import type { MatchType } from '@/lib/types/database';

export interface ProductionEntry {
  id: string;
  patient_name_normalized: string;
  service_date: string;
  convenio_normalized: string;
  convenio_original: string;
  procedure_original: string;
  categories: string[];
}

export interface RepasseEntry {
  id: string;
  patient_name_normalized: string;
  service_date: string;
  convenio_normalized: string;
  convenio_original: string;
  tuss_code: string;
  procedure_description: string;
  valor_bruto: number;
  glosa: number;
  imposto: number;
  liquido: number;
  a_repassar: number;
  regra_pct: number;
}

export interface MatchResult {
  production_id: string;
  repasse_id: string;
  match_type: MatchType;
  confidence: number;
}

export interface MatchingOutput {
  matches: MatchResult[];
  unmatchedProduction: string[];
  unmatchedRepasse: string[];
}

/**
 * Run the matching algorithm across production and repasse datasets.
 *
 * Strategy order:
 * 1. Exact key match (patient + date + convenio)
 * 2. Fuzzy patient name match (same date + convenio, similar name)
 * 3. Fuzzy convênio match (same patient + date, different convenio spelling)
 */
export function runMatching(
  production: ProductionEntry[],
  repasse: RepasseEntry[],
): MatchingOutput {
  const matches: MatchResult[] = [];
  const usedRepasseIds = new Set<string>();
  const matchedProductionIds = new Set<string>();

  // Index repasse by key for O(1) lookup
  const repasseByKey = new Map<string, RepasseEntry[]>();
  for (const r of repasse) {
    const key = createMatchingKey(r.patient_name_normalized, r.service_date, r.convenio_normalized);
    const existing = repasseByKey.get(key) || [];
    existing.push(r);
    repasseByKey.set(key, existing);
  }

  // Also index repasse by (date, convenio) for fuzzy name matching
  const repasseByDateConvenio = new Map<string, RepasseEntry[]>();
  for (const r of repasse) {
    const key = `${r.service_date}|${r.convenio_normalized}`;
    const existing = repasseByDateConvenio.get(key) || [];
    existing.push(r);
    repasseByDateConvenio.set(key, existing);
  }

  // Also index repasse by (date, patient) for fuzzy convenio matching
  const repasseByDatePatient = new Map<string, RepasseEntry[]>();
  for (const r of repasse) {
    const key = `${r.service_date}|${r.patient_name_normalized}`;
    const existing = repasseByDatePatient.get(key) || [];
    existing.push(r);
    repasseByDatePatient.set(key, existing);
  }

  for (const p of production) {
    // Strategy 1: Exact match
    const exactKey = createMatchingKey(p.patient_name_normalized, p.service_date, p.convenio_normalized);
    const exactMatches = repasseByKey.get(exactKey);
    if (exactMatches) {
      const available = exactMatches.filter((r) => !usedRepasseIds.has(r.id));
      if (available.length > 0) {
        for (const r of available) {
          matches.push({
            production_id: p.id,
            repasse_id: r.id,
            match_type: 'exact',
            confidence: 1.0,
          });
          usedRepasseIds.add(r.id);
        }
        matchedProductionIds.add(p.id);
        continue;
      }
    }

    // Strategy 2: Fuzzy patient name (same date + convenio)
    const dateConvenioKey = `${p.service_date}|${p.convenio_normalized}`;
    const candidates = repasseByDateConvenio.get(dateConvenioKey);
    if (candidates) {
      let found = false;
      for (const r of candidates) {
        if (usedRepasseIds.has(r.id)) continue;
        if (fuzzyMatchPatientName(p.patient_name_normalized, r.patient_name_normalized)) {
          matches.push({
            production_id: p.id,
            repasse_id: r.id,
            match_type: 'fuzzy_name',
            confidence: 0.8,
          });
          usedRepasseIds.add(r.id);
          matchedProductionIds.add(p.id);
          found = true;
          break;
        }
      }
      if (found) continue;
    }

    // Strategy 3: Fuzzy convenio (same date + patient)
    const datePatientKey = `${p.service_date}|${p.patient_name_normalized}`;
    const convenioCandidates = repasseByDatePatient.get(datePatientKey);
    if (convenioCandidates) {
      const available = convenioCandidates.filter((r) => !usedRepasseIds.has(r.id));
      if (available.length > 0) {
        // Match first available — same patient, same date, different convenio spelling
        const r = available[0];
        matches.push({
          production_id: p.id,
          repasse_id: r.id,
          match_type: 'fuzzy_convenio',
          confidence: 0.6,
        });
        usedRepasseIds.add(r.id);
        matchedProductionIds.add(p.id);
        continue;
      }
    }
  }

  // Collect unmatched
  const unmatchedProduction = production
    .filter((p) => !matchedProductionIds.has(p.id))
    .map((p) => p.id);

  const unmatchedRepasse = repasse
    .filter((r) => !usedRepasseIds.has(r.id))
    .map((r) => r.id);

  return { matches, unmatchedProduction, unmatchedRepasse };
}
