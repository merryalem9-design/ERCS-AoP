// src/context/AppContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  StrategicPriority, NationalActivity, Region, Zone, Project, PlanEntry, Quarter, QuarterlyPlan, QuarterlyActual, UomFactorConfig, FilterState, UserRole,
} from '../types';
import {
  INITIAL_STRATEGIC_PRIORITIES, INITIAL_NATIONAL_ACTIVITIES, INITIAL_REGIONS, INITIAL_ZONES, INITIAL_PROJECTS, INITIAL_PLAN_ENTRIES,
  FISCAL_QUARTERS, INITIAL_QUARTERLY_PLANS, INITIAL_QUARTERLY_ACTUALS, INITIAL_UOM_CONFIGS,
} from '../data/seedData';
import { sumTarget, sumBudget } from '../utils/calculations';
import { buildActivityCode } from '../utils/activityCode';

interface AppContextType {
  activeRoute: string; setActiveRoute: (r: string) => void;
  currentRole: UserRole; setCurrentRole: (role: UserRole) => void;
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
  submitPlanEntry: (id: string) => void;
  approvePlanEntry: (id: string) => void;
  rejectPlanEntry: (id: string, reason?: string) => void;

  // Step 2 of the pipeline: Q1–Q4 breakdown of a Plan Entry's annual figure.
  quarterlyPlans: QuarterlyPlan[];
  upsertQuarterlyPlan: (qp: QuarterlyPlan) => void;

  quarterlyActuals: QuarterlyActual[];
  upsertQuarterlyActual: (qa: QuarterlyActual) => void;

  uomConfigs: UomFactorConfig[];
  updateUomFactor: (uom: string, factor: number) => void;

  filters: FilterState; setFilters: React.Dispatch<React.SetStateAction<FilterState>>; resetFilters: () => void;
  reportApprovalStatus: 'ALL' | 'Approved' | 'Draft'; setReportApprovalStatus: (status: 'ALL' | 'Approved' | 'Draft') => void;
  getFilteredPlanEntries: () => PlanEntry[];
}

const DEFAULT_FILTERS: FilterState = { strategicPriorityId: 'ALL', nationalActivityId: 'ALL', regionId: 'ALL', projectId: 'ALL', quarterId: 'ALL' };

const PERSISTENCE_KEY = 'ercs-aop-simplified-v2';

// Fills in activity_code/activity_name/etc. on legacy persisted Plan Entries
// that predate those fields. Uses the shared buildActivityCode helper (also
// used live by PlanPage's Add Plan wizard) so a migrated code can never
// drift from what the wizard itself would have generated for the same
// National Activity + Region/Project combination.
const migratePlanEntries = (raw: PlanEntry[]): PlanEntry[] => raw.map(pe => {
  const na = INITIAL_NATIONAL_ACTIVITIES.find(n => n.id === pe.national_activity_id);
  const label = pe.scope_type === 'Regional' ? INITIAL_REGIONS.find(r => r.id === pe.region_id)?.name : INITIAL_PROJECTS.find(p => p.id === pe.project_id)?.name;
  return {
    ...pe,
    activity_code: pe.activity_code || buildActivityCode(na, pe.scope_type, pe.region_id, pe.project_id, INITIAL_REGIONS, INITIAL_PROJECTS),
    activity_name: pe.activity_name || label || 'Execution Entry',
    activity_description: pe.activity_description || `Execution plan entry under ${na?.code || 'National Activity'}.`,
    approval_status: pe.approval_status || 'Approved',
  };
});

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
  const [currentRole, setCurrentRole] = useState<UserRole>(() => readPersisted('currentRole', 'National Activity AOP'));
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
  const [planEntries, setPlanEntries] = useState<PlanEntry[]>(() => migratePlanEntries(readPersisted('planEntries', INITIAL_PLAN_ENTRIES)));
  const [quarterlyPlans, setQuarterlyPlans] = useState<QuarterlyPlan[]>(() => readPersisted('quarterlyPlans', INITIAL_QUARTERLY_PLANS));
  const [quarterlyActuals, setQuarterlyActuals] = useState<QuarterlyActual[]>(() => readPersisted('quarterlyActuals', INITIAL_QUARTERLY_ACTUALS));
  const [uomConfigs, setUomConfigs] = useState<UomFactorConfig[]>(() => readPersisted('uomConfigs', INITIAL_UOM_CONFIGS));
  const [filters, setFilters] = useState<FilterState>(() => ({ ...DEFAULT_FILTERS, ...readPersisted('filters', DEFAULT_FILTERS) }));
  const [reportApprovalStatus, setReportApprovalStatus] = useState<'ALL' | 'Approved' | 'Draft'>(() => readPersisted('reportApprovalStatus', 'Approved'));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PERSISTENCE_KEY, JSON.stringify({
        activeRoute, currentRole, selectedNationalActivityId, nationalActivities, regions, zones, planEntries, quarterlyPlans, quarterlyActuals, uomConfigs, filters, reportApprovalStatus,
      }));
    } catch {
      // localStorage may be unavailable; in-memory state still works for the session.
    }
  }, [activeRoute, currentRole, selectedNationalActivityId, nationalActivities, regions, zones, planEntries, quarterlyPlans, quarterlyActuals, uomConfigs, filters, reportApprovalStatus]);

  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3000); };
  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const getFilteredPlanEntries = () => planEntries.filter(pe => {
    if (currentRole === 'Regional Coordinator' && pe.scope_type !== 'Regional') return false;
    if (currentRole === 'Project Coordinator' && pe.scope_type !== 'Project') return false;
    if (filters.strategicPriorityId !== 'ALL') {
      const na = nationalActivities.find(n => n.id === pe.national_activity_id);
      if (!na || na.strategic_priority_id !== filters.strategicPriorityId) return false;
    }
    if (filters.nationalActivityId !== 'ALL' && pe.national_activity_id !== filters.nationalActivityId) return false;
    if (filters.regionId !== 'ALL' && pe.region_id !== filters.regionId) return false;
    if (filters.projectId !== 'ALL' && pe.project_id !== filters.projectId) return false;
    return true;
  });

  const addNationalActivity = (na: NationalActivity) => {
    if (currentRole !== 'National Activity AOP') { showToast('Only the National Activity AOP can create National Activities.'); return; }
    setNationalActivities(prev => [...prev, na]);
    showToast(`National Activity ${na.code} created.`);
  };
  const updateNationalActivity = (na: NationalActivity) => {
    if (currentRole !== 'National Activity AOP') { showToast('Only the National Activity AOP can edit National Activities.'); return; }
    setNationalActivities(prev => prev.map(x => x.id === na.id ? na : x));
    showToast(`National Activity ${na.code} updated.`);
  };

  // Cascades the delete to EVERY dependent record — Plan Entries, their
  // Quarterly Plans, and their Quarterly Actuals — and clears any UI state
  // that referenced this National Activity by id, so nothing is left
  // pointing at an id that no longer exists anywhere.
  const deleteNationalActivity = (id: string) => {
    if (currentRole !== 'National Activity AOP') { showToast('Only the National Activity AOP can delete National Activities.'); return; }
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
  // National Activity ceilings are fixed parent limits. Plan Entries roll
  // up into Reports/Details, but they MUST NOT increase the parent's
  // annual_target / annual_budget ceiling.
  // ---------------------------------------------------------------------
  const getNationalActivityUsage = (nationalActivityId: string, entries: PlanEntry[]) => {
    const children = entries.filter(pe => pe.national_activity_id === nationalActivityId);
    return {
      target: sumTarget(children),
      budget: sumBudget(children),
    };
  };

  const getNationalActivityValidation = (nationalActivityId: string, entries: PlanEntry[]) => {
    const na = nationalActivities.find(n => n.id === nationalActivityId);
    if (!na) {
      return { ok: false, reason: 'The selected National Activity no longer exists.' };
    }

    const usage = getNationalActivityUsage(nationalActivityId, entries);
    const targetExceeded = usage.target > na.annual_target;
    const budgetExceeded = usage.budget > na.annual_budget;

    if (targetExceeded || budgetExceeded) {
      const reasons: string[] = [];
      if (targetExceeded) {
        reasons.push(
          `annual target ${usage.target.toLocaleString()} exceeds the National Activity target limit of ${na.annual_target.toLocaleString()} ${na.uom}`
        );
      }
      if (budgetExceeded) {
        reasons.push(
          `annual budget ETB ${usage.budget.toLocaleString()} exceeds the National Activity budget limit of ETB ${na.annual_budget.toLocaleString()}`
        );
      }
      return { ok: false, reason: reasons.join(' and ') + '.' };
    }

    return { ok: true, reason: '' };
  };

  const addPlanEntry = (pe: PlanEntry) => {
    if (currentRole === 'National Activity AOP') { showToast('National Activity AOP creates National Activities; Regional and Project Coordinators create execution entries.'); return; }
    if (currentRole === 'Regional Coordinator' && pe.scope_type !== 'Regional') { showToast('Regional Coordinator can only create Regional entries.'); return; }
    if (currentRole === 'Project Coordinator' && pe.scope_type !== 'Project') { showToast('Project Coordinator can only create Project entries.'); return; }

    const next = [...planEntries, pe];
    const validation = getNationalActivityValidation(pe.national_activity_id, next);
    if (!validation.ok) {
      showToast(`Plan entry not saved: ${validation.reason}`);
      return;
    }

    setPlanEntries(next);
    const na = nationalActivities.find(n => n.id === pe.national_activity_id);
    showToast(na
      ? `Plan entry added and linked to ${na.code}. National Activity Target/Budget ceilings remain unchanged.`
      : 'Plan entry added.');
  };

  const updatePlanEntry = (pe: PlanEntry) => {
    if (currentRole === 'National Activity AOP') { showToast('National Activity AOP does not edit execution entries.'); return; }
    if (currentRole === 'Regional Coordinator' && pe.scope_type !== 'Regional') { showToast('Regional Coordinator can only edit Regional entries.'); return; }
    if (currentRole === 'Project Coordinator' && pe.scope_type !== 'Project') { showToast('Project Coordinator can only edit Project entries.'); return; }
    const old = planEntries.find(x => x.id === pe.id);
    const next = planEntries.map(x => (x.id === pe.id ? pe : x));

    const newParentValidation = getNationalActivityValidation(pe.national_activity_id, next);
    if (!newParentValidation.ok) {
      showToast(`Plan entry not updated: ${newParentValidation.reason}`);
      return;
    }

    if (old && old.national_activity_id !== pe.national_activity_id) {
      const oldParentValidation = getNationalActivityValidation(old.national_activity_id, next);
      if (!oldParentValidation.ok) {
        showToast(`Plan entry not updated: ${oldParentValidation.reason}`);
        return;
      }
    }

    setPlanEntries(next);
    const na = nationalActivities.find(n => n.id === pe.national_activity_id);
    showToast(`Plan entry updated. National Activity ${na?.code || ''} Target/Budget ceilings remain unchanged.`);
  };

  // Deleting a Plan Entry cascades to its Quarterly Plan AND its Quarterly
  // Actuals — both are meaningless without the Plan Entry they measure.
  const deletePlanEntry = (id: string) => {
    if (currentRole === 'National Activity AOP') { showToast('National Activity AOP does not delete execution entries.'); return; }
    const old = planEntries.find(x => x.id === id);
    if (!old) return;
    if (currentRole === 'Regional Coordinator' && old.scope_type !== 'Regional') { showToast('Regional Coordinator can only delete Regional entries.'); return; }
    if (currentRole === 'Project Coordinator' && old.scope_type !== 'Project') { showToast('Project Coordinator can only delete Project entries.'); return; }
    const next = planEntries.filter(x => x.id !== id);
    setPlanEntries(next);
    setQuarterlyPlans(prev => prev.filter(qp => qp.plan_entry_id !== id));
    setQuarterlyActuals(prev => prev.filter(a => a.plan_entry_id !== id));
    showToast('Plan entry, its quarterly plan and its quarterly actuals deleted. National Activity Target/Budget ceilings remain unchanged.');
  };

  const submitPlanEntry = (id: string) => {
    if (currentRole === 'National Activity AOP') { showToast('National Activity AOP approves or rejects proposals; Coordinators submit them.'); return; }
    const entry = planEntries.find(pe => pe.id === id);
    if (!entry) { showToast('Plan entry not found.'); return; }

    const validation = getNationalActivityValidation(entry.national_activity_id, planEntries);
    if (!validation.ok) {
      showToast(`Cannot submit for approval: ${validation.reason}`);
      return;
    }

    setPlanEntries(prev => prev.map(pe => pe.id === id
      ? { ...pe, approval_status: 'Pending Approval', submitted_at: new Date().toISOString(), rejection_reason: undefined }
      : pe
    ));
    showToast('Plan entry submitted to the National Activity AOP for approval.');
  };

  const approvePlanEntry = (id: string) => {
    if (currentRole !== 'National Activity AOP') { showToast('Only the National Activity AOP can approve entries.'); return; }
    const entry = planEntries.find(pe => pe.id === id);
    if (!entry) { showToast('Plan entry not found.'); return; }

    const validation = getNationalActivityValidation(entry.national_activity_id, planEntries);
    if (!validation.ok) {
      showToast(`Cannot approve: ${validation.reason}`);
      return;
    }

    setPlanEntries(prev => prev.map(pe => pe.id === id
      ? { ...pe, approval_status: 'Approved', reviewed_at: new Date().toISOString(), rejection_reason: undefined }
      : pe
    ));
    showToast('Plan entry approved. It is now included in the live approved report.');
  };

  const rejectPlanEntry = (id: string, reason = 'Rejected by National Activity AOP.') => {
    if (currentRole !== 'National Activity AOP') { showToast('Only the National Activity AOP can reject entries.'); return; }
    setPlanEntries(prev => prev.map(pe => pe.id === id
      ? { ...pe, approval_status: 'Rejected', reviewed_at: new Date().toISOString(), rejection_reason: reason }
      : pe
    ));
    showToast('Plan entry rejected. It remains in Draft reports for review.');
  };

  // Stores one quarter's planned target/budget for a Plan Entry. Deliberately
  // does NOT write back to the Plan Entry's own annual_target/annual_budget —
  // see the QuarterlyPlan type comment for why. The Quarterly Plan page reads
  // this directly alongside the Plan Entry's annual figure to show whether
  // they reconcile.
  const upsertQuarterlyPlan = (qp: QuarterlyPlan) => {
    if (currentRole === 'National Activity AOP') { showToast('Quarterly Plan entries are created by Regional and Project Coordinators.'); return; }
    setQuarterlyPlans(prev => {
      const idx = prev.findIndex(x => x.plan_entry_id === qp.plan_entry_id && x.quarter_id === qp.quarter_id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = qp; return copy; }
      return [...prev, qp];
    });
  };

  const upsertQuarterlyActual = (qa: QuarterlyActual) => {
    if (currentRole === 'National Activity AOP') { showToast('Quarterly Actual entries are created by Regional and Project Coordinators.'); return; }
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
      activeRoute, setActiveRoute, currentRole, setCurrentRole, toastMessage, showToast,
      selectedNationalActivityId, setSelectedNationalActivityId,
      pendingAddPlanNationalActivityId, setPendingAddPlanNationalActivityId,
      strategicPriorities,
      nationalActivities, addNationalActivity, updateNationalActivity, deleteNationalActivity,
      regions, addRegion,
      zones, addZone,
      projects, quarters,
      planEntries, addPlanEntry, updatePlanEntry, deletePlanEntry, submitPlanEntry, approvePlanEntry, rejectPlanEntry,
      quarterlyPlans, upsertQuarterlyPlan,
      quarterlyActuals, upsertQuarterlyActual,
      uomConfigs, updateUomFactor,
      filters, setFilters, resetFilters, reportApprovalStatus, setReportApprovalStatus, getFilteredPlanEntries,
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