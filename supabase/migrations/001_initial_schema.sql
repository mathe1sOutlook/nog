-- Nog: Sistema de Conferência de Repasses Médicos
-- Initial database schema — all tables prefixed NOG_

-- ============================================================
-- 1. REFERENCE TABLES
-- ============================================================

CREATE TABLE NOG_doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  crm TEXT,
  specialty TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE NOG_clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  igut_subdomain TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE NOG_doctor_clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES NOG_doctors(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES NOG_clinics(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  joined_at DATE,
  UNIQUE(doctor_id, clinic_id)
);

CREATE TABLE NOG_convenios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('direto', 'associacao')),
  association TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_nog_convenios_normalized ON NOG_convenios(normalized_name);

CREATE TABLE NOG_convenio_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convenio_id UUID NOT NULL REFERENCES NOG_convenios(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  source TEXT CHECK (source IN ('igut_production', 'igut_repasse')),
  UNIQUE(convenio_id, normalized_alias)
);
CREATE INDEX idx_nog_convenio_aliases_normalized ON NOG_convenio_aliases(normalized_alias);

CREATE TABLE NOG_procedure_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  generates_repasse BOOLEAN DEFAULT true,
  default_repasse_pct NUMERIC(5,2)
);

CREATE TABLE NOG_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tuss_code TEXT,
  description TEXT NOT NULL,
  category_id UUID REFERENCES NOG_procedure_categories(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_nog_procedures_tuss ON NOG_procedures(tuss_code);

CREATE TABLE NOG_procedure_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID REFERENCES NOG_procedures(id),
  category_id UUID REFERENCES NOG_procedure_categories(id),
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  source TEXT CHECK (source IN ('igut_production', 'igut_repasse'))
);
CREATE INDEX idx_nog_procedure_aliases_normalized ON NOG_procedure_aliases(normalized_alias);

-- ============================================================
-- 2. CONFIGURATION TABLES (Business Rules)
-- ============================================================

CREATE TABLE NOG_tax_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES NOG_doctors(id),
  clinic_id UUID REFERENCES NOG_clinics(id),
  procedure_category TEXT NOT NULL,
  tax_rate NUMERIC(6,4) NOT NULL,
  description TEXT,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE NOG_repasse_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES NOG_clinics(id),
  convenio_id UUID REFERENCES NOG_convenios(id),
  category_id UUID REFERENCES NOG_procedure_categories(id),
  repasse_pct NUMERIC(5,2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_nog_repasse_rules_lookup ON NOG_repasse_rules(clinic_id, convenio_id, category_id);

CREATE TABLE NOG_monthly_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES NOG_doctors(id),
  clinic_id UUID NOT NULL REFERENCES NOG_clinics(id),
  deduction_type TEXT NOT NULL CHECK (deduction_type IN ('PRO_LABORE', 'TAXA_ADM', 'OUTRO')),
  amount NUMERIC(10,2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. UPLOAD & PROCESSING TABLES
-- ============================================================

CREATE TABLE NOG_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES NOG_doctors(id),
  clinic_id UUID NOT NULL REFERENCES NOG_clinics(id),
  file_type TEXT NOT NULL CHECK (file_type IN ('production', 'repasse')),
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  period_start DATE,
  period_end DATE,
  records_parsed INTEGER DEFAULT 0,
  records_imported INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE NOG_conference_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES NOG_doctors(id),
  clinic_id UUID NOT NULL REFERENCES NOG_clinics(id),
  name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matching', 'completed', 'failed')),
  production_upload_id UUID REFERENCES NOG_uploads(id),
  repasse_upload_id UUID REFERENCES NOG_uploads(id),
  production_period_start DATE,
  production_period_end DATE,
  repasse_period_start DATE,
  repasse_period_end DATE,
  -- Denormalized KPIs
  total_production_records INTEGER DEFAULT 0,
  total_repasse_records INTEGER DEFAULT 0,
  total_matched INTEGER DEFAULT 0,
  total_unmatched_production INTEGER DEFAULT 0,
  total_unmatched_repasse INTEGER DEFAULT 0,
  total_divergences INTEGER DEFAULT 0,
  total_valor_bruto NUMERIC(12,2) DEFAULT 0,
  total_valor_repassado NUMERIC(12,2) DEFAULT 0,
  total_valor_divergente NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- 4. DATA RECORDS
-- ============================================================

CREATE TABLE NOG_production_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES NOG_uploads(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES NOG_doctors(id),
  clinic_id UUID NOT NULL REFERENCES NOG_clinics(id),
  row_number INTEGER,
  service_date DATE NOT NULL,
  patient_name TEXT NOT NULL,
  patient_name_normalized TEXT NOT NULL,
  convenio_original TEXT,
  convenio_id UUID REFERENCES NOG_convenios(id),
  procedure_original TEXT,
  attendance_status TEXT,
  generates_repasse BOOLEAN DEFAULT true,
  match_status TEXT DEFAULT 'unmatched' CHECK (match_status IN ('unmatched', 'matched', 'partial_match')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_nog_production_date ON NOG_production_records(service_date);
CREATE INDEX idx_nog_production_patient ON NOG_production_records(patient_name_normalized);
CREATE INDEX idx_nog_production_matching ON NOG_production_records(patient_name_normalized, service_date, convenio_id);

CREATE TABLE NOG_production_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_record_id UUID NOT NULL REFERENCES NOG_production_records(id) ON DELETE CASCADE,
  procedure_text TEXT NOT NULL,
  procedure_normalized TEXT NOT NULL,
  category_id UUID REFERENCES NOG_procedure_categories(id),
  category_slug TEXT,
  matched BOOLEAN DEFAULT false
);

CREATE TABLE NOG_repasse_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES NOG_uploads(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES NOG_doctors(id),
  clinic_id UUID NOT NULL REFERENCES NOG_clinics(id),
  service_date DATE NOT NULL,
  service_time TIME,
  patient_name TEXT NOT NULL,
  patient_name_normalized TEXT NOT NULL,
  convenio_original TEXT,
  convenio_id UUID REFERENCES NOG_convenios(id),
  tuss_code TEXT,
  procedure_description TEXT,
  category_id UUID REFERENCES NOG_procedure_categories(id),
  category_slug TEXT,
  payment_form TEXT,
  valor_bruto NUMERIC(10,2) NOT NULL DEFAULT 0,
  glosa NUMERIC(10,2) DEFAULT 0,
  imposto NUMERIC(10,2) DEFAULT 0,
  liquido NUMERIC(10,2) DEFAULT 0,
  a_repassar NUMERIC(10,2) DEFAULT 0,
  regra_pct INTEGER DEFAULT 0,
  match_status TEXT DEFAULT 'unmatched' CHECK (match_status IN ('unmatched', 'matched')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_nog_repasse_date ON NOG_repasse_records(service_date);
CREATE INDEX idx_nog_repasse_patient ON NOG_repasse_records(patient_name_normalized);
CREATE INDEX idx_nog_repasse_matching ON NOG_repasse_records(patient_name_normalized, service_date, convenio_id);

CREATE TABLE NOG_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES NOG_conference_sessions(id) ON DELETE CASCADE,
  production_record_id UUID NOT NULL REFERENCES NOG_production_records(id),
  repasse_record_id UUID NOT NULL REFERENCES NOG_repasse_records(id),
  match_type TEXT NOT NULL CHECK (match_type IN ('exact', 'fuzzy_name', 'fuzzy_convenio', 'cross_month', 'manual')),
  match_confidence NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE NOG_divergences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES NOG_conference_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'PRODUZIDO_SEM_REPASSE', 'REPASSE_SEM_PRODUCAO', 'VALOR_DIVERGENTE',
    'PERCENTUAL_INCORRETO', 'EXAME_NAO_PAGO', 'GLOSA_INESPERADA'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('ALTA', 'MEDIA', 'BAIXA')),
  service_date DATE,
  patient_name TEXT,
  convenio_name TEXT,
  convenio_id UUID REFERENCES NOG_convenios(id),
  production_record_id UUID REFERENCES NOG_production_records(id),
  repasse_record_id UUID REFERENCES NOG_repasse_records(id),
  valor_esperado NUMERIC(10,2),
  valor_recebido NUMERIC(10,2),
  diferenca NUMERIC(10,2),
  procedure_production TEXT,
  procedure_repasse TEXT,
  detail TEXT NOT NULL,
  resolution_status TEXT DEFAULT 'open' CHECK (resolution_status IN ('open', 'acknowledged', 'disputed', 'resolved')),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_nog_divergences_session ON NOG_divergences(session_id);
CREATE INDEX idx_nog_divergences_type ON NOG_divergences(type);
CREATE INDEX idx_nog_divergences_severity ON NOG_divergences(severity);

-- ============================================================
-- 5. SEED DATA
-- ============================================================

-- Insert procedure categories
INSERT INTO NOG_procedure_categories (slug, display_name, generates_repasse, default_repasse_pct) VALUES
  ('consulta', 'Consulta', true, 70.00),
  ('cirurgia', 'Cirurgia', true, 75.00),
  ('video_naso', 'Vídeo-Endoscopia Nasal', true, 50.00),
  ('video_laringo', 'Vídeo-Faringo-Laringoscopia', true, 50.00),
  ('video_generico', 'Vídeo (genérico)', true, 50.00),
  ('fees', 'FEES', true, 50.00),
  ('cerumen', 'Remoção de Cerúmen', true, 50.00),
  ('corpo_estranho', 'Corpos Estranhos', true, 50.00),
  ('otoneurologia', 'Otoneurologia', true, 70.00),
  ('teste_alergico', 'Teste Alérgico (Prick Test)', true, 50.00),
  ('pares_cranianos', 'Pesquisa Pares Cranianos', true, 50.00),
  ('sem_repasse', 'Sem Repasse (Retorno/Cortesia)', false, NULL),
  ('outro', 'Outro', true, 70.00);

-- Insert known TUSS codes
INSERT INTO NOG_procedures (tuss_code, description, category_id) VALUES
  ('10101012', 'Consulta em consultório (no horário normal ou preestabelecido)', (SELECT id FROM NOG_procedure_categories WHERE slug = 'consulta')),
  ('10101039', 'Consulta em pronto socorro', (SELECT id FROM NOG_procedure_categories WHERE slug = 'consulta')),
  ('20104065', 'Cerúmen - remoção (bilateral)', (SELECT id FROM NOG_procedure_categories WHERE slug = 'cerumen')),
  ('30402042', 'Corpos estranhos, pólipos ou biópsia - em consultório', (SELECT id FROM NOG_procedure_categories WHERE slug = 'corpo_estranho')),
  ('30205271', 'Adenoidectomia por videoendoscopia', (SELECT id FROM NOG_procedure_categories WHERE slug = 'cirurgia')),
  ('30205050', 'Amigdalectomia das palatinas', (SELECT id FROM NOG_procedure_categories WHERE slug = 'cirurgia')),
  ('30205069', 'Amigdalectomia lingual', (SELECT id FROM NOG_procedure_categories WHERE slug = 'cirurgia')),
  ('30501458', 'Turbinectomia ou turbinoplastia - unilateral', (SELECT id FROM NOG_procedure_categories WHERE slug = 'cirurgia')),
  ('30201063', 'Frenectomia labial', (SELECT id FROM NOG_procedure_categories WHERE slug = 'cirurgia')),
  ('30200015', 'Frenectomia lingual', (SELECT id FROM NOG_procedure_categories WHERE slug = 'cirurgia')),
  ('40201210', 'Vídeo-endoscopia naso-sinusal com ótica flexível', (SELECT id FROM NOG_procedure_categories WHERE slug = 'video_naso')),
  ('40201260', 'Vídeo-faringo-laringoscopia com endoscópio rígido', (SELECT id FROM NOG_procedure_categories WHERE slug = 'video_laringo')),
  ('40201252', 'Vídeo (genérico)', (SELECT id FROM NOG_procedure_categories WHERE slug = 'video_generico')),
  ('77920010', 'Vídeo-endoscopia naso-sinusal com ótica flex. (PACOTE)', (SELECT id FROM NOG_procedure_categories WHERE slug = 'video_naso')),
  ('20020040', 'Consulta otoneurologia em consultório', (SELECT id FROM NOG_procedure_categories WHERE slug = 'otoneurologia')),
  ('40201309', 'Avaliação endoscópica da deglutição (FEES)', (SELECT id FROM NOG_procedure_categories WHERE slug = 'fees'));

-- Insert default doctor and clinic for MVP
INSERT INTO NOG_doctors (id, full_name, email, specialty)
VALUES ('00000000-0000-0000-0000-000000000001', 'LUANA CAROLINA FONTANA', 'luanaf18@hotmail.com', 'Otorrinolaringologia');

INSERT INTO NOG_clinics (id, name, slug, igut_subdomain)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Otorrino DF', 'otorrino-df', 'otorrinodf'),
  ('00000000-0000-0000-0000-000000000002', 'BSB Otorrino', 'bsb-otorrino', NULL);

INSERT INTO NOG_doctor_clinics (doctor_id, clinic_id, active)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', true);

-- Default tax configs
INSERT INTO NOG_tax_configs (doctor_id, procedure_category, tax_rate, description, effective_from)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'consulta', 0.1703, 'Impostos consultas/exames (17.03%)', '2025-01-01'),
  ('00000000-0000-0000-0000-000000000001', 'video_naso', 0.1703, 'Impostos exames (17.03%)', '2025-01-01'),
  ('00000000-0000-0000-0000-000000000001', 'video_laringo', 0.1703, 'Impostos exames (17.03%)', '2025-01-01'),
  ('00000000-0000-0000-0000-000000000001', 'fees', 0.1703, 'Impostos exames (17.03%)', '2025-01-01'),
  ('00000000-0000-0000-0000-000000000001', 'cerumen', 0.1703, 'Impostos exames (17.03%)', '2025-01-01'),
  ('00000000-0000-0000-0000-000000000001', 'otoneurologia', 0.1703, 'Impostos consultas (17.03%)', '2025-01-01'),
  ('00000000-0000-0000-0000-000000000001', 'cirurgia', 0.0793, 'Impostos cirurgias (7.93%)', '2025-01-01');

-- Default monthly deductions
INSERT INTO NOG_monthly_deductions (doctor_id, clinic_id, deduction_type, amount, effective_from)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'PRO_LABORE', 375.72, '2025-01-01'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'TAXA_ADM', 300.00, '2025-01-01');
