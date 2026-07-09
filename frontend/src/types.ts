export interface User {
  email: string;
  role: 'auditor' | 'reviewer' | 'admin';
  name: string;
}

export interface Report {
  id: string;
  name: string;
  expected_submission_date: string;
  actual_submission_date: string;
  uploaded_by_email: string;
  file_path: string;
  file_size: number;
  file_hash: string;
  version: number;
  status: 'submitted' | 'approved' | 'flagged';
  is_late: boolean;
  created_at: string;
}

export interface ExceptionFlag {
  id: string;
  module: 'reconciliation' | 'kpi_consistency' | 'formula_integrity' | 'manual_override' | 'timeliness';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  meta_data: any;
  status: 'open' | 'under_review' | 'resolved' | 'overridden';
  created_at: string;
}

export interface KpiDefinition {
  id: string;
  name: string;
  description: string;
  formula_definition: string;
  expected_sheet_name: string;
  cell_reference: string;
  materiality_threshold: number;
  created_at: string;
}

export interface ReconciliationRow {
  accountCode: string;
  accountName: string;
  misAmount: number;
  glAmount: number;
  varianceAmount: number;
  variancePercentage: number;
  status: 'green' | 'yellow' | 'red';
  glEntries?: Array<{ date: string; description: string; amount: number; reference: string }>;
}

export interface FormulaIssue {
  sheetName: string;
  cell: string;
  issueType: 'broken_ref' | 'hardcoded_in_formula_range' | 'inconsistent_pattern';
  description: string;
  formula: string;
  currentValue: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface OverrideCell {
  sheetName: string;
  cell: string;
  expectedFormula: string;
  actualValue: number;
  auditTrail?: string;
}
