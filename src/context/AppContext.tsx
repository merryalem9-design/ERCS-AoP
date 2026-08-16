// src/context/AppContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  StrategicPriority, NationalActivity, Region, Zone, Project, PlanEntry, Quarter, QuarterlyPlan, QuarterlyActual, UomFactorConfig, FilterState,
} from '../types';
import {
  INITIAL_STRATEGIC_PRIORITIES, INITIAL_NATIONAL_ACTIVITIES, INITIAL_REGIONS, INITIAL_ZONES, INITIAL_PROJECTS, INITIAL_PLAN_ENTRIES,
  FISCAL_QUARTERS, INITIAL_QUARTERLY_PLANS, INITIAL_QUARTERLY_ACTUALS, INITIAL_UOM_CONFIGS,
} from '../data/seedData';
import { sumTarget, sumBudget } from '../utils/calculations';

interface AppContextType {
  activeRoute: string; setActiveRoute: (r: string) => void;
  toastMessage: string | null; showToast: (msg: string) => void;

  // Which National Activity is being viewed on the drill-down detail page.
  selectedNationalActivityId: string | null; setSelectedNationalActivityId: (id: string | null) => void;

  // One-shot signal: "the user wants to add a Plan Entry linked to this
  // National Activity right now." Set by NationalActivityDetailPage's
  // "+ Add Plan Entry" button before it navigates to the Plan page; consumed
  // and cleared by PlanPage on mount, which opens the Add Plan wizard
  // directly at Step 2 with the parent already locked in.
  pendingAddPlanNationalActivityId: string | null;
  setPendingAddPlanNationalActivityId: (id: string | null) => void;

  strategicPriorities: StrategicPriority[];

  nationalActivities: NationalActivity[];
  addNationalActivity: (na: NationalActivity) => void;
  updateNationalActivity: (na: NationalActivity) => void;
  deleteNationalActivity: (id: string) => void;

  regions: Region[];
  addRegion: (r: Region) => void;

  zones: Zone[];
  addZone: (z: Zone) => void;

  projects: Project[];
  quarters: Quarter[];

  planEntries: PlanEntry[];
  addPlanEntry: (pe: PlanEntry) => void;
  updatePlanEntry: (pe: PlanEntry) => void;
  deletePlanEntry: (id: string) => void;

  // Step 2 of the pipeline: Q1–Q4 breakdown of a Plan Entry's annual figure.
  quarterlyPlans: QuarterlyPlan[];
  upsertQuarterlyPlan: (qp: QuarterlyPlan) => void;

  quarterlyActuals: QuarterlyActual[];
  upsertQuarterlyActual: (qa: QuarterlyActual) => void;

  uomConfigs: UomFactorConfig[];
  updateUomFactor: (uom: string, factor: number) => void;

  filters: FilterState; setFilters: React.Dispatch<React.SetStateAction<FilterState>>; resetFilters: () => void;
  getFilteredPlanEntries: () => PlanEntry[];
}

const DEFAULT_FILTERS: FilterState = { strategicPriorityId: 'ALL', nationalActivityId: 'ALL', regionId: 'ALL', projectId: 'ALL', quarterId: 'ALL' };

const PERSISTENCE_KEY = 'ercs-aop-simplified-v2';

const readPersisted = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(PERSISTENCE_KEY);
    if (!raw) return fallback;
    const data = JSON.parse(raw) as Record<string, unknown>;
    return Object.prototype.hasOwnProperty.call(data, key) ? (data[key] as T) : fallback;
  } catch {
    return fallback;
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRoute, setActiveRoute] = useState<string>(() => readPersisted('activeRoute', 'plan'));
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedNationalActivityId, setSelectedNationalActivityId] = useState<string | null>(() => readPersisted('selectedNationalActivityId', null));
  // Deliberately NOT persisted — this is a transient one-shot UI signal, not
  // durable app data. A stale value surviving a page reload would incorrectly
  // pop the wizard open on next visit to the Plan page.
  const [pendingAddPlanNationalActivityId, setPendingAddPlanNationalActivityId] = useState<string | null>(null);

  const [strategicPriorities] = useState<StrategicPriority[]>(INITIAL_STRATEGIC_PRIORITIES);
  const [nationalActivities, setNationalActivities] = useState<NationalActivity[]>(() => readPersisted('nationalActivities', INITIAL_NATIONAL_ACTIVITIES));
  const [regions, setRegions] = useState<Region[]>(() => readPersisted('regions', INITIAL_REGIONS));
  const [zones, setZones] = useState<Zone[]>(() => readPersisted('zones', INITIAL_ZONES));
  const [projects] = useState<Project[]>(INITIAL_PROJECTS);
  const [quarters] = useState<Quarter[]>(FISCAL_QUARTERS);
  const [planEntries, setPlanEntries] = useState<PlanEntry[]>(() => readPersisted('planEntries', INITIAL_PLAN_ENTRIES));
  const [quarterlyPlans, setQuarterlyPlans] = useState<QuarterlyPlan[]>(() => readPersisted('quarterlyPlans', INITIAL_QUARTERLY_PLANS));
  const [quarterlyActuals, setQuarterlyActuals] = useState<QuarterlyActual[]>(() => readPersisted('quarterlyActuals', INITIAL_QUARTERLY_ACTUALS));
  const [uomConfigs, setUomConfigs] = useState<UomFactorConfig[]>(() => readPersisted('uomConfigs', INITIAL_UOM_CONFIGS));
  const [filters, setFilters] = useState<FilterState>(() => ({ ...DEFAULT_FILTERS, ...readPersisted('filters', DEFAULT_FILTERS) }));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PERSISTENCE_KEY, JSON.stringify({
        activeRoute, selectedNationalActivityId, nationalActivities, regions, zones, planEntries, quarterlyPlans, quarterlyActuals, uomConfigs, filters,
      }));
    } catch {
      // localStorage may be unavailable; in-memory state still works for the session.
    }
  }, [activeRoute, selectedNationalActivityId, nationalActivities, regions, zones, planEntries, quarterlyPlans, quarterlyActuals, uomConfigs, filters]);

  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3000); };
  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const getFilteredPlanEntries = () => planEntries.filter(pe => {
    if (filters.strategicPriorityId !== 'ALL') {
      const na = nationalActivities.find(n => n.id === pe.national_activity_id);
      if (!na || na.strategic_priority_id !== filters.strategicPriorityId) return false;
    }
    if (filters.nationalActivityId !== 'ALL' && pe.national_activity_id !== filters.nationalActivityId) return false;
    if (filters.regionId !== 'ALL' && pe.region_id !== filters.regionId) return false;
    if (filters.projectId !== 'ALL' && pe.project_id !== filters.projectId) return false;
    return true;
  });

  const addNationalActivity = (na: NationalActivity) => { setNationalActivities(prev => [...prev, na]); showToast(`National Activity ${na.code} created.`); };
  const updateNationalActivity = (na: NationalActivity) => { setNationalActivities(prev => prev.map(x => x.id === na.id ? na : x)); showToast(`National Activity ${na.code} updated.`); };

  // Cascades the delete to EVERY dependent record — Plan Entries, their
  // Quarterly Plans, and their Quarterly Actuals — and clears any UI state
  // that referenced this National Activity by id, so nothing is left
  // pointing at an id that no longer exists anywhere.
  const deleteNationalActivity = (id: string) => {
    const childIds = planEntries.filter(pe => pe.national_activity_id === id).map(pe => pe.id);
    setPlanEntries(prev => prev.filter(pe => pe.national_activity_id !== id));
    setQuarterlyPlans(prev => prev.filter(qp => !childIds.includes(qp.plan_entry_id)));
    setQuarterlyActuals(prev => prev.filter(a => !childIds.includes(a.plan_entry_id)));
    setNationalActivities(prev => prev.filter(x => x.id !== id));
    setSelectedNationalActivityId(prev => (prev === id ? null : prev));
    setFilters(prev => (prev.nationalActivityId === id ? { ...prev, nationalActivityId: 'ALL' } : prev));
    showToast('National Activity and its linked plan, quarterly plan and actual records deleted.');
  };

  const addRegion = (r: Region) => { setRegions(prev => [...prev, r]); showToast(`Region ${r.name} added.`); };
  const addZone = (z: Zone) => { setZones(prev => [...prev, z]); showToast(`Zone ${z.name} added.`); };

  // ---------------------------------------------------------------------
  // THE "ADD PLAN" LINK: a Plan Entry always belongs to exactly one
  // National Activity via national_activity_id. Whenever the set of Plan
  // Entries under a National Activity changes (added / edited / deleted),
  // this recomputes that National Activity's OFFICIAL annual_target and
  // annual_budget as the live sum of its children, and writes it straight
  // back onto the National Activity record.
  //
  // Always computes from the `entries` array passed in — the POST-mutation
  // snapshot — never from the `planEntries` closure variable, so this is
  // correct regardless of React's render/commit timing.
  // ---------------------------------------------------------------------
  const syncNationalActivityTotals = (nationalActivityId: string, entries: PlanEntry[]) => {
    const children = entries.filter(pe => pe.national_activity_id === nationalActivityId);
    const target = sumTarget(children);
    const budget = sumBudget(children);
    setNationalActivities(prev => prev.map(na => (
      na.id === nationalActivityId ? { ...na, annual_target: target, annual_budget: budget } : na
    )));
    return { target, budget };
  };

  const addPlanEntry = (pe: PlanEntry) => {
    const next = [...planEntries, pe];
    setPlanEntries(next);
    const na = nationalActivities.find(n => n.id === pe.national_activity_id);
    if (na) {
      const { target, budget } = syncNationalActivityTotals(na.id, next);
      showToast(`Plan entry added and linked to ${na.code}. Target synced to ${target.toLocaleString()} ${na.uom}, budget to ETB ${budget.toLocaleString()}.`);
    } else {
      showToast('Plan entry added.');
    }
  };

  const updatePlanEntry = (pe: PlanEntry) => {
    const old = planEntries.find(x => x.id === pe.id);
    const next = planEntries.map(x => (x.id === pe.id ? pe : x));
    setPlanEntries(next);

    // If the entry was re-linked to a different National Activity, re-sync
    // both the old parent (which just lost a child) and the new one.
    const affectedIds = new Set<string>([pe.national_activity_id]);
    if (old && old.national_activity_id !== pe.national_activity_id) affectedIds.add(old.national_activity_id);
    affectedIds.forEach(id => syncNationalActivityTotals(id, next));

    const na = nationalActivities.find(n => n.id === pe.national_activity_id);
    showToast(`Plan entry updated. ${na?.code || 'Linked National Activity'} target & budget re-synced live.`);
  };

  // Deleting a Plan Entry cascades to its Quarterly Plan AND its Quarterly
  // Actuals — both are meaningless without the Plan Entry they measure.
  const deletePlanEntry = (id: string) => {
    const old = planEntries.find(x => x.id === id);
    const next = planEntries.filter(x => x.id !== id);
    setPlanEntries(next);
    setQuarterlyPlans(prev => prev.filter(qp => qp.plan_entry_id !== id));
    setQuarterlyActuals(prev => prev.filter(a => a.plan_entry_id !== id));
    if (old) syncNationalActivityTotals(old.national_activity_id, next);
    showToast('Plan entry, its quarterly plan and its quarterly actuals deleted. Linked National Activity totals re-synced.');
  };

  // Stores one quarter's planned target/budget for a Plan Entry. Deliberately
  // does NOT write back to the Plan Entry's own annual_target/annual_budget —
  // see the QuarterlyPlan type comment for why. The Quarterly Plan page reads
  // this directly alongside the Plan Entry's annual figure to show whether
  // they reconcile.
  const upsertQuarterlyPlan = (qp: QuarterlyPlan) => {
    setQuarterlyPlans(prev => {
      const idx = prev.findIndex(x => x.plan_entry_id === qp.plan_entry_id && x.quarter_id === qp.quarter_id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = qp; return copy; }
      return [...prev, qp];
    });
  };

  const upsertQuarterlyActual = (qa: QuarterlyActual) => {
    setQuarterlyActuals(prev => {
      const idx = prev.findIndex(a => a.plan_entry_id === qa.plan_entry_id && a.quarter_id === qa.quarter_id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = qa; return copy; }
      return [...prev, qa];
    });
  };

  const updateUomFactor = (uom: string, factor: number) => {
    setUomConfigs(prev => {
      const exists = prev.find(c => c.uom.toLowerCase() === uom.toLowerCase());
      if (exists) return prev.map(c => c.uom.toLowerCase() === uom.toLowerCase() ? { ...c, factor } : c);
      return [...prev, { uom, factor }];
    });
    showToast(`Conversion factor for ${uom} set to x${factor}. All beneficiary totals recompute live.`);
  };

  return (
    <AppContext.Provider value={{
      activeRoute, setActiveRoute, toastMessage, showToast,
      selectedNationalActivityId, setSelectedNationalActivityId,
      pendingAddPlanNationalActivityId, setPendingAddPlanNationalActivityId,
      strategicPriorities,
      nationalActivities, addNationalActivity, updateNationalActivity, deleteNationalActivity,
      regions, addRegion,
      zones, addZone,
      projects, quarters,
      planEntries, addPlanEntry, updatePlanEntry, deletePlanEntry,
      quarterlyPlans, upsertQuarterlyPlan,
      quarterlyActuals, upsertQuarterlyActual,
      uomConfigs, updateUomFactor,
      filters, setFilters, resetFilters, getFilteredPlanEntries,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};