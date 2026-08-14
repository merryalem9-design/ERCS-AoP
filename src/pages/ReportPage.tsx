import React from 'react';
import { useApp } from '../context/AppContext';
import { FilterBar } from '../components/common/FilterBar';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  sumTarget, sumBudget, sumActual, sumExpenditure, achievementPct, budgetUtilizationPct, convertToBeneficiaries, getStatusBadge,
} from '../utils/calculations';
import { Target, Wallet, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export const ReportPage: React.FC = () => {
  const { strategicPriorities, nationalActivities, regions, projects, quarterlyActuals, uomConfigs, filters, getFilteredPlanEntries } = useApp();

  const filteredEntries = getFilteredPlanEntries();
  const q = filters.quarterId;

  // Every National Activity can define its own UOM (Person, House Hold (HH), ...).
  // Summing raw Target/Actual across entries that don't share a UOM produces a
  // number with no real unit — this tells the Achievement card whether that's
  // happening in the current filter scope.
  const uomsInScope = Array.from(new Set(
    filteredEntries.map(e => nationalActivities.find(na => na.id === e.national_activity_id)?.uom).filter((u): u is string => !!u)
  ));
  const singleUom = uomsInScope.length === 1 ? uomsInScope[0] : null;

  const beneficiariesFor = (entryIds: typeof filteredEntries) => entryIds.reduce((sum, e) => {
    const na = nationalActivities.find(n => n.id === e.national_activity_id);
    const actual = sumActual([e], quarterlyActuals, q);
    return sum + convertToBeneficiaries(actual, na?.uom || '', uomConfigs);
  }, 0);

  const target = sumTarget(filteredEntries);
  const actual = sumActual(filteredEntries, quarterlyActuals, q);
  const achievement = achievementPct(actual, target);
  const budget = sumBudget(filteredEntries);
  const spent = sumExpenditure(filteredEntries, quarterlyActuals, q);
  const utilization = budgetUtilizationPct(spent, budget);
  const beneficiaries = beneficiariesFor(filteredEntries);

  // Breakdown by Strategic Priority (respects current National Activity/Region/Project filter).
  const byStrategy = strategicPriorities
    .map(sp => {
      const naIds = nationalActivities.filter(na => na.strategic_priority_id === sp.id).map(na => na.id);
      const es = filteredEntries.filter(e => naIds.includes(e.national_activity_id));
      if (es.length === 0) return null;
      const t = sumTarget(es), a = sumActual(es, quarterlyActuals, q), b = sumBudget(es), x = sumExpenditure(es, quarterlyActuals, q);
      return { key: sp.id, name: `${sp.code} — ${sp.name}`, target: t, actual: a, achievement: achievementPct(a, t), budget: b, spent: x, beneficiaries: beneficiariesFor(es) };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  // Breakdown by National Activity (respects current Strategic Priority/Region/Project filter).
  const byNational = nationalActivities
    .map(na => {
      const es = filteredEntries.filter(e => e.national_activity_id === na.id);
      if (es.length === 0) return null;
      const t = sumTarget(es), a = sumActual(es, quarterlyActuals, q), b = sumBudget(es), x = sumExpenditure(es, quarterlyActuals, q);
      return { key: na.id, name: na.code, uom: na.uom, officialTarget: na.annual_target, target: t, actual: a, achievement: achievementPct(a, t), budget: b, spent: x, beneficiaries: beneficiariesFor(es) };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const byRegion = regions
    .map(r => {
      const es = filteredEntries.filter(e => e.region_id === r.id);
      if (es.length === 0) return null;
      const t = sumTarget(es), a = sumActual(es, quarterlyActuals, q), b = sumBudget(es), x = sumExpenditure(es, quarterlyActuals, q);
      return { key: r.id, name: r.name, target: t, actual: a, achievement: achievementPct(a, t), budget: b, spent: x, beneficiaries: beneficiariesFor(es) };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const byProject = projects
    .map(p => {
      const es = filteredEntries.filter(e => e.project_id === p.id);
      if (es.length === 0) return null;
      const t = sumTarget(es), a = sumActual(es, quarterlyActuals, q), b = sumBudget(es), x = sumExpenditure(es, quarterlyActuals, q);
      return { key: p.id, name: p.name, target: t, actual: a, achievement: achievementPct(a, t), budget: b, spent: x, beneficiaries: beneficiariesFor(es) };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  // Chart drills down to plan-entry level once a single National Activity is selected.
  const chartData = filters.nationalActivityId !== 'ALL'
    ? filteredEntries.map(e => {
        const label = e.scope_type === 'Regional' ? regions.find(r => r.id === e.region_id)?.name : projects.find(p => p.id === e.project_id)?.name;
        return { name: label || e.id, Target: e.annual_target, Actual: sumActual([e], quarterlyActuals, q) };
      })
    : byNational.map(row => ({ name: row.name, Target: row.target, Actual: row.actual }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800">Step 3 — Aggregated Report</h2>
        <p className="text-xs text-slate-500 mt-1">
          Everything below is derived live from the Plan and Quarterly Entry pages: Actual × Conversion Factor = Beneficiaries, summed up by Strategic Priority, National Activity, Region and Project.
        </p>
      </div>

      <FilterBar />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AchievementKPICard achievement={achievement} actual={actual} target={target} singleUom={singleUom} uomsInScope={uomsInScope} hasActuals={actual > 0} />
        <KPICard title="Budget Utilization" val={`${utilization.toFixed(1)}%`} sub={`ETB ${spent.toLocaleString()} / ${budget.toLocaleString()}`} icon={Wallet} />
        <KPICard title="Beneficiaries Reached" val={beneficiaries.toLocaleString()} sub="Actual × Conversion Factor" icon={Users} />
        <KPICard title="Plan Entries in Scope" val={String(filteredEntries.length)} sub="Matching current filters" icon={TrendingUp} />
      </div>

      <div className="bg-white p-5 border rounded-xl shadow-sm h-72">
        <h3 className="text-xs font-bold mb-4 uppercase tracking-wide text-slate-600">
          {filters.nationalActivityId !== 'ALL' ? 'Target vs Actual — by Region / Project' : 'Target vs Actual — by National Activity'}
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Target" fill="#cbd5e1" />
            <Bar dataKey="Actual" fill="#C8102E" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ReportTable title="By Strategic Priority" rows={byStrategy} />
      <ReportTable title="By National Activity" rows={byNational} extraColumn={{ label: 'Official Target', get: r => `${r.officialTarget.toLocaleString()} ${r.uom}` }} />
      <ReportTable title="By Region" rows={byRegion} />
      <ReportTable title="By Project" rows={byProject} />
    </div>
  );
};

const KPICard = ({ title, val, sub, icon: Icon }: any) => (
  <div className="bg-white p-4 rounded-xl border shadow-sm">
    <div className="flex justify-between mb-2 text-xs font-bold text-slate-500"><span>{title}</span><Icon className="w-4 h-4" /></div>
    <div className="text-2xl font-black">{val}</div>
    <div className="text-[10px] mt-1 text-slate-500">{sub}</div>
  </div>
);

// The achievement % is only a real, comparable number when every entry in scope
// shares one UOM (you can't sum "Persons" and "Households" into one ratio).
// This card makes that visible instead of silently combining mismatched units.
const ACHIEVEMENT_TONE: Record<string, string> = {
  Overachieved: 'text-indigo-600',
  Completed: 'text-emerald-600',
  'On Track': 'text-emerald-600',
  'At Risk': 'text-amber-600',
  Behind: 'text-rose-600',
  Planning: 'text-slate-800',
};

const AchievementKPICard: React.FC<{
  achievement: number; actual: number; target: number; singleUom: string | null; uomsInScope: string[]; hasActuals: boolean;
}> = ({ achievement, actual, target, singleUom, uomsInScope, hasActuals }) => {
  const badge = getStatusBadge(achievement, hasActuals);
  const tone = ACHIEVEMENT_TONE[badge.label] || 'text-slate-800';
  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm">
      <div className="flex justify-between mb-2 text-xs font-bold text-slate-500"><span>Achievement</span><Target className="w-4 h-4" /></div>
      <div className={`text-2xl font-black ${tone}`}>{achievement.toFixed(1)}%</div>
      <div className="text-[10px] mt-1 text-slate-500">
        {actual.toLocaleString()} / {target.toLocaleString()}{singleUom ? ` ${singleUom}` : ''}
      </div>
      <div className="mt-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>{badge.label}</span>
      </div>
      {uomsInScope.length > 1 && (
        <div className="mt-2 text-[9px] leading-snug text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-1 font-semibold">
          ⚠ Mixed units in scope ({uomsInScope.join(', ')}) — this % sums raw counts across different UOMs and is not a real unit. Filter to one National Activity for a precise reading.
        </div>
      )}
    </div>
  );
};

interface Row { key: string; name: string; target: number; actual: number; achievement: number; budget: number; spent: number; beneficiaries: number; }

const ReportTable: React.FC<{ title: string; rows: Row[]; extraColumn?: { label: string; get: (r: any) => string } }> = ({ title, rows, extraColumn }) => (
  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
    <div className="p-4 border-b bg-slate-50 text-xs font-bold text-slate-800 uppercase tracking-wider">{title} ({rows.length})</div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b">
          <tr>
            <th className="p-3">Name</th>
            {extraColumn && <th className="p-3 text-right">{extraColumn.label}</th>}
            <th className="p-3 text-right">Target</th>
            <th className="p-3 text-right">Actual</th>
            <th className="p-3 text-right">Achievement</th>
            <th className="p-3 text-right">Budget (ETB)</th>
            <th className="p-3 text-right">Spent (ETB)</th>
            <th className="p-3 text-right">Beneficiaries</th>
            <th className="p-3 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(r => (
            <tr key={r.key} className="hover:bg-slate-50">
              <td className="p-3 font-bold text-slate-800">{r.name}</td>
              {extraColumn && <td className="p-3 text-right text-slate-500">{extraColumn.get(r)}</td>}
              <td className="p-3 text-right">{r.target.toLocaleString()}</td>
              <td className="p-3 text-right font-bold">{r.actual.toLocaleString()}</td>
              <td className="p-3 text-right font-black">{r.achievement.toFixed(1)}%</td>
              <td className="p-3 text-right">{r.budget.toLocaleString()}</td>
              <td className="p-3 text-right font-bold text-emerald-700">{r.spent.toLocaleString()}</td>
              <td className="p-3 text-right font-black text-blue-600">{r.beneficiaries.toLocaleString()}</td>
              <td className="p-3 text-center"><StatusBadge achievementPct={r.achievement} hasActuals={r.actual > 0} /></td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={extraColumn ? 9 : 8} className="p-6 text-center text-slate-500">No data for this filter yet.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);
