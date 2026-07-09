import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  HelpCircle, 
  Code2, 
  AlertOctagon, 
  Flame, 
  Activity, 
  Search, 
  ArrowRight,
  Filter,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { FormulaIssue } from '../types.js';

interface FormulaAuditViewProps {
  onFormulaAudit: (file: File) => Promise<any>;
  isDarkMode: boolean;
  onAddToast: (text: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function FormulaAuditView({
  onFormulaAudit,
  isDarkMode,
  onAddToast
}: FormulaAuditViewProps) {
  const [fileToAudit, setFileToAudit] = useState<File | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any | null>(null);
  const [issueTypeFilter, setIssueTypeFilter] = useState<string>('all');
  const [selectedCell, setSelectedCell] = useState<FormulaIssue | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToAudit(e.target.files[0]);
      onAddToast(`Spreadsheet loaded for audit: ${e.target.files[0].name}`, 'info');
    }
  };

  const executeAudit = async () => {
    setIsAuditing(true);
    setAuditResult(null);
    setSelectedCell(null);
    try {
      // Trigger API formula-audit (sends empty file if none loaded to trigger beautiful sample audit fallback)
      const res = await onFormulaAudit(fileToAudit || new File([], "test_sheet.xlsx"));
      setAuditResult(res);
      onAddToast(`Formula Audit Complete! Score: ${res.healthScore}/100`, 'success');
      
      const criticalCount = res.formulaIssues.filter((i: any) => i.severity === 'critical').length;
      if (criticalCount > 0) {
        onAddToast(`Detected ${criticalCount} broken reference crash zones (#REF!)!`, 'error');
      }
    } catch (err) {
      onAddToast('Formula audit failed. Loaded pre-seeded audit dataset.', 'error');
    } finally {
      setIsAuditing(false);
    }
  };

  const filteredIssues = auditResult ? auditResult.formulaIssues.filter((issue: FormulaIssue) => {
    return issueTypeFilter === 'all' || issue.issueType === issueTypeFilter;
  }) : [];

  // Sheet mockup layout coordinates for heatmap visualization
  const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const rows = Array.from({ length: 15 }, (_, i) => i + 1);

  // Helper to check if a heatmap cell has an issue
  const getCellIssue = (colName: string, rowNum: number): FormulaIssue | undefined => {
    if (!auditResult) return undefined;
    const ref = `${colName}${rowNum}`;
    return auditResult.formulaIssues.find((issue: FormulaIssue) => issue.cell === ref);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title */}
      <div>
        <h2 className="font-display font-bold text-3xl tracking-tight">Formula & Logic Integrity Checker</h2>
        <p className="text-sm text-slate-400 mt-1">
          Perform a microscopic cell-level scan on spreadsheets to identify broken references, hardcoded values embedded in series, and divergent math formulas.
        </p>
      </div>

      {/* Audit Trigger Card */}
      <div className={`p-6 rounded-2xl border shadow-sm ${
        isDarkMode ? 'bg-slate-800 border-slate-700/60' : 'bg-white border-slate-200/80'
      }`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="bg-teal-500/15 p-3 rounded-xl text-teal-500">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-md leading-none">Select Target Sheet for Audit</h3>
              <p className="text-xs text-slate-400 mt-1">Excel file parser will extract and scan raw cell formulas.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Native file upload button */}
            <div className="flex-1 md:flex-none relative border border-slate-700/50 hover:border-teal-500 rounded-xl px-4 py-2 bg-black/15 cursor-pointer text-center text-xs transition min-w-[200px]">
              <input 
                type="file" 
                accept=".xlsx" 
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
              <span className="font-semibold truncate block">
                {fileToAudit ? fileToAudit.name : 'Import sheet (.xlsx)'}
              </span>
            </div>

            <button
              onClick={executeAudit}
              disabled={isAuditing}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 text-xs"
            >
              {isAuditing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Auditing Cells...
                </>
              ) : (
                'Run Formula Audit'
              )}
            </button>
          </div>
        </div>

        {!fileToAudit && (
          <p className="text-[10px] text-teal-500/90 mt-4 leading-normal bg-teal-500/5 border border-teal-500/10 p-2 rounded-lg">
            💡 <strong>Playground Notice:</strong> Click "Run Formula Audit" directly to process our pre-seeded complex financial spreadsheet and test-drive the heatmap!
          </p>
        )}
      </div>

      {/* Loading Skeleton */}
      {isAuditing && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="h-64 bg-slate-500/10 rounded-2xl animate-pulse md:col-span-2"></div>
          <div className="h-64 bg-slate-500/10 rounded-2xl animate-pulse"></div>
        </div>
      )}

      {/* Analysis Workspace */}
      {auditResult && !isAuditing && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Heatmap & Grid Panel */}
          <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm flex flex-col justify-between ${
            isDarkMode ? 'bg-slate-800 border-slate-700/60' : 'bg-white border-slate-200/80'
          }`}>
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-display font-bold text-lg leading-none">Cell Integrity Visualizer</h3>
                  <p className="text-xs text-slate-400 mt-1">Simulated cell grid. Click a blinking cell to review logical flaws.</p>
                </div>
                
                {/* Score badge */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logic Health Score</span>
                  <div className={`text-xl font-display font-bold px-3 py-1 rounded-xl shadow-sm ${
                    auditResult.healthScore > 85 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500 animate-pulse'
                  }`}>
                    {auditResult.healthScore}%
                  </div>
                </div>
              </div>

              {/* Excel Grid Heatmap Mockup */}
              <div className="overflow-auto border border-slate-700/40 rounded-xl bg-slate-900/45 p-3">
                <div className="grid grid-cols-9 gap-1 font-mono text-[10px] min-w-[500px]">
                  {/* Column Headers */}
                  <div className="h-6 flex items-center justify-center font-bold text-slate-500"></div>
                  {columns.map(col => (
                    <div key={col} className="h-6 flex items-center justify-center font-bold text-slate-400 bg-black/10 rounded border border-slate-800">
                      {col}
                    </div>
                  ))}

                  {/* Rows */}
                  {rows.map(rowNum => (
                    <React.Fragment key={rowNum}>
                      {/* Row Label */}
                      <div className="h-6 flex items-center justify-center font-bold text-slate-500 bg-black/10 rounded border border-slate-800">
                        {rowNum}
                      </div>

                      {/* Cell Boxes */}
                      {columns.map(colName => {
                        const cellIssue = getCellIssue(colName, rowNum);
                        const isCellSelected = selectedCell?.cell === `${colName}${rowNum}`;

                        let cellClass = 'bg-black/5 hover:bg-teal-500/10 text-slate-600 border border-slate-800/60';
                        if (cellIssue) {
                          cellClass = cellIssue.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40 animate-pulse cursor-pointer'
                            : cellIssue.severity === 'high'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 cursor-pointer'
                            : 'bg-amber-500/15 text-amber-500 border border-amber-500/30 cursor-pointer';
                        }
                        if (isCellSelected) {
                          cellClass += ' ring-2 ring-teal-500 ring-offset-2 ring-offset-slate-900';
                        }

                        return (
                          <div
                            key={colName}
                            onClick={() => cellIssue && setSelectedCell(cellIssue)}
                            className={`h-6 flex items-center justify-center font-bold rounded text-[9px] transition duration-150 ${cellClass}`}
                            title={cellIssue ? `${colName}${rowNum}: ${cellIssue.description}` : `${colName}${rowNum}`}
                          >
                            {cellIssue ? `${colName}${rowNum}` : ''}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Selection detail bar */}
            <div className="mt-4 pt-4 border-t border-slate-700/30">
              {selectedCell ? (
                <div className="p-3.5 rounded-xl bg-teal-500/5 border border-teal-500/25 flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${selectedCell.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'}`} />
                  <div className="text-xs space-y-1 flex-1">
                    <p className="font-bold text-slate-200">
                      Cell coordinate {selectedCell.cell} ({selectedCell.sheetName})
                    </p>
                    <p className="text-slate-400 leading-relaxed">{selectedCell.description}</p>
                    <p className="font-mono text-[10px] text-slate-300 mt-2 bg-black/30 p-1.5 rounded">
                      Formula: <span className="text-teal-500">{selectedCell.formula}</span> | Value: {selectedCell.currentValue}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 text-center">
                  💡 Select any colored/blinking heatmap coordinate block to audit cell math parameters.
                </p>
              )}
            </div>
          </div>

          {/* Issue Breakdown panel */}
          <div className={`p-6 rounded-2xl border shadow-sm flex flex-col ${
            isDarkMode ? 'bg-slate-800 border-slate-700/60' : 'bg-white border-slate-200/80'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg leading-none">Anomalies Breakdown</h3>
              <span className="text-xs font-bold text-slate-400 font-mono bg-slate-500/10 px-1.5 py-0.5 rounded">
                {filteredIssues.length} ISSUES
              </span>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1.5 mb-4 border-b border-slate-700/30 pb-4">
              <button
                onClick={() => setIssueTypeFilter('all')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition uppercase ${
                  issueTypeFilter === 'all' 
                    ? 'bg-teal-500/25 text-teal-400 border border-teal-500/30' 
                    : 'bg-slate-500/5 text-slate-400 hover:bg-slate-500/10'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setIssueTypeFilter('broken_ref')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition uppercase ${
                  issueTypeFilter === 'broken_ref' 
                    ? 'bg-rose-500/25 text-rose-400 border border-rose-500/30' 
                    : 'bg-slate-500/5 text-slate-400 hover:bg-slate-500/10'
                }`}
              >
                #REF! Crashes
              </button>
              <button
                onClick={() => setIssueTypeFilter('hardcoded_in_formula_range')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition uppercase ${
                  issueTypeFilter === 'hardcoded_in_formula_range' 
                    ? 'bg-amber-500/25 text-amber-400 border border-amber-500/30' 
                    : 'bg-slate-500/5 text-slate-400 hover:bg-slate-500/10'
                }`}
              >
                Hardcoded Value
              </button>
              <button
                onClick={() => setIssueTypeFilter('inconsistent_pattern')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition uppercase ${
                  issueTypeFilter === 'inconsistent_pattern' 
                    ? 'bg-indigo-500/25 text-indigo-400 border border-indigo-500/30' 
                    : 'bg-slate-500/5 text-slate-400 hover:bg-slate-500/10'
                }`}
              >
                Diverging Math
              </button>
            </div>

            {/* List */}
            <div className="space-y-3.5 overflow-y-auto max-h-[350px] pr-1 flex-1">
              {filteredIssues.map((issue: FormulaIssue, idx: number) => {
                const colors = {
                  broken_ref: 'border-l-rose-500 bg-rose-500/5',
                  hardcoded_in_formula_range: 'border-l-amber-500 bg-amber-500/5',
                  inconsistent_pattern: 'border-l-indigo-500 bg-indigo-500/5'
                }[issue.issueType];

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedCell(issue)}
                    className={`p-3 rounded-xl border border-slate-700/40 border-l-4 ${colors} text-xs cursor-pointer hover:border-slate-500 transition`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono font-bold text-slate-200">
                        {issue.sheetName} — Cell {issue.cell}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {issue.issueType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed mt-1">{issue.description}</p>
                    <p className="font-mono text-[10px] text-teal-500 mt-2 truncate bg-black/15 p-1 rounded">
                      {issue.formula}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
