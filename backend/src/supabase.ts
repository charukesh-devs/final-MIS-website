import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Types for in-memory DB fallback
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

export interface OverrideLog {
  id: string;
  report_id: string;
  sheet_name: string;
  cell_reference: string;
  expected_formula: string;
  actual_static_value: string;
  explanation: string;
  approved_by_email: string;
  created_at: string;
}

// In-Memory Database Store for fallback mode
class LocalMemoryDb {
  reports: Report[] = [];
  kpiDictionary: KpiDefinition[] = [];
  exceptions: ExceptionFlag[] = [];
  overrides: OverrideLog[] = [];

  constructor() {
    this.seedData();
  }

  seedData() {
    // 1. Seed KPI Definitions
    this.kpiDictionary = [
      {
        id: 'kpi-1',
        name: 'Gross Profit Margin',
        description: 'Analyzes gross profitability as a percentage of total revenues',
        formula_definition: 'Gross Profit / Total Revenue',
        expected_sheet_name: 'Financial Summary',
        cell_reference: 'C15',
        materiality_threshold: 1.5,
        created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'kpi-2',
        name: 'Operating Margin',
        description: 'Measures company pricing strategy and operating efficiency',
        formula_definition: 'Operating Income / Total Revenue',
        expected_sheet_name: 'Financial Summary',
        cell_reference: 'C18',
        materiality_threshold: 2.0,
        created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'kpi-3',
        name: 'Current Ratio',
        description: 'Measures liquidity to cover short-term obligations',
        formula_definition: 'Current Assets / Current Liabilities',
        expected_sheet_name: 'Balance Sheet',
        cell_reference: 'F22',
        materiality_threshold: 5.0,
        created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'kpi-4',
        name: 'Debt to Equity',
        description: 'Assesses financial leverage and risk profile',
        formula_definition: 'Total Debt / Total Shareholders Equity',
        expected_sheet_name: 'Balance Sheet',
        cell_reference: 'F35',
        materiality_threshold: 3.0,
        created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      }
    ];

    // 2. Seed Sample Reports (Timeliness log)
    const baseDate = new Date();
    this.reports = [
      {
        id: 'rep-q1',
        name: 'MIS_Report_Q1_2026.xlsx',
        expected_submission_date: new Date(baseDate.getFullYear(), 3, 10).toISOString(),
        actual_submission_date: new Date(baseDate.getFullYear(), 3, 8).toISOString(), // Ontime
        uploaded_by_email: 'controller@company.com',
        file_path: 'mis-reports/q1_2026.xlsx',
        file_size: 45210,
        file_hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
        version: 1,
        status: 'approved',
        is_late: false,
        created_at: new Date(baseDate.getFullYear(), 3, 8).toISOString()
      },
      {
        id: 'rep-q2',
        name: 'MIS_Report_Q2_2026.xlsx',
        expected_submission_date: new Date(baseDate.getFullYear(), 6, 10).toISOString(),
        actual_submission_date: new Date(baseDate.getFullYear(), 6, 12, 14, 30).toISOString(), // 2 days late
        uploaded_by_email: 'controller@company.com',
        file_path: 'mis-reports/q2_2026.xlsx',
        file_size: 48900,
        file_hash: '3e45f1b1c2b5e28ff111a43c1d50123413422d706483bfa0f98a5e886266e8bc',
        version: 2, // Re-submitted
        status: 'flagged',
        is_late: true,
        created_at: new Date(baseDate.getFullYear(), 6, 12).toISOString()
      }
    ];

    // 3. Seed Sample Exceptions
    this.exceptions = [
      {
        id: 'exc-1',
        module: 'timeliness',
        severity: 'medium',
        title: 'Late Submission: Q2 2026 MIS',
        description: 'MIS_Report_Q2_2026.xlsx was submitted on July 12th, 2 days past the July 10th deadline.',
        meta_data: { days_late: 2, expected: '2026-07-10', actual: '2026-07-12' },
        status: 'open',
        created_at: new Date(baseDate.getFullYear(), 6, 12).toISOString()
      },
      {
        id: 'exc-2',
        module: 'reconciliation',
        severity: 'critical',
        title: 'Material Variance: Revenue Account 4100',
        description: 'Revenue Reconciliation detected a variance of 4.5% (₹1,250,000) between MIS (₹27,750,000) and GL General Ledger (₹29,000,000).',
        meta_data: { variance_pct: 4.5, variance_amt: 1250000, account: '4100 - Domestic Revenue' },
        status: 'under_review',
        created_at: new Date(baseDate.getFullYear(), 6, 12).toISOString()
      },
      {
        id: 'exc-3',
        module: 'formula_integrity',
        severity: 'high',
        title: 'Hardcoded Value in Formula Row',
        description: 'In Sheet "Financial Summary", cell D15 is a static value (₹450,000) while all other cells in row 15 use sum formulas.',
        meta_data: { cell: 'D15', sheet: 'Financial Summary', issue: 'Hardcoded number in sum column' },
        status: 'open',
        created_at: new Date(baseDate.getFullYear(), 6, 12).toISOString()
      }
    ];

    // 4. Seed Overrides
    this.overrides = [
      {
        id: 'ovr-1',
        report_id: 'rep-q2',
        sheet_name: 'Financial Summary',
        cell_reference: 'D15',
        expected_formula: '=SUM(D8:D14)',
        actual_static_value: '450000',
        explanation: 'Auditor annotated: "Manual adjustment for off-balance sheet accruals, approved by CFO office."',
        approved_by_email: 'audit_lead@company.com',
        created_at: new Date(baseDate.getFullYear(), 6, 13).toISOString()
      }
    ];
  }
}

// Global memory DB instance
export const memoryDb = new LocalMemoryDb();

// Lazy Supabase client initialization wrapper
let supabaseClientInstance: SupabaseClient | null = null;
let isUsingLocalSandbox = true;

export function getSupabase(): { client: SupabaseClient | null; isSandbox: boolean } {
  if (supabaseClientInstance) {
    return { client: supabaseClientInstance, isSandbox: isUsingLocalSandbox };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseUrl !== 'https://your-supabase-project.supabase.co' && supabaseKey) {
    try {
      supabaseClientInstance = createClient(supabaseUrl, supabaseKey);
      isUsingLocalSandbox = false;
      console.log('✅ Successfully initialized real Supabase Client connection!');
      return { client: supabaseClientInstance, isSandbox: false };
    } catch (err) {
      console.warn('❌ Failed to initialize Supabase client, falling back to local secure sandbox:', err);
    }
  }

  isUsingLocalSandbox = true;
  return { client: null, isSandbox: true };
}

// Helper: Calculate MD5 or SHA256 of a buffer
export function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
