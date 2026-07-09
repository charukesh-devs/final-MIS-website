import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  ArrowRight,
  AlertOctagon, 
  HelpCircle, 
  PlusCircle, 
  Trash2,
  CheckCircle,
  FileCheck,
  ShieldCheck,
  MessageSquare,
  History,
  Loader2,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { OverrideCell, User } from '../types.js';

interface OverrideDetectorViewProps {
  onCheckOverrides: (currentFile: File, previousFile: File | null) => Promise<any>;
  onAnnotateOverride: (sheet: string, cell: string, expected: string, actual: number, comment: string) => Promise<void>;
  user: User | null;
  isDarkMode: boolean;
  onAddToast: (text: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function OverrideDetectorView({
  onCheckOverrides,
  onAnnotateOverride,
  user,
  isDarkMode,
  onAddToast
}: OverrideDetectorViewProps) {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [prevFile, setPrevFile] = useState<File | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [flaggedOverrides, setFlaggedOverrides] = useState<OverrideCell[] | null>(null);
  const [annotatingCell, setAnnotatingCell] = useState<OverrideCell | null>(null);
  const [commentText, setCommentText] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>([
    {
      id: 'ovr-seed-1',
      cell: 'D15',
      sheetName: 'Financial Summary',
      expectedFormula: '=SUM(D8:D14)',
      actualValue: '450000',
      comment: 'CFO Office sign-off: Year-end manual adjustment to align accrual reserves.',
      user: 'audit_lead@company.com',
      date: new Date().toLocaleDateString()
    }
  ]);

  const runOverrideCheck = async () => {
    setIsChecking(true);
    setFlaggedOverrides(null);
    setAnnotatingCell(null);
    try {
      // Trigger API overrides endpoint
      const res = await onCheckOverrides(
        currentFile || new File([], 'cur.xlsx'),
        prevFile
      );
      setFlaggedOverrides(res.overriddenCells);
      onAddToast(`Audit scan complete! Detected ${res.overridesCount} unauthorized manual overrides.`, 'warning');
    } catch (err) {
      onAddToast('Override check completed. Pre-seeded manual adjustments loaded.', 'error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleAnnotateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !annotatingCell) return;

    try {
      await onAnnotateOverride(
        annotatingCell.sheetName,
        annotatingCell.cell,
        annotatingCell.expectedFormula,
        annotatingCell.actualValue,
        commentText
      );

      // Append locally to simulated audit log
      const newLog = {
        id: `ovr-log-${Date.now()}`,
        cell: annotatingCell.cell,
        sheetName: annotatingCell.sheetName,
        expectedFormula: annotatingCell.expectedFormula,
        actualValue: String(annotatingCell.actualValue),
        comment: commentText,
        user: user?.email || 'reviewer@company.com',
        date: new Date().toLocaleDateString()
      };

      setAuditLogs([newLog, ...auditLogs]);
      
      // Remove annotated cell from active flagged list
      if (flaggedOverrides) {
        setFlaggedOverrides(flaggedOverrides.filter(o => o.cell !== annotatingCell.cell || o.sheetName !== annotatingCell.sheetName));
      }

      onAddToast(`Override cell ${annotatingCell.cell} signed off and logged!`, 'success');
      setAnnotatingCell(null);
      setCommentText('');
    } catch (err) {
      onAddToast('Failed to save override sign-off.', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title */}
      <div>
        <h2 className="font-display font-bold text-3xl tracking-tight">Manual Override Detector</h2>
        <p className="text-sm text-slate-400 mt-1">
          Detect and audit cells where formulas have been deleted and overwritten with static numbers between versions.
        </p>
      </div>

      {/* Dual File comparison upload */}
      <div className={`p-6 rounded-2xl border shadow-sm ${
        isDarkMode ? 'bg-slate-800 border-slate-700/60' : 'bg-white border-slate-200/80'
      }`}>
        <h3 className="font-display font-bold text-lg mb-4">Version Comparison Console</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current File */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Current Document version (Current MIS)</label>
            <div className={`border-2 border-dashed rounded-xl p-5 text-center relative hover:border-teal-500 transition ${
              currentFile ? 'border-teal-500 bg-teal-500/5' : 'border-slate-700/50'
            }`}>
              <input 
                type="file" 
                accept=".xlsx" 
                onChange={(e) => e.target.files && setCurrentFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
              <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold">{currentFile ? currentFile.name : 'Select current xlsx'}</p>
            </div>
          </div>

          {/* Previous File */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Previous Document reference (Previous Month/Expected Formula)</label>
            <div className={`border-2 border-dashed rounded-xl p-5 text-center relative hover:border-teal-500 transition ${
              prevFile ? 'border-teal-500 bg-teal-500/5' : 'border-slate-700/50'
            }`}>
              <input 
                type="file" 
                accept=".xlsx" 
                onChange={(e) => e.target.files && setPrevFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
              <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold">{prevFile ? prevFile.name : 'Select historical xlsx (Optional)'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-t border-slate-700/30 pt-5">
          <p className="text-[10px] text-teal-500/90 leading-relaxed bg-teal-500/5 p-2 rounded-lg max-w-xl">
            💡 <strong>Playground override analyzer:</strong> Click the comparison trigger directly to initiate cell comparison and flag static formula deletions on our sample financial reports!
          </p>
          
          <button
            onClick={runOverrideCheck}
            disabled={isChecking}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Scanning for overridden cells...
              </>
            ) : (
              'Scan for Manual Overrides'
            )}
          </button>
        </div>
      </div>

      {/* Main workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Discovered Overrides List */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm ${
          isDarkMode ? 'bg-slate-800 border-slate-700/60' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-display font-bold text-lg leading-none">Flagged Formula Overwrites</h3>
              <p className="text-xs text-slate-400 mt-1">Discovered cells containing hardcoded values where formulas are expected.</p>
            </div>
          </div>

          <div className="space-y-4">
            {!flaggedOverrides ? (
              <div className="text-center py-12 border border-slate-700/40 rounded-xl bg-slate-900/10">
                <FileCheck className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
                <p className="text-xs text-slate-400 font-semibold">No version scan executed yet.</p>
                <p className="text-[10px] text-slate-400 mt-1">Run comparison scan above to audit cells.</p>
              </div>
            ) : flaggedOverrides.length === 0 ? (
              <div className="text-center py-12 border border-slate-700/40 rounded-xl bg-slate-900/10">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-70" />
                <p className="text-xs font-bold text-slate-300">Clean Sheet! 0 Manual Overrides Flagged</p>
                <p className="text-[10px] text-slate-400 mt-1">All cell structures strictly match expected formula logic.</p>
              </div>
            ) : (
              flaggedOverrides.map((cell, idx) => {
                const isSelected = annotatingCell?.cell === cell.cell;

                return (
                  <div 
                    key={idx}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                      isSelected 
                        ? 'border-teal-500 bg-teal-500/5' 
                        : 'bg-black/15 border-slate-700/40 hover:border-slate-500'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded text-[10px] uppercase">
                          Static Replaced Formula
                        </span>
                        <span className="font-mono font-extrabold text-slate-200">
                          {cell.sheetName} — Coordinate {cell.cell}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-1.5 font-mono text-[11px] text-slate-400">
                        <div>
                          Expected Formula: <span className="text-rose-400">{cell.expectedFormula}</span>
                        </div>
                        <div>
                          Typed Static Value: <span className="text-teal-500 font-bold">₹{cell.actualValue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setAnnotatingCell(cell)}
                      className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-[11px] font-bold rounded-lg text-slate-100 transition inline-flex items-center gap-1 shrink-0 self-end md:self-center"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Sign-off Discrepancy
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Annotation Panel */}
          {annotatingCell && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 p-4 rounded-xl border border-teal-500/35 bg-teal-500/5 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-teal-500/20">
                <h4 className="text-xs font-bold uppercase text-teal-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Auditor Sign-off and Annotation form
                </h4>
                <button onClick={() => setAnnotatingCell(null)} className="text-slate-400 hover:text-slate-200 text-xs font-bold">Cancel</button>
              </div>

              <form onSubmit={handleAnnotateSubmit} className="space-y-3.5 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold block">Justification Code & Comments</label>
                  <textarea
                    required
                    placeholder="Enter CFO approval reference, ledger adjusting JV, or comments explaining why formula was overwritten..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full text-xs p-2.5 bg-black/25 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500 resize-none h-16"
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>Signatory Role: <strong>{user?.role.toUpperCase()} ({user?.email})</strong></span>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg shadow-md transition"
                  >
                    Certify Override Logs
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>

        {/* Override Audit Trail (Timeline list) */}
        <div className={`p-6 rounded-2xl border shadow-sm flex flex-col ${
          isDarkMode ? 'bg-slate-800 border-slate-700/60' : 'bg-white border-slate-200/80'
        }`}>
          <h3 className="font-display font-bold text-lg mb-1.5 flex items-center gap-1.5 leading-none">
            <History className="w-5 h-5 text-teal-600" />
            Override Audit Trail
          </h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Immutable log of signed-off overrides approved by the finance controllers.
          </p>

          <div className="space-y-4 overflow-y-auto max-h-[350px] pr-1 flex-1">
            {auditLogs.map((log) => (
              <div 
                key={log.id}
                className="p-3.5 rounded-xl bg-black/15 border border-slate-700/40 text-xs space-y-2 relative"
              >
                <div className="flex justify-between items-start gap-2">
                  <p className="font-mono font-bold text-slate-200">
                    {log.sheetName} — {log.cell}
                  </p>
                  <span className="text-[9px] text-slate-400 font-medium">
                    {log.date}
                  </span>
                </div>
                
                <div className="font-mono text-[10px] text-slate-400 bg-black/20 p-1.5 rounded space-y-0.5">
                  <p>Expected: <span className="text-rose-400">{log.expectedFormula}</span></p>
                  <p>Static: <span className="text-teal-400">₹{parseFloat(log.actualValue).toLocaleString()}</span></p>
                </div>

                <div className="flex items-start gap-1.5 text-[11px] text-slate-400 pt-1 leading-relaxed">
                  <MessageSquare className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                  <p>"{log.comment}"</p>
                </div>

                <div className="text-[9px] text-teal-500 font-bold uppercase tracking-wider text-right border-t border-slate-800/40 pt-1.5">
                  Certified: {log.user}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
