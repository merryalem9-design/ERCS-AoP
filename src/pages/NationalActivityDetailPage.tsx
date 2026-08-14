import React from 'react';
import { useApp } from '../context/AppContext';
import {
  sumTarget, sumBudget, sumActual, sumExpenditure, achievementPct, budgetUtilizationPct, convertToBeneficiaries,
} from '../utils/calculations';
import { PlanEntry } from '../types';
import { ArrowLeft, Layers, Building2, FolderGit2, Plus, Target, Wallet, Users } from 'lucide-react';

export const NationalActivityDetailPage: React.FC = () => {
  const {
    selectedNationalActivityId, setActiveRoute, setFilters,
    strategicPriorities, nationalActivities, regions, zones, projects,
    planEntries, quarterlyActuals, uomConfigs,
  } = useApp();

  const na = nationalActivities.find(n => n.id === selectedNationalActivityId) || nationalActivities[0];

  if (!na) {
    return (
      <div className="bg-white p-8 rounded-xl border text-center text-xs text-slate-500">
        No National Activity selected. Go back to the Plan page and choose one.
      </div>
    );
  }

  const sp = strategicPriorities.find(s => s.id === na.strategic_priority_id);
  const naRegion = regions.find(r => r.id === na.region_id);
  const naZone = zones.find(z => z.id === na.zone_id);

  // The full set of children currently linked to this National Activity via
  // national_activity_id. Every figure below is derived fresh from this list
  // and quarterlyActuals — so the moment a Plan Entry or Actual changes
  // anywhere in the app, these numbers update on next render, live.
  const children = planEntries.filter(pe => pe.national_activity_id === na.id);
  const regionalChildren = children.filter(c => c.scope_type === 'Regional');
  const projectChildren = children.filter(c => c.scope_type === 'Project');

  const target = sumTarget(children);
  const actual = sumActual(children, quarterlyActuals);
  const pct = achievementPct(actual, target);
  const budget = sumBudget(children);
  const spent = sumExpenditure(children, quarterlyActuals);
  const util = budgetUtilizationPct(spent, budget);
  const beneficiaries = children.reduce(
    (sum, c) => sum + convertToBeneficiaries(sumActual([c], quarterlyActuals), na.uom, uomConfigs),
    0
  );

  // Clicking a linked entry jumps to Quarterly Entry, pre-filtered down to
  // just that Region/Project under this National Activity, so the person
  // lands exactly on the data they came here to edit.
  const goToChild = (pe: PlanEntry) => {
    setFilters(prev => ({
      ...prev,
      strategicPriorityId: 'ALL',
      nationalActivityId: na.id,
      regionId: pe.scope_type === 'Regional' ? (pe.region_id || 'ALL') : 'ALL',
      projectId: pe.scope_type === 'Project' ? (pe.project_id || 'ALL') : 'ALL',
    }));
    setActiveRoute('quarterly');
  };

  // "+ Add Plan Entry" here hands off to the Plan page's existing Add flow,
  // pre-filtered to this National Activity so the new entry is linked
  // automatically — same mechanism the Plan page already uses.
  const addLinkedEntry = () => {
    setFilters(prev => ({ ...prev, nationalActivityId: na.id }));
    setActiveRoute('plan');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setActiveRoute('plan')} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-ercs-red">
          <ArrowLeft className="w-4 h-4" /> Back to Plan
        </button>
        <button onClick={addLinkedEntry} className="flex items-center gap-1.5 bg-ercs-red text-white px-3 py-1.5 rounded-lg text-xs font-bold">
          <Plus className="w-3.5 h-3.5" /> Add Plan Entry
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {sp && <span className="bg-slate-800 text-white text-xs font-extrabold px-2 py-0.5 rounded">{sp.code}</span>}
          <span className="bg-ercs-red text-white text-xs font-extrabold px-2 py-0.5 rounded">{na.code}</span>
          <span className="text-xs text-slate-500 font-bold uppercase">{na.uom}</span>
          {na.responsibility && (
            <span className="bg-slate-100 text-slate-600 text-xs font-extrabold px-2 py-0.5 rounded border border-slate-200">{na.responsibility}</span>
          )}
          {(naRegion || naZone) && (
            <span className="bg-blue-50 text-blue-700 text-xs font-extrabold px-2 py-0.5 rounded">
              {[naRegion?.name, naZone?.name].filter(Boolean).join(' / ')}
            </span>
          )}
        </div>
        <h2 className="text-xl font-black text-slate-800">{na.description}</h2>
        {sp && <div className="text-xs text-slate-400 font-semibold">{sp.name} · {sp.objective}</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <div className="flex justify-between mb-1 text-xs font-bold text-slate-500"><span>Target vs Actual</span><Target className="w-4 h-4" /></div>
          <div className="text-2xl font-black mt-1">{pct.toFixed(1)}%</div>
          <div className="text-xs text-slate-500 mt-1">Tgt: <b>{target.toLocaleString()}</b> | Act: <b>{actual.toLocaleString()}</b> {na.uom}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <div className="flex justify-between mb-1 text-xs font-bold text-slate-500"><span>Budget Utilization</span><Wallet className="w-4 h-4" /></div>
          <div className="text-2xl font-black mt-1">{util.toFixed(1)}%</div>
          <div className="text-xs text-slate-500 mt-1">Spent: <b>ETB {spent.toLocaleString()}</b> / <b>ETB {budget.toLocaleString()}</b></div>
        </div>
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <div className="flex justify-between mb-1 text-xs font-bold text-slate-500"><span>Contributing Entries</span><Layers className="w-4 h-4" /></div>
          <div className="text-2xl font-black mt-1">{children.length}</div>
          <div className="text-xs text-slate-500 mt-1">{regionalChildren.length} Regional | {projectChildren.length} Project</div>
        </div>
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <div className="flex justify-between mb-1 text-xs font-bold text-slate-500"><span>Beneficiaries</span><Users className="w-4 h-4" /></div>
          <div className="text-2xl font-black mt-1">{beneficiaries.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">People reached</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <Layers className="w-4 h-4 text-ercs-red" /><span>Linked Plan Entries</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs uppercase pb-2 border-b">
              <Building2 className="w-4 h-4 text-ercs-red" /><span>Regional ({regionalChildren.length})</span>
            </div>
            <div className="space-y-2">
              {regionalChildren.map(pe => {
                const reg = regions.find(r => r.id === pe.region_id);
                const cAct = sumActual([pe], quarterlyActuals);
                return (
                  <button
                    key={pe.id}
                    onClick={() => goToChild(pe)}
                    className="w-full bg-white p-3 rounded-lg border shadow-sm flex justify-between text-xs text-left hover:border-ercs-red transition-colors"
                  >
                    <div><div className="font-bold">{reg?.name || '—'}</div><div className="text-[10px] text-slate-500">{na.code}</div></div>
                    <div className="text-right font-extrabold">{cAct.toLocaleString()} / {pe.annual_target.toLocaleString()}</div>
                  </button>
                );
              })}
              {regionalChildren.length === 0 && <div className="text-xs text-slate-400 text-center py-3">No regional entries linked.</div>}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs uppercase pb-2 border-b">
              <FolderGit2 className="w-4 h-4 text-blue-600" /><span>Project ({projectChildren.length})</span>
            </div>
            <div className="space-y-2">
              {projectChildren.map(pe => {
                const prj = projects.find(p => p.id === pe.project_id);
                const cAct = sumActual([pe], quarterlyActuals);
                return (
                  <button
                    key={pe.id}
                    onClick={() => goToChild(pe)}
                    className="w-full bg-white p-3 rounded-lg border shadow-sm flex justify-between text-xs text-left hover:border-blue-500 transition-colors"
                  >
                    <div><div className="font-bold text-blue-800">{prj?.name || '—'}</div><div className="text-[10px] text-slate-500">{na.code}</div></div>
                    <div className="text-right font-extrabold">{cAct.toLocaleString()} / {pe.annual_target.toLocaleString()}</div>
                  </button>
                );
              })}
              {projectChildren.length === 0 && <div className="text-xs text-slate-400 text-center py-3">No project entries linked.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};