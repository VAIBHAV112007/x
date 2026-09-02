import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Compass, Radio, FileText, Activity, Server, Wind } from 'lucide-react';

export default function Navigation() {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/drift', label: 'Drift Prediction', icon: Wind },
    { to: '/missions', label: 'Bathymetry', icon: Compass },
    { to: '/reports', label: 'Inspection Reports', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 shadow-xl z-20">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-8 border-b border-slate-800/50">
          <div className="p-1 bg-white rounded-lg shadow-md flex items-center justify-center">
            <img src="/logo.png" alt="SagarDrishti Logo" className="w-12 h-12 object-contain mix-blend-multiply" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-tight">SagarDrishti</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">NAV-TECH</p>
          </div>
        </div>

        {/* Links */}
        <nav className="flex flex-col gap-1.5 px-4 pt-6">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Main Menu</p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* System Status Pill */}
      <div className="p-6 border-t border-slate-800/50">
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">System Status</p>
          <div className="flex flex-col gap-2.5 text-[11px] font-medium">
            <div className="flex items-center justify-between group cursor-default">
              <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-300 transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                Sonar Engine
              </div>
              <span className="text-emerald-400">Online</span>
            </div>
            <div className="flex items-center justify-between group cursor-default">
              <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-300 transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                AI Inference
              </div>
              <span className="text-emerald-400">Ready</span>
            </div>
            <div className="flex items-center justify-between group cursor-default">
              <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-300 transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                FastAPI
              </div>
              <span className="text-blue-400">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}