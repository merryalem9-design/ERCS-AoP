import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FilterBar } from '../components/common/FilterBar';
import { sumTarget, sumBudget } from '../utils/calculations';
import { NationalActivity, PlanEntry, ScopeType, Region, Zone, Responsibility } from '../types';
import { AlertTriangle, ArrowUpRight, CheckCircle2, Layers, Plus, Save, Trash2, X } from 'lucide-react';

const RESPONSIBILITY_OPTIONS: Responsibility[] = ['HQ', 'Branch', 'Both'];

export const PlanPage: React.FC = () => {
  const {
    strategicPriorities,
    nationalActivities, addNationalActivity, updateNationalActivity, deleteNationalActivity,
    regions, zones, projects, planEntries, addPlanEntry, updatePlanEntry, deletePlanEntry,
    uomConfigs, filters, getFilteredPlanEntries,
    setSelectedNationalActivityId, setActiveRoute,
  } = useApp();

  const [naForm, setNaForm] = useState<null | Partial<NationalActivity>>(null);
  const [peForm, setPeForm] = useState<null | Partial<PlanEntry>>(null);
  const [deleteTarget, setDeleteTarget] = useState<null | { type: 'na' | 'pe'; id: string; label: string }>(null);

  const filteredEntries = getFilteredPlanEntries();

  // Which National Activities to show reconciliation + entries for, based on the
  // Strategic Priority and National Activity filters at the top.
  const visibleNationalActivities = nationalActivities.filter(na => {
    if (filters.strategicPriorityId !== 'ALL' && na.strategic_priority_id !== filters.strategicPriorityId) return false;
    if (filters.nationalActivityId !== 'ALL' && na.id !== filters.nationalActivityId) return false;
    return true;
  });

  const viewLinkMap = (naId: string) => {
    setSelectedNationalActivityId(naId);
    setActiveRoute('national-detail');
  };

  const saveNa = () => {
    if (!naForm) return;
    const na: NationalActivity = {
      id: naForm.id || `na-${Date.now()}`,
      strategic_priority_id: naForm.strategic_priority_id || '',
      code: (naForm.code || '').trim(),
      description: (naForm.description || '').trim(),
      uom: (naForm.uom || '').trim(),
      responsibility: (naForm.responsibility as Responsibility) || 'HQ',
      region_id: naForm.region_id || undefined,
      zone_id: naForm.zone_id || undefined,
      annual_target: Number(naForm.annual_target) || 0,
      annual_budget: Number(naForm.annual_budget) || 0,
    };
    if (!na.code || !na.description || !na.uom || !na.strategic_priority_id) return;
    if (naForm.id) updateNationalActivity(na); else addNationalActivity(na);
    setNaForm(null);
  };

  const savePe = () => {
    if (!peForm || !peForm.national_activity_id || !peForm.scope_type) return;
    if (peForm.scope_type === 'Regional' && !peForm.region_id) return;
    if (peForm.scope_type === 'Project' && !peForm.project_id) return;
    const pe: PlanEntry = {
      id: peForm.id || `pe-${Date.now()}`,
      national_activity_id: peForm.national_activity_id,
      scope_type: peForm.scope_type,
      region_id: peForm.scope_type === 'Regional' ? peForm.region_id : undefined,
      project_id: peForm.scope_type === 'Project' ? peForm.project_id : undefined,
      annual_target: Number(peForm.annual_target) || 0,
      annual_budget: Number(peForm.annual_budget) || 0,
    };
    if (peForm.id) updatePlanEntry(pe); else addPlanEntry(pe);
    setPeForm(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800">Step 1 — Annual Plan Data Entry</h2>
        <p className="text-xs text-slate-500 mt-1">
          Define each National Activity's official target, then link it to the Regions or Projects executing against it.
        </p>
      </div>

<FilterBar showQuarter={false} />

      {/* National Activities */}
      <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-ercs-red" /> National Activities ({visibleNationalActivities.length})
          </div>
          <button
            onClick={() => setNaForm({ strategic_priority_id: filters.strategicPriorityId !== 'ALL' ? filters.strategicPriorityId : undefined, code: 'Activity ' })}
            className="flex items-center gap-1.5 bg-ercs-red text-white px-3 py-1.5 rounded-lg text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" /> Add National Activity
          </button>
        </div>
        <div className="divide-y">
          {visibleNationalActivities.map(na => {
            const children = planEntries.filter(pe => pe.national_activity_id === na.id);
            const childTarget = sumTarget(children);
            const childBudget = sumBudget(children);
            const targetMismatch = childTarget !== na.annual_target;
            const budgetMismatch = childBudget !== na.annual_budget;
            const sp = strategicPriorities.find(s => s.id === na.strategic_priority_id);
            const naRegion = regions.find(r => r.id === na.region_id);
            const naZone = zones.find(z => z.id === na.zone_id);
            return (
              <div key={na.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {sp && <span className="bg-slate-800 text-white text-[10px] font-extrabold px-2 py-0.5 rounded">{sp.code}</span>}
                      <span className="bg-ercs-red text-white text-[10px] font-extrabold px-2 py-0.5 rounded">{na.code}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">{na.uom}</span>
                      {na.responsibility && (
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2 py-0.5 rounded border border-slate-200">{na.responsibility}</span>
                      )}
                      {(naRegion || naZone) && (
                        <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded">
                          {[naRegion?.name, naZone?.name].filter(Boolean).join(' / ')}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-800 mt-1">{na.description}</div>
                    {sp && (
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {sp.name} <span className="text-slate-300">·</span> {sp.objective}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 mt-1">
                      Official Target: <b>{na.annual_target.toLocaleString()} {na.uom}</b> · Official Budget: <b>ETB {na.annual_budget.toLocaleString()}</b>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => viewLinkMap(na.id)} className="px-2.5 py-1.5 rounded bg-red-50 text-ercs-red font-bold text-xs flex items-center gap-1">
                      View Link Map <ArrowUpRight className="w-3 h-3" />
                    </button>
                    <button onClick={() => setNaForm(na)} className="px-2.5 py-1.5 rounded bg-blue-50 text-blue-700 font-bold text-xs">Edit</button>
                    <button onClick={() => setDeleteTarget({ type: 'na', id: na.id, label: na.code })} className="px-2.5 py-1.5 rounded bg-red-50 text-red-700 font-bold text-xs flex items-center gap-1"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold">
                  <button onClick={() => viewLinkMap(na.id)} className="bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                    {children.length} linked plan entries <ArrowUpRight className="w-3 h-3" />
                  </button>
                  {targetMismatch
                    ? <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Target sum {childTarget.toLocaleString()} ≠ official {na.annual_target.toLocaleString()}</span>
                    : <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Target reconciled</span>}
                  {budgetMismatch
                    ? <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Budget sum {childBudget.toLocaleString()} ≠ official {na.annual_budget.toLocaleString()}</span>
                    : <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Budget reconciled</span>}
                </div>
              </div>
            );
          })}
          {visibleNationalActivities.length === 0 && <div className="p-6 text-center text-xs text-slate-500">No National Activities match this filter.</div>}
        </div>
      </section>

      {/* Conversion factors */}
      <section className="bg-white p-5 rounded-xl border shadow-sm space-y-3">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-3">Conversion Factors (UoM → Beneficiaries)</div>
        <p className="text-[11px] text-slate-500 -mt-1">This is the multiplier the Report page uses to turn a reported Actual into Beneficiaries Reached.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {uomConfigs.map(cfg => (
            <div key={cfg.uom} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
              <div><div className="text-xs font-bold text-slate-800">{cfg.uom}</div><div className="text-[10px] text-slate-500">Beneficiaries per unit</div></div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-400">×</span>
                <span className="w-14 text-center text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded p-1.5">{cfg.factor}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Plan entries */}
      <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-slate-50">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">Execution Plan Entries ({filteredEntries.length})</div>
          <button onClick={() => setPeForm({ scope_type: 'Regional', national_activity_id: filters.nationalActivityId !== 'ALL' ? filters.nationalActivityId : nationalActivities[0]?.id })} className="flex items-center gap-1.5 bg-ercs-red text-white px-3 py-1.5 rounded-lg text-xs font-bold">
            <Plus className="w-3.5 h-3.5" /> Add Plan Entry
          </button>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b"><tr><th className="p-3">National Activity</th><th className="p-3">Executed By</th><th className="p-3 text-right">Annual Target</th><th className="p-3 text-right">Annual Budget</th><th className="p-3 text-center">Actions</th></tr></thead>
          <tbody className="divide-y">
            {filteredEntries.map(pe => {
              const na = nationalActivities.find(n => n.id === pe.national_activity_id);
              const scopeName = pe.scope_type === 'Regional' ? regions.find(r => r.id === pe.region_id)?.name : projects.find(p => p.id === pe.project_id)?.name;
              return (
                <tr key={pe.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-ercs-red">{na?.code}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pe.scope_type === 'Regional' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{pe.scope_type}</span>
                    <span className="ml-2 font-semibold">{scopeName || '—'}</span>
                  </td>
                  <td className="p-3 text-right font-bold">{pe.annual_target.toLocaleString()} {na?.uom}</td>
                  <td className="p-3 text-right">{pe.annual_budget.toLocaleString()}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setPeForm(pe)} className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-bold">Edit</button>
                      <button onClick={() => setDeleteTarget({ type: 'pe', id: pe.id, label: `${na?.code} / ${scopeName}` })} className="px-2.5 py-1 rounded bg-red-50 text-red-700 font-bold"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredEntries.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-500">No plan entries match this filter.</td></tr>}
          </tbody>
        </table>
      </section>

      {naForm && <NationalActivityModal form={naForm} setForm={setNaForm} onSave={saveNa} onClose={() => setNaForm(null)} />}
      {peForm && <PlanEntryModal form={peForm} setForm={setPeForm} onSave={savePe} onClose={() => setPeForm(null)} />}
      {deleteTarget && (
        <ConfirmDeleteModal
          label={deleteTarget.label}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteTarget.type === 'na') deleteNationalActivity(deleteTarget.id); else deletePlanEntry(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
};

// Thin wrapper so this file doesn't need a second import line duplicated —
// keeps the existing FilterBar exactly as-is.
/*const FilterBarWrapper: React.FC = () => {
  const { FilterBar } = require('../components/common/FilterBar');
  return <FilterBar showQuarter={false} />;
};*/

const NationalActivityModal: React.FC<{ form: Partial<NationalActivity>; setForm: any; onSave: () => void; onClose: () => void }> = ({ form, setForm, onSave, onClose }) => {
  const { uomConfigs, strategicPriorities, regions, zones, addRegion, addZone } = useApp();

  const [addingRegion, setAddingRegion] = useState(false);
  const [newRegionName, setNewRegionName] = useState('');
  const [addingZone, setAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');

  const zonesInScope = form.region_id ? zones.filter(z => z.region_id === form.region_id) : [];

  const handleAddRegion = () => {
    const name = newRegionName.trim();
    if (!name) return;
    const region: Region = { id: `reg-${Date.now()}`, name };
    addRegion(region);
    setForm((f: any) => ({ ...f, region_id: region.id, zone_id: undefined }));
    setNewRegionName('');
    setAddingRegion(false);
  };

  const handleAddZone = () => {
    const name = newZoneName.trim();
    if (!name || !form.region_id) return;
    const zone: Zone = { id: `zone-${Date.now()}`, region_id: form.region_id, name };
    addZone(zone);
    setForm((f: any) => ({ ...f, zone_id: zone.id }));
    setNewZoneName('');
    setAddingZone(false);
  };

  return (
    <ModalShell title={form.id ? 'Edit National Activity' : 'Add National Activity'} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <span className="block text-[10px] font-bold text-slate-500 mb-1">Strategic Priority</span>
          <select
            value={form.strategic_priority_id || ''}
            onChange={e => setForm((f: any) => ({ ...f, strategic_priority_id: e.target.value }))}
            className="w-full text-xs border border-slate-200 rounded p-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-100"
          >
            <option value="">Select Strategic Priority…</option>
            {strategicPriorities.map(sp => <option key={sp.id} value={sp.id}>{sp.code} — {sp.name}</option>)}
          </select>
        </div>
        <LabeledInput label="Code" value={form.code || ''} onChange={v => setForm((f: any) => ({ ...f, code: v }))} placeholder="Activity 1.1.3" />
        <div>
          <span className="block text-[10px] font-bold text-slate-500 mb-1">UoM</span>
          <select
            value={form.uom || ''}
            onChange={e => setForm((f: any) => ({ ...f, uom: e.target.value }))}
            className="w-full text-xs border border-slate-200 rounded p-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-100"
          >
            <option value="">Select UoM…</option>
            {uomConfigs.map(cfg => <option key={cfg.uom} value={cfg.uom}>{cfg.uom}</option>)}
          </select>
        </div>
        <div className="col-span-2"><LabeledInput label="Description" value={form.description || ''} onChange={v => setForm((f: any) => ({ ...f, description: v }))} placeholder="What this activity delivers" /></div>

        <div>
          <span className="block text-[10px] font-bold text-slate-500 mb-1">Responsibility</span>
          <select
            value={form.responsibility || ''}
            onChange={e => setForm((f: any) => ({ ...f, responsibility: e.target.value as Responsibility }))}
            className="w-full text-xs border border-slate-200 rounded p-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-100"
          >
            <option value="">Select Responsibility…</option>
            {RESPONSIBILITY_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <LabeledInput label="Annual Target" type="number" value={String(form.annual_target ?? '')} onChange={v => setForm((f: any) => ({ ...f, annual_target: v }))} />
        <LabeledInput label="Annual Budget (ETB)" type="number" value={String(form.annual_budget ?? '')} onChange={v => setForm((f: any) => ({ ...f, annual_budget: v }))} />

        {/* Region */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="block text-[10px] font-bold text-slate-500">Region</span>
            <button type="button" onClick={() => setAddingRegion(a => !a)} className="text-[10px] font-bold text-ercs-red">+ Add Region</button>
          </div>
          <select
            value={form.region_id || ''}
            onChange={e => setForm((f: any) => ({ ...f, region_id: e.target.value || undefined, zone_id: undefined }))}
            className="w-full text-xs border border-slate-200 rounded p-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-100"
          >
            <option value="">National (All Regions)</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          {addingRegion && (
            <div className="mt-2 flex gap-1.5">
              <input
                value={newRegionName}
                onChange={e => setNewRegionName(e.target.value)}
                placeholder="New region name"
                className="flex-1 text-xs border border-slate-200 rounded p-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
              />
              <button type="button" onClick={handleAddRegion} className="px-2.5 py-1 rounded bg-ercs-red text-white text-[10px] font-bold">Add</button>
            </div>
          )}
        </div>

        {/* Zone */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="block text-[10px] font-bold text-slate-500">Zone</span>
            <button
              type="button"
              disabled={!form.region_id}
              onClick={() => setAddingZone(a => !a)}
              className={`text-[10px] font-bold ${form.region_id ? 'text-ercs-red' : 'text-slate-300 cursor-not-allowed'}`}
            >
              + Add Zone
            </button>
          </div>
          <select
            value={form.zone_id || ''}
            onChange={e => setForm((f: any) => ({ ...f, zone_id: e.target.value || undefined }))}
            disabled={!form.region_id}
            className="w-full text-xs border border-slate-200 rounded p-2 bg-slate-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-100"
          >
            <option value="">{form.region_id ? 'All Zones' : 'Select a Region first'}</option>
            {zonesInScope.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          {addingZone && form.region_id && (
            <div className="mt-2 flex gap-1.5">
              <input
                value={newZoneName}
                onChange={e => setNewZoneName(e.target.value)}
                placeholder="New zone name"
                className="flex-1 text-xs border border-slate-200 rounded p-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
              />
              <button type="button" onClick={handleAddZone} className="px-2.5 py-1 rounded bg-ercs-red text-white text-[10px] font-bold">Add</button>
            </div>
          )}
        </div>
      </div>
      <button onClick={onSave} className="mt-4 w-full bg-ercs-red text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2"><Save className="w-3.5 h-3.5" /> Save</button>
    </ModalShell>
  );
};

const PlanEntryModal: React.FC<{ form: Partial<PlanEntry>; setForm: any; onSave: () => void; onClose: () => void }> = ({ form, setForm, onSave, onClose }) => {
  const { nationalActivities, regions, projects } = useApp();
  return (
    <ModalShell title={form.id ? 'Edit Plan Entry' : 'Add Plan Entry'} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <span className="block text-[10px] font-bold text-slate-500 mb-1">National Activity</span>
          <select value={form.national_activity_id || ''} onChange={e => setForm((f: any) => ({ ...f, national_activity_id: e.target.value }))} className="w-full text-xs border rounded p-2 bg-slate-50">
            <option value="">Select…</option>
            {nationalActivities.map(na => <option key={na.id} value={na.id}>{na.code} — {na.description}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <span className="block text-[10px] font-bold text-slate-500 mb-1">Executed By</span>
          <div className="flex gap-2">
            {(['Regional', 'Project'] as ScopeType[]).map(st => (
              <button key={st} type="button" onClick={() => setForm((f: any) => ({ ...f, scope_type: st, region_id: undefined, project_id: undefined }))} className={`flex-1 py-2 rounded text-xs font-bold border ${form.scope_type === st ? 'bg-ercs-red text-white border-ercs-red' : 'bg-slate-50 text-slate-600'}`}>{st}</button>
            ))}
          </div>
        </div>
        {form.scope_type === 'Regional' && (
          <div className="col-span-2">
            <span className="block text-[10px] font-bold text-slate-500 mb-1">Region</span>
            <select value={form.region_id || ''} onChange={e => setForm((f: any) => ({ ...f, region_id: e.target.value }))} className="w-full text-xs border rounded p-2 bg-slate-50">
              <option value="">Select region…</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        )}
        {form.scope_type === 'Project' && (
          <div className="col-span-2">
            <span className="block text-[10px] font-bold text-slate-500 mb-1">Project</span>
            <select value={form.project_id || ''} onChange={e => setForm((f: any) => ({ ...f, project_id: e.target.value }))} className="w-full text-xs border rounded p-2 bg-slate-50">
              <option value="">Select project…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
        <LabeledInput label="Annual Target" type="number" value={String(form.annual_target ?? '')} onChange={v => setForm((f: any) => ({ ...f, annual_target: v }))} />
        <LabeledInput label="Annual Budget (ETB)" type="number" value={String(form.annual_budget ?? '')} onChange={v => setForm((f: any) => ({ ...f, annual_budget: v }))} />
      </div>
      <button onClick={onSave} className="mt-4 w-full bg-ercs-red text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2"><Save className="w-3.5 h-3.5" /> Save</button>
    </ModalShell>
  );
};

const LabeledInput: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }> = ({ label, value, onChange, type = 'text', placeholder }) => (
  <label className="block">
    <span className="block text-[10px] font-bold text-slate-500 mb-1">{label}</span>
    <input type={type} min={type === 'number' ? 0 : undefined} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="w-full text-xs border border-slate-200 rounded p-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-100" />
  </label>
);

const ModalShell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-5">
      <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-black">{title}</h3><button onClick={onClose}><X className="w-4 h-4" /></button></div>
      {children}
    </div>
  </div>
);

const ConfirmDeleteModal: React.FC<{ label: string; onCancel: () => void; onConfirm: () => void }> = ({ label, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
    <div className="bg-white max-w-md w-full rounded-xl shadow-2xl p-5">
      <div className="flex items-center gap-2 text-red-700 font-black text-sm"><Trash2 className="w-5 h-5" /> Delete "{label}"?</div>
      <p className="text-xs text-slate-600 mt-3">This also removes any linked quarterly actuals so totals never reference deleted data.</p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border text-xs font-bold">Cancel</button>
        <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold">Delete</button>
      </div>
    </div>
  </div>
);