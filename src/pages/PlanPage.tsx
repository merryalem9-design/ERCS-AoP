// src/pages/PlanPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { FilterBar } from '../components/common/FilterBar';
import { sumTarget, sumBudget } from '../utils/calculations';
import { NationalActivity, PlanEntry, ScopeType, Region, Zone, Responsibility } from '../types';
import { AlertTriangle, ArrowUpRight, CheckCircle2, ChevronRight, Layers, Plus, Save, Trash2, X } from 'lucide-react';

const RESPONSIBILITY_OPTIONS: Responsibility[] = ['HQ', 'Branch', 'Both'];

// Form shape used by the Add Plan wizard. Kept as strings for controlled
// number inputs; converted to numbers only when the PlanEntry is built.
interface PeWizardFormState {
  id?: string;
  strategicPriorityId: string;
  national_activity_id: string;
  scope_type: ScopeType;
  region_id: string;
  project_id: string;
  annual_target: string;
  annual_budget: string;
}

export const PlanPage: React.FC = () => {
  const {
    strategicPriorities,
    nationalActivities, addNationalActivity, updateNationalActivity, deleteNationalActivity,
    regions, zones, projects, planEntries, deletePlanEntry,
    uomConfigs, filters, getFilteredPlanEntries,
    setSelectedNationalActivityId, setActiveRoute,
    pendingAddPlanNationalActivityId, setPendingAddPlanNationalActivityId,
  } = useApp();

  const [naForm, setNaForm] = useState<null | Partial<NationalActivity>>(null);
  const [peWizard, setPeWizard] = useState<null | { initial: PeWizardFormState; startStep: 1 | 2 }>(null);
  const [deleteTarget, setDeleteTarget] = useState<null | { type: 'na' | 'pe'; id: string; label: string }>(null);

  const filteredEntries = getFilteredPlanEntries();

  // Consumes the one-shot "open the Add Plan wizard for this National
  // Activity" signal set by NationalActivityDetailPage's "+ Add Plan Entry"
  // button. Fires on mount (since App.tsx swaps pages by unmount/remount,
  // this always runs when the person arrives here via that button) and
  // whenever the signal changes. Opens straight at Step 2 with the parent
  // already locked in, then clears the signal so it never re-fires.
  useEffect(() => {
    if (!pendingAddPlanNationalActivityId) return;
    const na = nationalActivities.find(n => n.id === pendingAddPlanNationalActivityId);
    if (na) {
      setPeWizard({
        initial: {
          strategicPriorityId: na.strategic_priority_id,
          national_activity_id: na.id,
          scope_type: 'Regional',
          region_id: '',
          project_id: '',
          annual_target: '',
          annual_budget: '',
        },
        startStep: 2,
      });
    }
    setPendingAddPlanNationalActivityId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAddPlanNationalActivityId]);

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
    // Once a National Activity has linked Plan Entries, its official Target
    // and Budget are owned by those entries (see AppContext), not by this
    // form — so we always write back the computed sum here rather than
    // whatever stale value might still be sitting in the form state.
    const linkedChildren = naForm.id ? planEntries.filter(pe => pe.national_activity_id === naForm.id) : [];
    const hasChildren = linkedChildren.length > 0;
    const manualTarget = Number(naForm.annual_target);
    const manualBudget = Number(naForm.annual_budget);
    const na: NationalActivity = {
      id: naForm.id || `na-${Date.now()}`,
      strategic_priority_id: naForm.strategic_priority_id || '',
      code: (naForm.code || '').trim(),
      description: (naForm.description || '').trim(),
      uom: (naForm.uom || '').trim(),
      responsibility: (naForm.responsibility as Responsibility) || 'HQ',
      region_id: naForm.region_id || undefined,
      zone_id: naForm.zone_id || undefined,
      annual_target: hasChildren ? sumTarget(linkedChildren) : (Number.isFinite(manualTarget) && manualTarget >= 0 ? manualTarget : 0),
      annual_budget: hasChildren ? sumBudget(linkedChildren) : (Number.isFinite(manualBudget) && manualBudget >= 0 ? manualBudget : 0),
    };
    if (!na.code || !na.description || !na.uom || !na.strategic_priority_id) return;
    // Defensive re-check (mirrors the NationalActivityModal's own guard):
    // two National Activities sharing a code would be visually
    // indistinguishable in every Report table and filter dropdown, since
    // those are all labeled by code, not id.
    const isDuplicateCode = nationalActivities.some(other => other.id !== na.id && other.code.trim().toLowerCase() === na.code.toLowerCase());
    if (isDuplicateCode) return;
    if (naForm.id) updateNationalActivity(na); else addNationalActivity(na);
    setNaForm(null);
  };

  const openAddPlanWizard = () => {
    const naId = filters.nationalActivityId !== 'ALL' ? filters.nationalActivityId : (nationalActivities[0]?.id || '');
    const na = nationalActivities.find(n => n.id === naId);
    setPeWizard({
      initial: {
        strategicPriorityId: na?.strategic_priority_id || (filters.strategicPriorityId !== 'ALL' ? filters.strategicPriorityId : ''),
        national_activity_id: naId,
        scope_type: 'Regional',
        region_id: '',
        project_id: '',
        annual_target: '',
        annual_budget: '',
      },
      startStep: 1,
    });
  };

  const openEditPlanWizard = (pe: PlanEntry) => {
    const na = nationalActivities.find(n => n.id === pe.national_activity_id);
    setPeWizard({
      initial: {
        id: pe.id,
        strategicPriorityId: na?.strategic_priority_id || '',
        national_activity_id: pe.national_activity_id,
        scope_type: pe.scope_type,
        region_id: pe.region_id || '',
        project_id: pe.project_id || '',
        annual_target: String(pe.annual_target),
        annual_budget: String(pe.annual_budget),
      },
      startStep: 2,
    });
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
                      {children.length > 0 && <span className="text-slate-400"> (auto-synced from {children.length} linked entries)</span>}
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
          <button onClick={openAddPlanWizard} className="flex items-center gap-1.5 bg-ercs-red text-white px-3 py-1.5 rounded-lg text-xs font-bold">
            <Plus className="w-3.5 h-3.5" /> Add Plan
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
                      <button onClick={() => openEditPlanWizard(pe)} className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-bold">Edit</button>
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
      {peWizard && (
        <PlanEntryWizardModal
          initial={peWizard.initial}
          startStep={peWizard.startStep}
          onClose={() => setPeWizard(null)}
          onSaved={() => setPeWizard(null)}
        />
      )}
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

const NationalActivityModal: React.FC<{ form: Partial<NationalActivity>; setForm: any; onSave: () => void; onClose: () => void }> = ({ form, setForm, onSave, onClose }) => {
  const { uomConfigs, strategicPriorities, regions, zones, addRegion, addZone, planEntries, nationalActivities } = useApp();

  const [addingRegion, setAddingRegion] = useState(false);
  const [newRegionName, setNewRegionName] = useState('');
  const [addingZone, setAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');

  // Guards against a fast double-click firing onSave() twice before this
  // modal unmounts, which would otherwise create two near-identical
  // National Activities. useRef (not useState) because refs update
  // synchronously — a useState flag can still read stale on the second
  // click if it fires before React re-renders.
  const savingRef = useRef(false);

  const zonesInScope = form.region_id ? zones.filter(z => z.region_id === form.region_id) : [];

  // Once this National Activity has linked Plan Entries, Target/Budget are
  // derived live from those entries (see AppContext.syncNationalActivityTotals)
  // and shown read-only here — editing them directly would just be silently
  // overwritten the next time a Plan Entry changes, which is confusing.
  const linkedChildren = form.id ? planEntries.filter(pe => pe.national_activity_id === form.id) : [];
  const hasChildren = linkedChildren.length > 0;
  const computedTarget = sumTarget(linkedChildren);
  const computedBudget = sumBudget(linkedChildren);

  // Required-field + non-negative-number guards. Manual Target/Budget
  // accepted negative numbers (min="0" on <input> is only a UI hint, not an
  // enforced constraint), which would corrupt every downstream aggregate.
  const requiredMissing =
    !(form.code || '').trim() ||
    !(form.description || '').trim() ||
    !(form.uom || '').trim() ||
    !form.strategic_priority_id;

  const manualTargetRaw = form.annual_target;
  const manualBudgetRaw = form.annual_budget;
  const manualTargetNum = Number(manualTargetRaw);
  const manualBudgetNum = Number(manualBudgetRaw);
  const manualNumbersInvalid =
    !hasChildren &&
    (
      (manualTargetRaw !== undefined && manualTargetRaw !== ('' as any) && (Number.isNaN(manualTargetNum) || manualTargetNum < 0)) ||
      (manualBudgetRaw !== undefined && manualBudgetRaw !== ('' as any) && (Number.isNaN(manualBudgetNum) || manualBudgetNum < 0))
    );

  // Two National Activities sharing the same code would be indistinguishable
  // in every Report table and filter dropdown (both are labeled by code, not
  // id) — this catches that before it can happen.
  const codeTrimmed = (form.code || '').trim();
  const duplicateCode = codeTrimmed.length > 0 && nationalActivities.some(
    other => other.id !== form.id && other.code.trim().toLowerCase() === codeTrimmed.toLowerCase()
  );

  const saveDisabled = requiredMissing || manualNumbersInvalid || duplicateCode;

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

  const handleSaveClick = () => {
    if (saveDisabled || savingRef.current) return;
    savingRef.current = true;
    onSave();
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

        {hasChildren ? (
          <>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 mb-1">Annual Target (auto-synced)</span>
              <div className="w-full text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded p-2">{computedTarget.toLocaleString()} {form.uom || ''}</div>
              <div className="text-[10px] text-slate-400 mt-1">Derived live from {linkedChildren.length} linked Plan Entries.</div>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 mb-1">Annual Budget (auto-synced)</span>
              <div className="w-full text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded p-2">ETB {computedBudget.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-1">Derived live from {linkedChildren.length} linked Plan Entries.</div>
            </div>
          </>
        ) : (
          <>
            <LabeledInput label="Annual Target" type="number" value={String(form.annual_target ?? '')} onChange={v => setForm((f: any) => ({ ...f, annual_target: v }))} />
            <LabeledInput label="Annual Budget (ETB)" type="number" value={String(form.annual_budget ?? '')} onChange={v => setForm((f: any) => ({ ...f, annual_budget: v }))} />
          </>
        )}

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

      {requiredMissing && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-800 font-semibold">
          Strategic Priority, Code, Description and UoM are all required before saving.
        </div>
      )}
      {!requiredMissing && duplicateCode && (
        <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-[11px] text-rose-700 font-semibold">
          Another National Activity already uses the code "{codeTrimmed}". Codes must be unique — every Report table and filter is labeled by code, not id.
        </div>
      )}
      {manualNumbersInvalid && (
        <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-[11px] text-rose-700 font-semibold">
          Annual Target and Annual Budget must be zero or greater.
        </div>
      )}

      <button onClick={handleSaveClick} disabled={saveDisabled} className="mt-4 w-full bg-ercs-red text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"><Save className="w-3.5 h-3.5" /> Save</button>
    </ModalShell>
  );
};

// ---------------------------------------------------------------------------
// ADD PLAN WIZARD
// Step 1 makes the parent link explicit: Strategic Priority -> National
// Activity, with a live breadcrumb preview and current linked-entry count.
// Step 2 captures execution details and previews exactly what the National
// Activity's official Target/Budget will become once saved (they always
// will, per AppContext.addPlanEntry / updatePlanEntry).
// ---------------------------------------------------------------------------
const PlanEntryWizardModal: React.FC<{
  initial: PeWizardFormState;
  startStep: 1 | 2;
  onClose: () => void;
  onSaved: () => void;
}> = ({ initial, startStep, onClose, onSaved }) => {
  const { strategicPriorities, nationalActivities, regions, projects, planEntries, addPlanEntry, updatePlanEntry } = useApp();
  const [step, setStep] = useState<1 | 2>(startStep);
  const [form, setForm] = useState<PeWizardFormState>(initial);

  // Same double-submit guard as the National Activity modal, and for the
  // same reason: a fast double-click here would create two Plan Entries for
  // the same Region/Project, silently double-counting that contribution in
  // the parent National Activity's synced Target/Budget.
  const savingRef = useRef(false);

  const isEditing = !!form.id;

  const naOptions = form.strategicPriorityId
    ? nationalActivities.filter(na => na.strategic_priority_id === form.strategicPriorityId)
    : nationalActivities;

  const selectedNa = nationalActivities.find(na => na.id === form.national_activity_id);
  const spOfSelectedNa = selectedNa ? strategicPriorities.find(sp => sp.id === selectedNa.strategic_priority_id) : undefined;

  // Every OTHER entry already linked to this National Activity (excluding
  // the one being edited), used to preview the projected parent totals.
  const siblingEntries = selectedNa ? planEntries.filter(pe => pe.national_activity_id === selectedNa.id && pe.id !== form.id) : [];
  const siblingTarget = sumTarget(siblingEntries);
  const siblingBudget = sumBudget(siblingEntries);
  const thisTarget = Number(form.annual_target) || 0;
  const thisBudget = Number(form.annual_budget) || 0;
  const projectedTarget = siblingTarget + thisTarget;
  const projectedBudget = siblingBudget + thisBudget;

  // Guard 1: Annual Target / Annual Budget must be zero or greater. The
  // number inputs' min="0" is only a UI hint, not an enforced constraint —
  // without this check a negative value would silently corrupt every
  // downstream sum (National Activity totals, Report page aggregates).
  const numbersValid = thisTarget >= 0 && thisBudget >= 0;

  // Guard 2: prevent two Plan Entries linking the same Region/Project to the
  // same National Activity. Without this, both entries' targets/budgets get
  // summed into the parent, silently double-counting that Region/Project's
  // contribution everywhere (National Activity card, Detail page, Report page).
  const isDuplicateLink = !!selectedNa && !!form.scope_type && planEntries.some(pe =>
    pe.id !== form.id &&
    pe.national_activity_id === selectedNa.id &&
    pe.scope_type === form.scope_type &&
    (form.scope_type === 'Regional'
      ? (!!form.region_id && pe.region_id === form.region_id)
      : (!!form.project_id && pe.project_id === form.project_id))
  );

  const canContinue = !!form.national_activity_id;
  const canSave =
    !!form.national_activity_id &&
    !!form.scope_type &&
    (form.scope_type === 'Regional' ? !!form.region_id : !!form.project_id) &&
    numbersValid &&
    !isDuplicateLink;

  const handleSave = () => {
    if (!canSave || savingRef.current) return;
    savingRef.current = true;
    const pe: PlanEntry = {
      id: form.id || `pe-${Date.now()}`,
      national_activity_id: form.national_activity_id,
      scope_type: form.scope_type,
      region_id: form.scope_type === 'Regional' ? form.region_id : undefined,
      project_id: form.scope_type === 'Project' ? form.project_id : undefined,
      annual_target: thisTarget,
      annual_budget: thisBudget,
    };
    if (isEditing) updatePlanEntry(pe); else addPlanEntry(pe);
    onSaved();
  };

  return (
    <ModalShell title={isEditing ? 'Edit Plan Entry' : 'Add Plan — Link to National Activity'} onClose={onClose}>
      <div className="flex items-center gap-2 mb-4">
        <StepPill num={1} label="Link to Parent" active={step === 1} done={step > 1} />
        <div className="flex-1 h-px bg-slate-200" />
        <StepPill num={2} label="Execution Details" active={step === 2} done={false} />
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <span className="block text-[10px] font-bold text-slate-500 mb-1">Strategic Priority</span>
            <select
              value={form.strategicPriorityId}
              onChange={e => {
                const spId = e.target.value;
                const stillValid = nationalActivities.find(na => na.id === form.national_activity_id)?.strategic_priority_id === spId;
                setForm(f => ({ ...f, strategicPriorityId: spId, national_activity_id: stillValid ? f.national_activity_id : '' }));
              }}
              disabled={isEditing}
              className="w-full text-xs border border-slate-200 rounded p-2 bg-slate-50 disabled:opacity-60"
            >
              <option value="">All Strategic Priorities</option>
              {strategicPriorities.map(sp => <option key={sp.id} value={sp.id}>{sp.code} — {sp.name}</option>)}
            </select>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-500 mb-1">National Activity (Parent)</span>
            <select
              value={form.national_activity_id}
              onChange={e => setForm(f => ({ ...f, national_activity_id: e.target.value }))}
              disabled={isEditing}
              className="w-full text-xs border border-slate-200 rounded p-2 bg-slate-50 disabled:opacity-60"
            >
              <option value="">Select the National Activity this plan entry belongs to…</option>
              {naOptions.map(na => <option key={na.id} value={na.id}>{na.code} — {na.description}</option>)}
            </select>
            {isEditing && <div className="text-[10px] text-slate-400 mt-1">The parent link is fixed while editing an existing entry.</div>}
          </div>

          {naOptions.length === 0 && (
            <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 font-semibold">
              No National Activities exist yet in this scope. Close this wizard and create one first via "+ Add National Activity".
            </div>
          )}

          {selectedNa && (
            <div className="bg-slate-50 border rounded-lg p-3 space-y-2">
              <div className="text-[10px] uppercase font-extrabold text-slate-400">Link Preview</div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="bg-white border rounded px-2 py-1">{spOfSelectedNa?.code || 'Strategic Priority'}</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="bg-red-50 text-ercs-red border border-red-100 rounded px-2 py-1">{selectedNa.code}</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="bg-blue-50 text-blue-700 rounded px-2 py-1">{isEditing ? 'This Plan Entry' : 'New Plan Entry'}</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Official Target: <b>{selectedNa.annual_target.toLocaleString()} {selectedNa.uom}</b> · Official Budget: <b>ETB {selectedNa.annual_budget.toLocaleString()}</b> · Linked entries: <b>{planEntries.filter(pe => pe.national_activity_id === selectedNa.id).length}</b>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button disabled={!canContinue} onClick={() => setStep(2)} className="bg-ercs-red text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-40">
              Continue to Execution Details
            </button>
          </div>
        </div>
      )}

      {step === 2 && selectedNa && (
        <div className="space-y-4">
          <div>
            <span className="block text-[10px] font-bold text-slate-500 mb-1">Executed By</span>
            <div className="flex gap-2">
              {(['Regional', 'Project'] as ScopeType[]).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, scope_type: st, region_id: '', project_id: '' }))}
                  className={`flex-1 py-2 rounded text-xs font-bold border ${form.scope_type === st ? 'bg-ercs-red text-white border-ercs-red' : 'bg-slate-50 text-slate-600'}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {form.scope_type === 'Regional' && (
            <div>
              <span className="block text-[10px] font-bold text-slate-500 mb-1">Region</span>
              <select value={form.region_id} onChange={e => setForm(f => ({ ...f, region_id: e.target.value }))} className="w-full text-xs border rounded p-2 bg-slate-50">
                <option value="">Select region…</option>
                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          )}
          {form.scope_type === 'Project' && (
            <div>
              <span className="block text-[10px] font-bold text-slate-500 mb-1">Project</span>
              <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} className="w-full text-xs border rounded p-2 bg-slate-50">
                <option value="">Select project…</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <LabeledInput label={`Annual Target (${selectedNa.uom})`} type="number" value={form.annual_target} onChange={v => setForm(f => ({ ...f, annual_target: v }))} />
            <LabeledInput label="Annual Budget (ETB)" type="number" value={form.annual_budget} onChange={v => setForm(f => ({ ...f, annual_budget: v }))} />
          </div>

          {isDuplicateLink && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-[11px] text-rose-700 font-semibold">
              This {form.scope_type === 'Regional' ? 'Region' : 'Project'} is already linked to {selectedNa.code}. Pick a different {form.scope_type === 'Regional' ? 'Region' : 'Project'}, or close this wizard and edit the existing entry instead — two entries for the same {form.scope_type === 'Regional' ? 'Region' : 'Project'} would double-count its contribution.
            </div>
          )}
          {!numbersValid && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-[11px] text-rose-700 font-semibold">
              Annual Target and Annual Budget must be zero or greater.
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-800 font-semibold space-y-1">
            <div>Saving will automatically update <b>{selectedNa.code}</b>'s official Target &amp; Budget to match all linked Plan Entries.</div>
            <div>Projected National Activity Target: <b>{projectedTarget.toLocaleString()} {selectedNa.uom}</b> (currently {selectedNa.annual_target.toLocaleString()})</div>
            <div>Projected National Activity Budget: <b>ETB {projectedBudget.toLocaleString()}</b> (currently ETB {selectedNa.annual_budget.toLocaleString()})</div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg border text-xs font-bold">Back</button>
            <button disabled={!canSave} onClick={handleSave} className="bg-ercs-red text-white px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-40">
              <Save className="w-3.5 h-3.5" /> {isEditing ? 'Update Plan Entry' : 'Save & Link to National Activity'}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
};

const StepPill: React.FC<{ num: number; label: string; active: boolean; done: boolean }> = ({ num, label, active, done }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold ${active ? 'bg-red-50 text-ercs-red' : done ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${active ? 'bg-ercs-red text-white' : done ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'}`}>{num}</span>
    {label}
  </div>
);

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
      <p className="text-xs text-slate-600 mt-3">This also removes any linked quarterly actuals, and re-syncs the parent National Activity's totals, so nothing ever references deleted data.</p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border text-xs font-bold">Cancel</button>
        <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold">Delete</button>
      </div>
    </div>
  </div>
);