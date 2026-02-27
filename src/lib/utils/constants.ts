import type { DivergenceType, Severity, ProcedureCategory } from '@/lib/types/database';

// MVP: hardcoded IDs for default doctor and clinic
export const DEFAULT_DOCTOR_ID = '00000000-0000-0000-0000-000000000001';
export const DEFAULT_CLINIC_ID = '00000000-0000-0000-0000-000000000001';

export const DIVERGENCE_TYPE_LABELS: Record<DivergenceType, string> = {
  PRODUZIDO_SEM_REPASSE: 'Produzido sem Repasse',
  REPASSE_SEM_PRODUCAO: 'Repasse sem Produção',
  VALOR_DIVERGENTE: 'Valor Divergente',
  PERCENTUAL_INCORRETO: 'Percentual Incorreto',
  EXAME_NAO_PAGO: 'Exame Não Pago',
  GLOSA_INESPERADA: 'Glosa Inesperada',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  ALTA: 'Alta',
  MEDIA: 'Média',
  BAIXA: 'Baixa',
};

export const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; border: string }> = {
  ALTA: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  MEDIA: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  BAIXA: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
};

export const DIVERGENCE_TYPE_COLORS: Record<DivergenceType, string> = {
  PRODUZIDO_SEM_REPASSE: '#ef4444',
  REPASSE_SEM_PRODUCAO: '#94a3b8',
  VALOR_DIVERGENTE: '#f59e0b',
  PERCENTUAL_INCORRETO: '#8b5cf6',
  EXAME_NAO_PAGO: '#ec4899',
  GLOSA_INESPERADA: '#06b6d4',
};

export const PROCEDURE_CATEGORY_LABELS: Record<ProcedureCategory, string> = {
  consulta: 'Consulta',
  cirurgia: 'Cirurgia',
  video_naso: 'Vídeo-Endoscopia Nasal',
  video_laringo: 'Vídeo-Faringo-Laringoscopia',
  video_generico: 'Vídeo (genérico)',
  fees: 'FEES',
  cerumen: 'Remoção de Cerúmen',
  corpo_estranho: 'Corpos Estranhos',
  otoneurologia: 'Otoneurologia',
  teste_alergico: 'Teste Alérgico',
  pares_cranianos: 'Pares Cranianos',
  sem_repasse: 'Sem Repasse',
  outro: 'Outro',
};
