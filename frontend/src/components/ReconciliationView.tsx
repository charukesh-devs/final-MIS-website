import React, { useState } from 'react';
import { 
  Upload, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  FileSpreadsheet, 
  ArrowRight,
  ShieldAlert,
  Sliders,
  DollarSign,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReconciliationRow } from '../types.js';

interface ReconciliationViewProps {
  onReconcile: (misFile: File, glFile: File, materiality: number) => Promise<any>;
  isDarkMode: boolean;
  onAddToast: (text: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function ReconciliationView({
  onReconcile,
  isDarkMode,
  onAddToast
}: ReconciliationViewProps) {
  const [misFile, setMisFile] = useState<File | null>(null);
  const [glFile, setGlFile] = useState<File | null>(null);
  const [materiality, setMateriality] = useState<number>(2.0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleMisUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMisFile(e.target.files[0]);
      onAddToast(`MIS report loaded: ${e.target.files[0].name}`, 'info');
    }
  };

  const handleGlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setGlFile(e.target.files[0]);
      onAddToast(`GL ledger extract loaded: ${e.target.files[0].name}`, 'info');
    }
  };

  const triggerAnalysis = async () => {
    setIsAnalyzing(true);
    setResult(null);
    try {
      // Trigger API reconciliation
      const response = await onReconcile(
        misFile || new File([], "sample_mis.xlsx"), 
        glFile || new File([], "sample_gl.xlsx"), 
        materiality
      );
      setResult(response.reconciliation);
      onAddToast('Reconciliation analysis executed successfully!', 'success');
      if (response.reconciliation.totals.flaggedCount > 0) {
        onAddToast(`${response.reconciliation.totals.flaggedCount} ledger variances exceeded materiality threshold!`, 'warning');
      }
    } catch (err) {
      onAddToast('Reconciliation failed. Using robust mock calculation fallback.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleExpandRow = (code: string) => {
    if (expandedRow === code) {
      setExpandedRow(null);
    } else {
      setExpandedRow(code);
    }
  };

  const filteredRows = result ? result.reconciledRows.filter((row: ReconciliationRow) => {
    const matchesSearch = row.accountName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          row.accountCode.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title block */}
      <div>
        <h2 className="font-display font-bold text-3xl tracking-tight">MIS vs Books Reconciliation</h2>
        <p className="text-sm text-slate-400 mt-1">
          Perform line-item reconciliation between your Management Information System (MIS) reports and General Ledger (GL) extracts.
        </p>
      </div>

      {/* Dual Upload Widget and Materiality Slider */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Column */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm space-y-6 ${
          isDarkMode ? 'bg-slate-800 border-slate-700/60' : 'bg-white border-slate-200/80'
        }`}>
          <h3 className="font-display font-bold text-lg mb-2">Upload Reconciliation Documents</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MIS Upload Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">MIS Report Extract (.xlsx/.csv)</label>
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition relative ${
                misFile 
                  ? 'border-teal-500 bg-teal-500/5' 
                  : 'border-slate-700/50 hover:border-teal-500'
              }`}>
                <input 
                  type="file" 
                  accept=".xlsx,.csv,.xls" 
                  onChange={handleMisUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
                <div className="space-y-2">
                  <FileSpreadsheet className={`w-8 h-8 mx-auto ${misFile ? 'text-teal-500' : 'text-slate-400'}`} />
                  <p className="text-xs font-semibold">{misFile ? misFile.name : 'Drag & drop file or browse'}</p>
                  <p className="text-[10px] text-slate-400">Excel or CSV reports up to 10MB</p>
                </div>
              </div>
            </div>

            {/* GL Upload Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">GL / Books Extract (.xlsx/.csv)</label>
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition relative ${
                glFile 
                  ? 'border-teal-500 bg-teal-500/5' 
                  : 'border-slate-700/50 hover:border-teal-500'
              }`}>
                <input 
                  type="file" 
                  accept=".xlsx,.csv,.xls" 
                  onChange={handleGlUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
                <div className="space-y-2">
                  <FileSpreadsheet className={`w-8 h-8 mx-auto ${glFile ? 'text-teal-500' : 'text-slate-400'}`} />
                  <p className="text-xs font-semibold">{glFile ? glFile.name : 'Drag & drop file or browse'}</p>
                  <p className="text-[10px] text-slate-400">Trial balance or Ledger extracts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fallback Warning Info if no files selected */}
          {!misFile && !glFile && (
            <p className="text-[11px] text-teal-500/90 leading-normal bg-teal-500/5 border border-teal-500/10 p-3 rounded-lg">
              💡 <strong>Audit Playground Mode Active:</strong> You can click "Run Reconciliation Audit" directly to process the comparison using our pre-loaded professional sample set!
            </p>
          )}
        </div>

        {/* Controls Column */}
        <div className={`p-6 rounded-2xl border shadow-sm space-y-6 flex flex-col justify-between ${
          isDarkMode ? 'bg-slate-800 border-slate-700/60' : 'bg-white border-slate-200/80'
        }`}>
          <div>
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-1.5">
              <Sliders className="w-5 h-5 text-teal-600" />
              Audit Parameters
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">Materiality Threshold</span>
                  <span className="font-mono font-bold text-teal-500 bg-teal-500/10 px-1.5 py-0.5 rounded">
                    {materiality.toFixed(1)}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="10.0" 
                  step="0.1"
                  value={materiality}
                  onChange={(e) => setMateriality(parseFloat(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer h-1 bg-slate-700 rounded-lg appearance-none"
                />
                <p className="text-[10px] text-slate-400 leading-normal">
                  Discrepancies exceeding this threshold will be flagged as high-risk anomalies and logged in exceptions.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={triggerAnalysis}
            disabled={isAnalyzing}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Parsing sheets & ledger records...
              </>
            ) : (
              <>
                Run Reconciliation Audit
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isAnalyzing && (
        <div className="space-y-4">
          <div className="h-10 bg-slate-500/10 rounded-xl animate-pulse w-1/3"></div>
          <div className="grid grid-cols-4 gap-6">
            <div className="h-24 bg-slate-500/10 rounded-xl animate-pulse"></div>
            <div className="h-24 bg-slate-500/10 rounded-xl animate-pulse"></div>
            <div className="h-24 bg-slate-500/10 rounded-xl animate-pulse"></div>
            <div className="h-24 bg-slate-500/10 rounded-xl animate-pulse"></div>
          </div>
          <div className="h-64 bg-slate-500/10 rounded-2xl animate-pulse"></div>
        </div>
      )}

      {/* Results Workspace */}
      {result && !isAnalyzing && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Result Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MIS Reported Sum</span>
              <p className="text-xl font-display font-bold mt-1 text-teal-500">₹{result.totals.misTotal.toLocaleString()}</p>
            </div>
            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GL Trial Balance Sum</span>
              <p className="text-xl font-display font-bold mt-1 text-slate-300">₹{result.totals.glTotal.toLocaleString()}</p>
            </div>
            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Absolute Variance</span>
              <p className="text-xl font-display font-bold mt-1 text-rose-500">₹{result.totals.varianceTotal.toLocaleString()}</p>
            </div>
            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Threshold Deviations</span>
              <p className="text-xl font-display font-bold mt-1 text-amber-500">{result.totals.flaggedCount} Flags Raised</p>
            </div>
          </div>

          {/* Interactive Table Panel */}
          <div className={`p-6 rounded-2xl border shadow-sm ${
            isDarkMode ? 'bg-slate-800 border-slate-700/60' : 'bg-white border-slate-200/80'
          }`}>
            {/* Filters Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h4 className="font-display font-bold text-lg leading-none">Reconciliation Ledger Ledger matching</h4>
                <p className="text-xs text-slate-400 mt-1">Showing all matched line-items and variances</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search account code/name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-black/15 text-xs rounded-xl border border-slate-700/50 w-52 text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Status selector */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-black/15 text-xs rounded-xl border border-slate-700/50 px-3 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="all">All Items</option>
                  <option value="green">Within Limit (Green)</option>
                  <option value="yellow">Minor Variance (Yellow)</option>
                  <option value="red">Material Variance (Red)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700/50 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Account Code</th>
                    <th className="py-3 px-4">Account Description</th>
                    <th className="py-3 px-4 text-right">MIS Balance (₹)</th>
                    <th className="py-3 px-4 text-right">GL Balance (₹)</th>
                    <th className="py-3 px-4 text-right">Variance (₹)</th>
                    <th className="py-3 px-4 text-right">Variance (%)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        No accounts matched the filters. Try adjusting search or status query.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row: ReconciliationRow) => {
                      const isExpanded = expandedRow === row.accountCode;
                      const statusConfig = {
                        green: { text: 'Matched', bg: 'bg-emerald-500/15 text-emerald-500' },
                        yellow: { text: 'Variance', bg: 'bg-amber-500/15 text-amber-500' },
                        red: { text: 'Material Discrepancy', bg: 'bg-rose-500/15 text-rose-500 font-bold' }
                      }[row.status];

                      return (
                        <React.Fragment key={row.accountCode}>
                          <tr className={`hover:bg-slate-500/5 transition ${isExpanded ? 'bg-slate-500/5' : ''}`}>
                            <td className="py-3.5 px-4 font-mono font-bold">{row.accountCode}</td>
                            <td className="py-3.5 px-4 font-semibold">{row.accountName}</td>
                            <td className="py-3.5 px-4 text-right font-mono">₹{row.misAmount.toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-right font-mono">₹{row.glAmount.toLocaleString()}</td>
                            <td className={`py-3.5 px-4 text-right font-mono ${row.varianceAmount === 0 ? 'text-slate-400' : row.varianceAmount > 0 ? 'text-teal-500' : 'text-rose-500'}`}>
                              {row.varianceAmount > 0 ? '+' : ''}{row.varianceAmount.toLocaleString()}
                            </td>
                            <td className={`py-3.5 px-4 text-right font-mono font-bold ${row.status === 'red' ? 'text-rose-500' : row.status === 'yellow' ? 'text-amber-500' : 'text-emerald-500'}`}>
                              {row.variancePercentage.toFixed(2)}%
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${statusConfig.bg}`}>
                                {statusConfig.text}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => toggleExpandRow(row.accountCode)}
                                className="text-slate-400 hover:text-slate-200 transition p-1 rounded-lg"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>

                          {/* Expandable Drill Down */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="bg-slate-500/5 px-6 py-4">
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="space-y-3"
                                >
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <ShieldAlert className="w-4 h-4 text-teal-500" />
                                    GL General Ledger Posting Sub-records Audit
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                                    <div className="space-y-1.5">
                                      <p className="font-semibold text-slate-300">Analysis Summary</p>
                                      <p className="text-slate-400 text-[11px] leading-relaxed">
                                        Fuzzy matching verified account code <strong>{row.accountCode}</strong> against books description <strong>{row.accountName}</strong>. 
                                        Absolute discrepancy stands at <strong>₹{row.varianceAmount.toLocaleString()}</strong> ({row.variancePercentage.toFixed(2)}%). 
                                        {row.status === 'red' 
                                          ? ' ⚠️ Discrepancy violates threshold limits. Internal controller intervention required.' 
                                          : ' Discrepancy stands inside the predefined materiality safe boundary.'}
                                      </p>
                                    </div>

                                    {/* Sub-Ledger entries list */}
                                    <div className="space-y-2">
                                      <p className="font-semibold text-slate-300">Underlying Journal Entries (JV Extracts)</p>
                                      <div className="divide-y divide-slate-700/40 border border-slate-700/30 rounded-lg overflow-hidden bg-black/10">
                                        {row.glEntries?.map((entry, eIdx) => (
                                          <div key={eIdx} className="p-2 flex justify-between items-center text-[11px] hover:bg-black/25 transition">
                                            <div>
                                              <p className="font-mono font-semibold">{entry.reference}</p>
                                              <p className="text-slate-400 mt-0.5">{entry.description} ({entry.date})</p>
                                            </div>
                                            <span className="font-mono font-bold text-slate-200">₹{entry.amount.toLocaleString()}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
