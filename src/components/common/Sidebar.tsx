import React from 'react';
import { useApp } from '../../context/AppContext';
import { ClipboardList, CalendarClock, CalendarCheck2, BarChart3, ShieldCheck } from 'lucide-react';

const BASE_NAV = [
  { id: 'plan', label: 'Plan', sub: 'Annual plan data entry', icon: ClipboardList },
  { id: 'quarterly-plan', label: 'Quarterly Plan', sub: 'Split targets into Q1–Q4', icon: CalendarClock },
  { id: 'quarterly', label: 'Quarterly Actual Entry', sub: 'Actuals vs quarterly plan', icon: CalendarCheck2 },
  { id: 'report', label: 'Report', sub: 'Aggregated results', icon: BarChart3 },
];

export const Sidebar: React.FC = () => {
  const { activeRoute, setActiveRoute, currentRole } = useApp();
  const nav = currentRole === 'National Activity AOP'
    ? [
        BASE_NAV[0],
        { id: 'pending-approval', label: 'Pending Approval', sub: 'Review submitted proposals', icon: ShieldCheck },
        BASE_NAV[3],
      ]
    : BASE_NAV;

  const roleHint = currentRole === 'National Activity AOP'
    ? 'Create National Activities, review coordinator submissions, and approve or reject proposals.'
    : currentRole === 'Regional Coordinator'
      ? 'Create Regional plan entries, submit them for approval, then complete their quarterly plan and actuals.'
      : 'Create Project plan entries, submit them for approval, then complete their quarterly plan and actuals.';

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <img src="/ercs-logo.png" alt="Ethiopian Red Cross Society" className="w-11 h-11 rounded-full object-contain bg-white shrink-0 shadow-md p-0.5" />
        <div>
          <div className="font-extrabold text-white text-sm tracking-wider uppercase">ERCS AoP</div>
          <div className="text-[10px] text-slate-400 font-medium">Prototype Stage</div>
        </div>
      </div>

      <div className="mx-3 my-3 p-2.5 rounded bg-slate-800/80 border border-slate-700/50 text-[10px] text-slate-400 leading-relaxed">
        <b className="text-white">{currentRole}</b><br />{roleHint}
      </div>

      <nav className="flex-1 px-2 py-2 space-y-1 text-xs font-medium overflow-y-auto">
        {nav.map(({ id, label, sub, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveRoute(id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-left ${
              activeRoute === id ? 'bg-ercs-red text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <div>
              <div>{label}</div>
              <div className={`text-[10px] font-normal ${activeRoute === id ? 'text-red-100' : 'text-slate-500'}`}>{sub}</div>
            </div>
          </button>
        ))}
      </nav>
    </aside>
  );
};
