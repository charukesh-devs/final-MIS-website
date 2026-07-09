import React from 'react';
import { 
  LayoutDashboard, 
  RefreshCcw, 
  LineChart, 
  Code2, 
  AlertTriangle, 
  Clock, 
  LogOut, 
  ShieldCheck, 
  Database,
  Sun,
  Moon
} from 'lucide-react';
import { User } from '../types.js';

interface SidebarProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  databaseMode: string;
}

export default function Sidebar({
  currentTab,
  onChangeTab,
  user,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
  databaseMode
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Controls Monitor', icon: LayoutDashboard },
    { id: 'reconciliation', label: 'MIS Reconciliation', icon: RefreshCcw },
    { id: 'kpis', label: 'KPI Consistency', icon: LineChart },
    { id: 'formula_audit', label: 'Formula Audit', icon: Code2 },
    { id: 'override_detector', label: 'Override Detector', icon: AlertTriangle },
    { id: 'version_tracker', label: 'Submission Tracker', icon: Clock },
  ];

  const isSandbox = databaseMode.toLowerCase().includes('sandbox');

  return (
    <aside className={`w-64 border-r flex flex-col shrink-0 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
      {/* Brand Header */}
      <div className="p-6 border-b flex items-center gap-3 border-inherit">
        <div className="bg-teal-600 text-white p-2.5 rounded-xl shadow-md flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg tracking-tight leading-none text-teal-600">MIS AUDIT</h1>
          <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">CONTROLS HUB</span>
        </div>
      </div>

      {/* User Card */}
      {user && (
        <div className="p-4 border-b border-inherit mx-2 my-4 rounded-xl bg-slate-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-display font-bold flex items-center justify-center text-sm">
              {user.name.substring(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate leading-tight">{user.name}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
              user.role === 'reviewer' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-teal-500/10 text-teal-500'
            }`}>
              {user.role} ROLE
            </span>
            <button 
              onClick={onLogout} 
              className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                isActive 
                  ? 'bg-teal-500/10 text-teal-500 border-l-4 border-teal-500 font-semibold' 
                  : 'text-slate-400 hover:bg-slate-500/5 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-500' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Database Mode Status */}
      <div className="p-4 border-t border-inherit">
        <div className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
          isSandbox 
            ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' 
            : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <Database className="w-3.5 h-3.5" />
            Database Mode
          </div>
          <p className="text-[11px] font-semibold truncate leading-none">
            {databaseMode}
          </p>
          <p className="text-[10px] text-slate-400 leading-tight">
            {isSandbox 
              ? 'Local playground database. Input your keys in .env for production DB.' 
              : 'Connected directly to your cloud Supabase cluster.'}
          </p>
        </div>
      </div>

      {/* Footer & Mode Toggle */}
      <div className="p-4 border-t border-inherit flex items-center justify-between text-xs text-slate-400">
        <span>v1.0.0 (SECURE)</span>
        <button
          onClick={onToggleDarkMode}
          className="p-1.5 rounded-lg border border-inherit hover:bg-slate-500/10 text-slate-400 hover:text-slate-200 transition"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
