// src/pages/QuarterlyEntryPage.tsx
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FilterBar } from '../components/common/FilterBar';
import { achievementPct, convertToBeneficiaries, sumActual } from '../utils/calculations';
import { PlanEntry, QuarterId } from '../types';
import { ArrowRight } from 'lucide-react';

export const QuarterlyEntryPage: React.FC = () => {
  const { nationalActivities, regions, projects, quarters, getFilteredPlanEntries } = useApp();
  const [quarter, setQuarter] = useState<QuarterId>('Q1');

  const entries = getFilteredPlanEntries();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800">Step 2 — Quarterly Report Data Entry</h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter the Actual value achieved this quarter for each plan entry. The Beneficiaries figure converts live as you type,
          and everything flows straight into the Report page.
        </p>
      </div>

      <FilterBar showQuarter={false} />

      <div className="bg-white p-1.5 rounded-lg border inline-flex gap-1">
        {quarters.map(q => (
          <button key={q.id} onClick={() => setQuarter(q.id)} className={`px-4 py-1.5 rounded text-xs font-bold ${quarter === q.id ? 'bg-ercs-red text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            {q.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {entries.map(pe => (
          <EntryRow
            key={pe.id}
            entry={pe}
            quarter={quarter}
            nationalActivityCode={nationalActivities.find(n => n.id === pe.national_activity_id)?.code || ''}
            uom={nationalActivities.find(n => n.id === pe.national_activity_id)?.uom || ''}
            scopeLabel={pe.scope_type === 'Regional' ? regions.find(r => r.id === pe.region_id)?.name : projects.find(p => p.id === pe.project_id)?.name}
          />
        ))}
        {entries.length === 0 && (
          <div className="bg-white p-8 rounded-xl border text-center text-xs text-slate-500">
            No plan entries match this filter. Go to the Plan page to add one first.
          </div>
        )}
      </div>
    </div>
  );
};

// Number inputs' min="0" is only a UI hint — the browser does not stop the
// value "-100" from being typed and committed. Without this clamp, a
// negative Actual or Expenditure flows straight into quarterlyActuals and
// from there into every downstream number in the app: cumulative
// achievement % here, Target vs Actual / Budget Utilization / Beneficiaries
// on the National Activity Detail page, and every KPI, chart and table on
// the Report page. Clamping here — the single place these values are
// written — is what guarantees they can never go negative anywhere else.
const clampNonNegative = (raw: string): number => {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const EntryRow: React.FC<{
  entry: PlanEntry; quarter: QuarterId; nationalActivityCode: string; uom: string; scopeLabel?: string;
}> = ({ entry, quarter, nationalActivityCode, uom, scopeLabel }) => {
  const { quarterlyActuals, upsertQuarterlyActual, uomConfigs } = useApp();
  const existing = quarterlyActuals.find(a => a.plan_entry_id === entry.id && a.quarter_id === quarter);
  const [actualVal, setActualVal] = useState<number>(existing?.actual ?? 0);
  const [expVal, setExpVal] = useState<number>(existing?.expenditure ?? 0);

  // Keep local inputs in sync if the underlying quarter/entry selection changes.
  React.useEffect(() => {
    setActualVal(existing?.actual ?? 0);
    setExpVal(existing?.expenditure ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id, quarter]);

  const sync = (nextActual: number, nextExp: number) => {
    upsertQuarterlyActual({ id: existing?.id || `qa-${entry.id}-${quarter}`, plan_entry_id: entry.id, quarter_id: quarter, actual: nextActual, expenditure: nextExp });
  };

  const handleActualChange = (raw: string) => {
    const v = clampNonNegative(raw);
    setActualVal(v);
    sync(v, expVal);
  };

  const handleExpChange = (raw: string) => {
    const v = clampNonNegative(raw);
    setExpVal(v);
    sync(actualVal, v);
  };

  // quarterlyActuals already reflects the latest edit: sync() above updates context
  // state in the same batched event, so this stays accurate on every keystroke.
  const cumulativeActual = sumActual([entry], quarterlyActuals);
  const cumulativeAchievement = achievementPct(cumulativeActual, entry.annual_target);
  const beneficiariesThisQuarter = convertToBeneficiaries(actualVal, uom, uomConfigs);

  return (
    <div className="bg-white p-5 rounded-xl border shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        <div>
          <span className="bg-ercs-red text-white text-[10px] font-extrabold px-2 py-0.5 rounded mr-2">{nationalActivityCode}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${entry.scope_type === 'Regional' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{entry.scope_type}</span>
          <span className="ml-2 text-xs font-bold text-slate-800">{scopeLabel}</span>
        </div>
        <div className="text-[10px] bg-slate-100 px-2 py-1 rounded font-semibold">Annual Target: {entry.annual_target.toLocaleString()} {uom}</div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">Actual this quarter ({uom})</label>
          <input type="number" min="0" value={actualVal} onChange={e => handleActualChange(e.target.value)} className="w-32 text-xs p-2 border rounded" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">Expenditure this quarter (ETB)</label>
          <input type="number" min="0" value={expVal} onChange={e => handleExpChange(e.target.value)} className="w-36 text-xs p-2 border rounded" />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-center">
            <div className="text-[9px] font-black uppercase tracking-wide text-blue-700">Conversion</div>
            <div className="text-xs font-bold text-blue-900">{actualVal} {uom} × factor</div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300" />
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-center min-w-24">
            <div className="text-[9px] font-black uppercase tracking-wide text-emerald-700">Beneficiaries (Q)</div>
            <div className="text-sm font-black text-emerald-900">{beneficiariesThisQuarter.toLocaleString()}</div>
          </div>
          <div className="rounded-lg bg-slate-50 border px-3 py-2 text-center min-w-24">
            <div className="text-[9px] font-black uppercase tracking-wide text-slate-500">Cumulative Ach.</div>
            <div className="text-sm font-black text-slate-800">{cumulativeAchievement.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};