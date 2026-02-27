// Database types for Nog system
// These mirror the Supabase PostgreSQL schema

export type DivergenceType =
  | 'PRODUZIDO_SEM_REPASSE'
  | 'REPASSE_SEM_PRODUCAO'
  | 'VALOR_DIVERGENTE'
  | 'PERCENTUAL_INCORRETO'
  | 'EXAME_NAO_PAGO'
  | 'GLOSA_INESPERADA';

export type Severity = 'ALTA' | 'MEDIA' | 'BAIXA';

export type ResolutionStatus = 'open' | 'acknowledged' | 'disputed' | 'resolved';

export type MatchType = 'exact' | 'fuzzy_name' | 'fuzzy_convenio' | 'cross_month' | 'manual';

export type UploadStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type SessionStatus = 'pending' | 'matching' | 'completed' | 'failed';

export type ProcedureCategory =
  | 'consulta' | 'cirurgia' | 'video_naso' | 'video_laringo' | 'video_generico'
  | 'fees' | 'cerumen' | 'corpo_estranho' | 'otoneurologia' | 'teste_alergico'
  | 'pares_cranianos' | 'sem_repasse' | 'outro';

export interface Doctor {
  id: string;
  full_name: string;
  email: string | null;
  crm: string | null;
  specialty: string | null;
  created_at: string;
  updated_at: string;
}

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  igut_subdomain: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Convenio {
  id: string;
  name: string;
  normalized_name: string;
  category: 'direto' | 'associacao' | null;
  association: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Upload {
  id: string;
  doctor_id: string;
  clinic_id: string;
  file_type: 'production' | 'repasse';
  file_name: string;
  file_size_bytes: number | null;
  storage_path: string | null;
  status: UploadStatus;
  period_start: string | null;
  period_end: string | null;
  records_parsed: number;
  records_imported: number;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface ConferenceSession {
  id: string;
  doctor_id: string;
  clinic_id: string;
  name: string | null;
  status: SessionStatus;
  production_upload_id: string | null;
  repasse_upload_id: string | null;
  production_period_start: string | null;
  production_period_end: string | null;
  repasse_period_start: string | null;
  repasse_period_end: string | null;
  total_production_records: number;
  total_repasse_records: number;
  total_matched: number;
  total_unmatched_production: number;
  total_unmatched_repasse: number;
  total_divergences: number;
  total_valor_bruto: number;
  total_valor_repassado: number;
  total_valor_divergente: number;
  created_at: string;
  completed_at: string | null;
}

export interface ProductionRecord {
  id: string;
  upload_id: string;
  doctor_id: string;
  clinic_id: string;
  row_number: number | null;
  service_date: string;
  patient_name: string;
  patient_name_normalized: string;
  convenio_original: string | null;
  convenio_id: string | null;
  procedure_original: string | null;
  attendance_status: string | null;
  generates_repasse: boolean;
  match_status: 'unmatched' | 'matched' | 'partial_match';
  created_at: string;
}

export interface ProductionProcedure {
  id: string;
  production_record_id: string;
  procedure_text: string;
  procedure_normalized: string;
  category_id: string | null;
  category_slug: ProcedureCategory | null;
  matched: boolean;
}

export interface RepasseRecord {
  id: string;
  upload_id: string;
  doctor_id: string;
  clinic_id: string;
  service_date: string;
  service_time: string | null;
  patient_name: string;
  patient_name_normalized: string;
  convenio_original: string | null;
  convenio_id: string | null;
  tuss_code: string | null;
  procedure_description: string | null;
  category_id: string | null;
  category_slug: ProcedureCategory | null;
  payment_form: string | null;
  valor_bruto: number;
  glosa: number;
  imposto: number;
  liquido: number;
  a_repassar: number;
  regra_pct: number;
  match_status: 'unmatched' | 'matched';
  created_at: string;
}

export interface Divergence {
  id: string;
  session_id: string;
  type: DivergenceType;
  severity: Severity;
  service_date: string | null;
  patient_name: string | null;
  convenio_name: string | null;
  convenio_id: string | null;
  production_record_id: string | null;
  repasse_record_id: string | null;
  valor_esperado: number | null;
  valor_recebido: number | null;
  diferenca: number | null;
  procedure_production: string | null;
  procedure_repasse: string | null;
  detail: string;
  resolution_status: ResolutionStatus;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface TaxConfig {
  id: string;
  doctor_id: string | null;
  clinic_id: string | null;
  procedure_category: string;
  tax_rate: number;
  description: string | null;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
}

export interface RepasseRule {
  id: string;
  clinic_id: string | null;
  convenio_id: string | null;
  category_id: string | null;
  repasse_pct: number;
  effective_from: string;
  effective_to: string | null;
  notes: string | null;
  created_at: string;
}
