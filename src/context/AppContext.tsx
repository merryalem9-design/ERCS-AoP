import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  StrategicPriority, NationalActivity, Region, Zone, Project, PlanEntry, Quarter, QuarterlyActual, UomFactorConfig, FilterState,
} from '../types';
import {
  INITIAL_STRATEGIC_PRIORITIES, INITIAL_NATIONAL_ACTIVITIES, INITIAL_REGIONS, INITIAL_ZONES, INITIAL_PROJECTS, INITIAL_PLAN_ENTRIES,
  FISCAL_QUARTERS, INITIAL_QUARTERLY_ACTUALS, INITIAL_UOM_CONFIGS,
} from '../data/seedData';

interface AppContextType {
  activeRoute: string; setActiveRoute: (r: string) => void;
  toastMessage: string | null; showToast: (msg: string) => void;

  // Which National Activity is being viewed on the drill-down detail page.
  selectedNationalActivityId: string | null; setSelectedNationalActivityId: (id: string | null) => void;

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

  const [strategicPriorities] = useState<StrategicPriority[]>(INITIAL_STRATEGIC_PRIORITIES);
  const [nationalActivities, setNationalActivities] = useState<NationalActivity[]>(() => readPersisted('nationalActivities', INITIAL_NATIONAL_ACTIVITIES));
  const [regions, setRegions] = useState<Region[]>(() => readPersisted('regions', INITIAL_REGIONS));
  const [zones, setZones] = useState<Zone[]>(() => readPersisted('zones', INITIAL_ZONES));
  const [projects] = useState<Project[]>(INITIAL_PROJECTS);
  const [quarters] = useState<Quarter[]>(FISCAL_QUARTERS);
  const [planEntries, setPlanEntries] = useState<PlanEntry[]>(() => readPersisted('planEntries', INITIAL_PLAN_ENTRIES));
  const [quarterlyActuals, setQuarterlyActuals] = useState<QuarterlyActual[]>(() => readPersisted('quarterlyActuals', INITIAL_QUARTERLY_ACTUALS));
  const [uomConfigs, setUomConfigs] = useState<UomFactorConfig[]>(() => readPersisted('uomConfigs', INITIAL_UOM_CONFIGS));
  const [filters, setFilters] = useState<FilterState>(() => ({ ...DEFAULT_FILTERS, ...readPersisted('filters', DEFAULT_FILTERS) }));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PERSISTENCE_KEY, JSON.stringify({
        activeRoute, selectedNationalActivityId, nationalActivities, regions, zones, planEntries, quarterlyActuals, uomConfigs, filters,
      }));
    } catch {
      // localStorage may be unavailable; in-memory state still works for the session.
    }
  }, [activeRoute, selectedNationalActivityId, nationalActivities, regions, zones, planEntries, quarterlyActuals, uomConfigs, filters]);

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
  const deleteNationalActivity = (id: string) => {
    const childIds = planEntries.filter(pe => pe.national_activity_id === id).map(pe => pe.id);
    setPlanEntries(prev => prev.filter(pe => pe.national_activity_id !== id));
    setQuarterlyActuals(prev => prev.filter(a => !childIds.includes(a.plan_entry_id)));
    setNationalActivities(prev => prev.filter(x => x.id !== id));
    showToast('National Activity and its linked plan/actual records deleted.');
  };

  const addRegion = (r: Region) => { setRegions(prev => [...prev, r]); showToast(`Region ${r.name} added.`); };
  const addZone = (z: Zone) => { setZones(prev => [...prev, z]); showToast(`Zone ${z.name} added.`); };

  const addPlanEntry = (pe: PlanEntry) => { setPlanEntries(prev => [...prev, pe]); showToast('Plan entry added.'); };
  const updatePlanEntry = (pe: PlanEntry) => { setPlanEntries(prev => prev.map(x => x.id === pe.id ? pe : x)); showToast('Plan entry updated.'); };
  const deletePlanEntry = (id: string) => {
    setPlanEntries(prev => prev.filter(x => x.id !== id));
    setQuarterlyActuals(prev => prev.filter(a => a.plan_entry_id !== id));
    showToast('Plan entry and its quarterly actuals deleted.');
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
      strategicPriorities,
      nationalActivities, addNationalActivity, updateNationalActivity, deleteNationalActivity,
      regions, addRegion,
      zones, addZone,
      projects, quarters,
      planEntries, addPlanEntry, updatePlanEntry, deletePlanEntry,
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