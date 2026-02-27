/**
 * Supabase table name constants.
 * All Nog tables use the nog_ prefix to namespace within Supabase.
 * NOTE: PostgreSQL folds unquoted identifiers to lowercase,
 * so NOG_doctors in SQL becomes nog_doctors in PostgREST.
 */
export const TABLES = {
  // Reference
  doctors: 'nog_doctors',
  clinics: 'nog_clinics',
  doctorClinics: 'nog_doctor_clinics',
  convenios: 'nog_convenios',
  convenioAliases: 'nog_convenio_aliases',
  procedureCategories: 'nog_procedure_categories',
  procedures: 'nog_procedures',
  procedureAliases: 'nog_procedure_aliases',

  // Configuration
  taxConfigs: 'nog_tax_configs',
  repasseRules: 'nog_repasse_rules',
  monthlyDeductions: 'nog_monthly_deductions',

  // Upload & Processing
  uploads: 'nog_uploads',
  conferenceSessions: 'nog_conference_sessions',

  // Data Records
  productionRecords: 'nog_production_records',
  productionProcedures: 'nog_production_procedures',
  repasseRecords: 'nog_repasse_records',
  matches: 'nog_matches',
  divergences: 'nog_divergences',
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];
