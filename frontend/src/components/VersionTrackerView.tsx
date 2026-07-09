import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  ArrowRight,
  GitCommit,
  CheckCircle,
  AlertTriangle,
  History,
  FileCode
} from 'lucide-react';
import { motion } from 'motion/react';
import { Report } from '../types.js';

interface VersionTrackerViewProps {
  reports: Report[];
  isDarkMode: boolean;
  onAddToast: (text: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function VersionTrackerView({
  reports,
  isDarkMode,
  onAddToast
}: VersionTrackerViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReports = reports.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.uploaded_by_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="font-display font-bold text-3xl tracking-tight">Submission & Version Tracker</h2>
        <p className="text-sm text-slate-400 mt-1">
          Monitor periodic MIS sheet filing timeliness and track file checksum hashes to detect retrospectively altered figures.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Ledger Registry table */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm ${
          isDarkMode ? 'bg-slate-800 border-slate-700/60' : 'bg-white border-slate-200/80'
        }`}>
          {/* Header filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-display font-bold text-lg leading-none">Periodic Filing Registry</h3>
              <p className="text-xs text-slate-400 mt-1">Registry of all uploaded MIS reports and structural revisions.</p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search report names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-black/15 text-xs rounded-xl border border-slate-700/50 w-52 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700/50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Report Name</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Expected Date</th>
                  <th className="py-3 px-4">Uploaded Date</th>
                  <th className="py-3 px-4">Filer</th>
                  <th className="py-3 px-4 text-center">Timeliness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No reports logged in registry. Upload reports via core modules to seed logs.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-500/5 transition">
                      <td className="py-3 px-4 font-semibold">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-teal-500" />
                          {rep.name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full text-[10px]">
                          v{rep.version}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(rep.expected_submission_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {new Date(rep.actual_submission_date).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{rep.uploaded_by_email}</td>
                      <td className="py-3 px-4 text-center">
                        {rep.is_late ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Late Submission
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" /> On Time
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Change Ledger Timeline / Cryptographic check */}
        <div className="space-y-6">
          
          {/* File Integrity check (hashes) */}
          <div className={`p-6 rounded-2xl border shadow-sm ${
            isDarkMode ? 'bg-slate-800 border-slate-700/60' : 'bg-white border-slate-200/80'
          }`}>
            <h3 className="font-display font-bold text-lg mb-1 flex items-center gap-1.5 leading-none text-teal-600">
              <ShieldCheck className="w-5 h-5 text-teal-500" />
              Cryptographic Tamper Shield
            </h3>
            <p className="text-xs text-slate-400 leading-normal mb-4">
              Our backend automatically hashes each MIS spreadsheet on upload. If files are retrospecitvely modified, the hash mismatch is flagged.
            </p>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {reports.map((rep) => (
                <div key={rep.id} className="p-3 bg-black/15 border border-slate-700/40 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-slate-200 truncate">{rep.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    SHA-256 Checksum:
                  </p>
                  <p className="font-mono text-[9px] text-teal-500 select-all bg-black/30 p-1 rounded truncate leading-none">
                    {rep.file_hash}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Changelog Timeline */}
          <div className={`p-6 rounded-2xl border shadow-sm ${
            isDarkMode ? 'bg-slate-800 border-slate-700/60' : 'bg-white border-slate-200/80'
          }`}>
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-1.5 leading-none">
              <History className="w-5 h-5 text-teal-600" />
              Revision Changelog
            </h3>
            
            <div className="space-y-4 relative border-l-2 border-slate-700/40 ml-3.5 pl-5 pt-1">
              {reports.map((rep, idx) => (
                <div key={rep.id} className="relative text-xs space-y-1">
                  {/* Timeline dot */}
                  <div className="absolute -left-[27.5px] top-1 bg-slate-900 border-2 border-teal-500 rounded-full p-0.5 flex items-center justify-center z-10">
                    <GitCommit className="w-3.5 h-3.5 text-teal-500" />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                    <span>{new Date(rep.actual_submission_date).toLocaleDateString()}</span>
                    <span>Version v{rep.version}</span>
                  </div>
                  <h4 className="font-bold text-slate-200 leading-tight">
                    Filing submitted: <span className="text-teal-400">{rep.name}</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Uploaded by {rep.uploaded_by_email}. File size: {(rep.file_size / 1024).toFixed(1)} KB.
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
