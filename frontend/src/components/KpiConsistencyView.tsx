import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  LineChart as ChartIcon, 
  FileSpreadsheet, 
  HelpCircle, 
  PlusCircle, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles,
  RefreshCw,
  FolderOpen,
  Edit2,
  Loader2
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { KpiDefinition } from '../types.js';

interface KpiConsistencyViewProps {
  kpis: KpiDefinition[];
  onAddKpi: (kpi: Omit<KpiDefinition, 'id' | 'created_at'>) => Promise<void>;
  onDeleteKpi: (id: string) => Promise<void>;
  onCheckConsistency: (files: File[], periods: string[]) => Promise<any>;
  isDarkMode: boolean;
  onAddToast: (text: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function KpiConsistencyView({
  kpis,
  onAddKpi,
  onDeleteKpi,
  onCheckConsistency,
  isDarkMode,
  onAddToast
}: KpiConsistencyViewProps) {
  // States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKpi, setNewKpi] = useState({
    name: '',
    description: '',
    formula_definition: '',
    expected_sheet_name: 'Financial Summary',
    cell_reference: 'C12',
    materiality_threshold: 2.0
  });

  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026']);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [activeChartKpi, setActiveChartKpi] = useState<string>('Gross Profit Margin');

  const handleAddKpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKpi.name || !newKpi.formula_definition) {
      onAddToast('Name and Formula Definition are mandatory.', 'error');
      return;
    }
    try {
      await onAddKpi(newKpi);
      onAddToast(`KPI "${newKpi.name}" added to dictionary.`, 'success');
      setShowAddForm(false);
      setNewKpi({
        name: '',
        description: '',
        formula_definition: '',
        expected_sheet_name: 'Financial Summary',
        cell_reference: 'C12',
        materiality_threshold: 2.0
      });
    } catch (err) {
      onAddToast('Failed to add KPI to dictionary.', 'error');
    }
  };

  const handleDeleteKpi = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from the monitored dictionary?`)) {
      try {
        await onDeleteKpi(id);
        onAddToast(`KPI "${name}" removed from dictionary.`, 'success');
      } catch (err) {
        onAddToast('Error deleting KPI.', 'error');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setFilesToUpload(filesArr);
      onAddToast(`${filesArr.length} period sheets imported.`, 'info');
    }
  };

  const runKpiCheck = async () => {
    setIsProcessing(true);
    setResults(null);
    try {
      // Trigger consistency endpoint (sends empty file array if none provided to trigger pre-seeded analysis)
      const res = await onCheckConsistency(filesToUpload, selectedPeriods);
      setResults(res.kpis);
      onAddToast('Multi-period consistency trend calculated!', 'success');
      
      const hasMismatch = res.kpis.some((k: any) => k.formula_inconsistency);
      if (hasMismatch) {
        onAddToast('Formula pattern shifts detected across quarterly filings!', 'warning');
      }
    } catch (err) {
      onAddToast('Error running consistency checker. Falling back to pre-seeded trends.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Find KPI to display in chart
  const currentChartData = results?.find((k: any) => k.name === activeChartKpi);
  const chartPoints = currentChartData 
    ? currentChartData.values.map((v: any) => ({
        period: v.period,
        [activeChartKpi]: v.value
      }))
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display font-bold text-3xl tracking-tight">KPI Consistency Checker</h2>
          <p className="text-sm text-slate-400 mt-1">
            Audit standard corporate KPI trends across multiple periods and detect unauthorized edits to underlying spreadsheet formula templates.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          Add KPI Definition
        </button>
      </div>

      {/* Add KPI Modal */}
      {showAddForm && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-6 rounded-2xl border shadow-lg space-y-4 max-w-xl ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex justify-between items-center border-b border-slate-700/30 pb-3">
            <h3 className="font-display font-bold text-md text-teal-500">Configure New KPI Target</h3>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-200 text-xs font-bold">Close</button>
          </div>
          <form onSubmit={handleAddKpiSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-slate-400 font-semibold block">KPI Metric Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., Gross Profit Margin" 
                  value={newKpi.name}
                  onChange={(e) => setNewKpi({ ...newKpi, name: e.target.value })}
                  className="w-full p-2.5 bg-black/15 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-slate-400 font-semibold block">Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Ratio representing operating gross profitability" 
                  value={newKpi.description}
                  onChange={(e) => setNewKpi({ ...newKpi, description: e.target.value })}
                  className="w-full p-2.5 bg-black/15 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-slate-400 font-semibold block">Standard Formula Definition (Text Reference)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Operating Profit / Revenue" 
                  value={newKpi.formula_definition}
                  onChange={(e) => setNewKpi({ ...newKpi, formula_definition: e.target.value })}
                  className="w-full p-2.5 bg-black/15 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Expected Sheet Name</label>
                <input 
                  type="text" 
                  value={newKpi.expected_sheet_name}
                  onChange={(e) => setNewKpi({ ...newKpi, expected_sheet_name: e.target.value })}
                  className="w-full p-2.5 bg-black/15 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Cell Reference</label>
                <input 
                  type="text" 
                  placeholder="e.g. C15" 
                  value={newKpi.cell_reference}
                  onChange={(e) => setNewKpi({ ...newKpi, cell_reference: e.target.value })}
                  className="w-full p-2.5 bg-black/15 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">Materiality Alert Threshold (%)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={newKpi.materiality_threshold}
                  onChange={(e) => setNewKpi({ ...newKpi, materiality_threshold: parseFloat(e.target.value) })}
                  className="w-full p-2.5 bg-black/15 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-700/30">
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md"
              >
                Save Definition
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: KPI Dictionary list */}
        <div className={`p-6 rounded-2xl border shadow-sm ${
          isDarkMode ? 'bg-slate-800 border-slate-700/60' : 'bg-white border-slate-200/80'
        }`}>
          <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-teal-600" />
            Active KPI Dictionary
          </h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            These definitions represent standard company formulas locked under financial controls monitoring.
          </p>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {kpis.map((k) => (
              <div 
                key={k.id}
                className={`p-3.5 rounded-xl border flex justify-between items-start text-xs transition ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <p className="font-bold text-slate-200">{k.name}</p>
                  <p className="text-slate-400 text-[10px]">{k.description}</p>
                  <p className="font-mono text-teal-500 text-[10px] mt-1.5 bg-teal-500/5 px-1.5 py-0.5 rounded inline-block">
                    Locked cell: {k.expected_sheet_name}!{k.cell_reference || 'Row Name Match'}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteKpi(k.id, k.name)}
                  className="text-slate-500 hover:text-rose-500 p-1 rounded-lg transition"
                  title="Delete definition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Trend Sheets Submission Trigger */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm space-y-6 ${
          isDarkMode ? 'bg-slate-800 border-slate-700/60' : 'bg-white border-slate-200/80'
        }`}>
          <h3 className="font-display font-bold text-lg">Periodic Trend analysis</h3>
          <p className="text-xs text-slate-400 leading-normal">
            Upload sheets corresponding to consecutive financial periods to parse and aggregate locked KPIs, auditing formula cells along the timeline.
          </p>

          <div className="border-2 border-dashed border-slate-700/50 rounded-xl p-8 text-center relative hover:border-teal-500 transition">
            <input 
              type="file" 
              multiple 
              accept=".xlsx,.csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            />
            <div className="space-y-3">
              <FolderOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold">{filesToUpload.length > 0 ? `${filesToUpload.length} file(s) loaded` : 'Upload Multiple periodic MIS files'}</p>
              <p className="text-[10px] text-slate-400">Drag & drop files or click to upload</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Selected Periods Mapping:
            {selectedPeriods.map((p, idx) => (
              <span key={idx} className="bg-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono">
                {idx + 1}: {p}
              </span>
            ))}
          </div>

          <button
            onClick={runKpiCheck}
            disabled={isProcessing}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Running consistency checks across reports...
              </>
            ) : (
              'Execute Multi-Period Consistency Check'
            )}
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {isProcessing && (
        <div className="h-64 bg-slate-500/10 rounded-2xl animate-pulse flex items-center justify-center">
          <LoaderSpinner />
        </div>
      )}

      {/* Visual Workspace Trends */}
      {results && !isProcessing && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Chart Panel */}
          <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm space-y-4 ${
            isDarkMode ? 'bg-slate-800 border-slate-700/60' : 'bg-white border-slate-200/80'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-display font-bold text-lg leading-none">KPI Trend Chart</h4>
                <p className="text-xs text-slate-400 mt-1">Multi-period compiled value charting</p>
              </div>

              <div className="flex gap-2">
                {results.map((k: any) => (
                  <button
                    key={k.name}
                    onClick={() => setActiveChartKpi(k.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeChartKpi === k.name 
                        ? 'bg-teal-600 text-white' 
                        : 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20'
                    }`}
                  >
                    {k.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts container */}
            <div className="h-72 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartPoints} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#33415550" />
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderRadius: '12px', 
                      border: '1px solid #334155',
                      fontSize: '11px',
                      color: '#f8fafc'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line 
                    type="monotone" 
                    dataKey={activeChartKpi} 
                    stroke="#0d9488" 
                    strokeWidth={3} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Audit Verification Checklist */}
          <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${
            isDarkMode ? 'bg-slate-800 border-slate-700/60' : 'bg-white border-slate-200/80'
          }`}>
            <h4 className="font-display font-bold text-lg leading-none">Formula Compliance Audit</h4>
            <p className="text-xs text-slate-400 leading-normal mb-2">
              Verifies if underlying sheet formulas have been altered or manipulated across different filings.
            </p>

            <div className="space-y-4 overflow-y-auto max-h-[300px]">
              {results.map((kpi: any) => (
                <div key={kpi.name} className="p-3 rounded-xl bg-black/15 border border-slate-700/40 text-xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="font-bold">{kpi.name}</p>
                    {kpi.formula_inconsistency ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3" /> Formula Mismatch
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                        <CheckCircle className="w-3 h-3" /> Consistent
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-700/30">
                    {kpi.extracted_formulas.map((f: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-0.5">
                        <span>{f.period}:</span>
                        <span className={`${kpi.formula_inconsistency && f.formula.includes('-') ? 'text-rose-500 font-bold' : 'text-slate-300'}`}>
                          {f.formula}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function LoaderSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      <span className="text-xs font-semibold text-slate-400">Verifying periodic alignments...</span>
    </div>
  );
}
