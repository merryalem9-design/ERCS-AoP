import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <h1 className="text-lg font-bold text-slate-800 tracking-tight">
        ERCS AoP — Plan, Report &amp; Aggregation Prototype
      </h1>
      <div className="text-[10px] font-extrabold uppercase px-2.5 py-1.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
        FY 2026
      </div>
    </header>
  );
};
