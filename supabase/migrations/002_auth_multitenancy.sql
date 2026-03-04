-- Nog: Auth + Multi-Tenancy + RLS + Notifications + Analytics RPCs
-- This migration transforms Nog from single-user MVP to multi-tenant SaaS.

-- ============================================================
-- 1. AUTH COLUMNS ON NOG_DOCTORS
-- ============================================================

ALTER TABLE nog_doctors
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'doctor' CHECK (role IN ('admin', 'doctor')),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE INDEX IF NOT EXISTS idx_nog_doctors_auth ON nog_doctors(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_nog_doctors_email ON nog_doctors(email);

-- ============================================================
-- 2. HELPER FUNCTIONS
-- ============================================================

-- Get the nog_doctors.id for the currently authenticated user
CREATE OR REPLACE FUNCTION nog_current_doctor_id()
RETURNS UUID AS $$
  SELECT id FROM nog_doctors WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if the current user is an admin
CREATE OR REPLACE FUNCTION nog_is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM nog_doctors
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all data tables
ALTER TABLE nog_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE nog_conference_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nog_production_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE nog_repasse_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE nog_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE nog_divergences ENABLE ROW LEVEL SECURITY;
ALTER TABLE nog_tax_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nog_repasse_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE nog_monthly_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nog_doctor_clinics ENABLE ROW LEVEL SECURITY;

-- Data tables with doctor_id: admin sees all, doctor sees own
CREATE POLICY "uploads_access" ON nog_uploads
  FOR ALL USING (nog_is_admin() OR doctor_id = nog_current_doctor_id());

CREATE POLICY "conference_sessions_access" ON nog_conference_sessions
  FOR ALL USING (nog_is_admin() OR doctor_id = nog_current_doctor_id());

CREATE POLICY "production_records_access" ON nog_production_records
  FOR ALL USING (nog_is_admin() OR doctor_id = nog_current_doctor_id());

CREATE POLICY "repasse_records_access" ON nog_repasse_records
  FOR ALL USING (nog_is_admin() OR doctor_id = nog_current_doctor_id());

CREATE POLICY "tax_configs_access" ON nog_tax_configs
  FOR ALL USING (nog_is_admin() OR doctor_id = nog_current_doctor_id());

CREATE POLICY "monthly_deductions_access" ON nog_monthly_deductions
  FOR ALL USING (nog_is_admin() OR doctor_id = nog_current_doctor_id());

CREATE POLICY "doctor_clinics_access" ON nog_doctor_clinics
  FOR ALL USING (nog_is_admin() OR doctor_id = nog_current_doctor_id());

-- Matches and divergences: access through session_id → conference_sessions → doctor_id
CREATE POLICY "matches_access" ON nog_matches
  FOR ALL USING (
    nog_is_admin() OR EXISTS (
      SELECT 1 FROM nog_conference_sessions cs
      WHERE cs.id = nog_matches.session_id
        AND cs.doctor_id = nog_current_doctor_id()
    )
  );

CREATE POLICY "divergences_access" ON nog_divergences
  FOR ALL USING (
    nog_is_admin() OR EXISTS (
      SELECT 1 FROM nog_conference_sessions cs
      WHERE cs.id = nog_divergences.session_id
        AND cs.doctor_id = nog_current_doctor_id()
    )
  );

-- Repasse rules: clinic-scoped (readable by doctors in that clinic)
CREATE POLICY "repasse_rules_access" ON nog_repasse_rules
  FOR SELECT USING (
    nog_is_admin() OR EXISTS (
      SELECT 1 FROM nog_doctor_clinics dc
      WHERE dc.clinic_id = nog_repasse_rules.clinic_id
        AND dc.doctor_id = nog_current_doctor_id()
        AND dc.active = true
    )
  );
CREATE POLICY "repasse_rules_admin_write" ON nog_repasse_rules
  FOR ALL USING (nog_is_admin());

-- Reference tables: read for all authenticated, write for admin only
ALTER TABLE nog_doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doctors_read" ON nog_doctors
  FOR SELECT USING (nog_is_admin() OR id = nog_current_doctor_id());
CREATE POLICY "doctors_admin_write" ON nog_doctors
  FOR INSERT WITH CHECK (nog_is_admin());
CREATE POLICY "doctors_admin_update" ON nog_doctors
  FOR UPDATE USING (nog_is_admin() OR id = nog_current_doctor_id());

ALTER TABLE nog_clinics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinics_read" ON nog_clinics
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "clinics_admin_write" ON nog_clinics
  FOR ALL USING (nog_is_admin());

ALTER TABLE nog_convenios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "convenios_read" ON nog_convenios
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "convenios_admin_write" ON nog_convenios
  FOR ALL USING (nog_is_admin());

ALTER TABLE nog_convenio_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "convenio_aliases_read" ON nog_convenio_aliases
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "convenio_aliases_admin_write" ON nog_convenio_aliases
  FOR ALL USING (nog_is_admin());

ALTER TABLE nog_procedure_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "procedure_categories_read" ON nog_procedure_categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

ALTER TABLE nog_procedures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "procedures_read" ON nog_procedures
  FOR SELECT USING (auth.uid() IS NOT NULL);

ALTER TABLE nog_procedure_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "procedure_aliases_read" ON nog_procedure_aliases
  FOR SELECT USING (auth.uid() IS NOT NULL);

ALTER TABLE nog_production_procedures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "production_procedures_access" ON nog_production_procedures
  FOR ALL USING (
    nog_is_admin() OR EXISTS (
      SELECT 1 FROM nog_production_records pr
      WHERE pr.id = nog_production_procedures.production_record_id
        AND pr.doctor_id = nog_current_doctor_id()
    )
  );

-- ============================================================
-- 4. NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE nog_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES nog_doctors(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES nog_clinics(id),
  type TEXT NOT NULL CHECK (type IN (
    'conference_completed', 'critical_divergence',
    'upload_completed', 'upload_failed', 'system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_nog_notifications_lookup ON nog_notifications(doctor_id, read, created_at DESC);

ALTER TABLE nog_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_access" ON nog_notifications
  FOR ALL USING (nog_is_admin() OR doctor_id = nog_current_doctor_id());

-- ============================================================
-- 5. AUDIT LOG TABLE
-- ============================================================

CREATE TABLE nog_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES nog_doctors(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_nog_audit_log_actor ON nog_audit_log(actor_id, created_at DESC);
CREATE INDEX idx_nog_audit_log_time ON nog_audit_log(created_at DESC);

ALTER TABLE nog_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_admin_read" ON nog_audit_log
  FOR SELECT USING (nog_is_admin());
CREATE POLICY "audit_log_write" ON nog_audit_log
  FOR INSERT WITH CHECK (actor_id = nog_current_doctor_id() OR nog_is_admin());

-- ============================================================
-- 6. ANALYTICS RPCs
-- ============================================================

-- Monthly summary aggregation
CREATE OR REPLACE FUNCTION nog_monthly_summary(
  p_doctor_id UUID,
  p_clinic_id UUID,
  p_months INTEGER DEFAULT 12
)
RETURNS TABLE (
  month DATE,
  total_production BIGINT,
  total_bruto NUMERIC,
  total_repassado NUMERIC,
  total_divergences BIGINT,
  total_valor_divergente NUMERIC,
  total_matched BIGINT,
  match_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc('month', cs.production_period_start)::DATE AS month,
    COALESCE(SUM(cs.total_production_records), 0)::BIGINT,
    COALESCE(SUM(cs.total_valor_bruto), 0),
    COALESCE(SUM(cs.total_valor_repassado), 0),
    COALESCE(SUM(cs.total_divergences), 0)::BIGINT,
    COALESCE(SUM(cs.total_valor_divergente), 0),
    COALESCE(SUM(cs.total_matched), 0)::BIGINT,
    CASE WHEN SUM(cs.total_production_records) > 0
      THEN ROUND(SUM(cs.total_matched)::NUMERIC / SUM(cs.total_production_records) * 100, 1)
      ELSE 0
    END
  FROM nog_conference_sessions cs
  WHERE cs.doctor_id = p_doctor_id
    AND cs.clinic_id = p_clinic_id
    AND cs.status = 'completed'
    AND cs.production_period_start >= (CURRENT_DATE - (p_months || ' months')::INTERVAL)
  GROUP BY date_trunc('month', cs.production_period_start)
  ORDER BY 1 ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 7. UPDATE TABLES REGISTRY
-- ============================================================
-- Add to nog_supabase/tables.ts: notifications, auditLog
