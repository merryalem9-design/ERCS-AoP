import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

const ROLES: UserRole[] = ['National Activity AOP', 'Regional Coordinator', 'Project Coordinator'];

export const Header: React.FC = () => {
  const { currentRole, setCurrentRole, setActiveRoute } = useApp();

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    setActiveRoute('plan');
  };

  return (
    <header className="bg-white border-b border-slate-200 min-h-16 px-6 py-2 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-sm">
      <h1 className="text-lg font-bold text-slate-800 tracking-tight whitespace-nowrap">
        ERCS AoP — Plan, Report &amp; Aggregation Prototype
      </h1>
      <div className="flex items-center gap-3">
        <div>
          <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Current Role</label>
          <select
            value={currentRole}
            onChange={e => handleRoleChange(e.target.value as UserRole)}
            className="text-[11px] font-bold border border-slate-200 rounded-lg bg-slate-50 px-2.5 py-1.5 text-slate-700"
          >
            {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
          </select>
        </div>
        <div className="text-[10px] font-extrabold uppercase px-2.5 py-1.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
          FY 2026
        </div>
      </div>
    </header>
  );
};
