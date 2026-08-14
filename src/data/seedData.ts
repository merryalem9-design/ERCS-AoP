import {
  StrategicPriority, NationalActivity, Region, Project, PlanEntry, Quarter, QuarterlyActual, UomFactorConfig,
} from '../types';

// Top-level grouping used purely for filtering/aggregation — each National
// Activity below is tagged with exactly one of these. Sourced from the ERCS
// AoP & Project Alignment Framework: only one Strategic Priority (and one
// Strategy Objective under it) is actually in use for the current data.
export const INITIAL_STRATEGIC_PRIORITIES: StrategicPriority[] = [
  {
    id: 'sp-1',
    code: 'SP1',
    name: 'Disaster Preparedness and Response (DPR)',
    objective: 'Strategy Objective 1.1: Enhance disaster preparedness measures and early action capabilities',
  },
];

export const INITIAL_NATIONAL_ACTIVITIES: NationalActivity[] = [
  // SP1 — Disaster Preparedness and Response (DPR)
  { id: 'na-1-1-3', strategic_priority_id: 'sp-1', code: 'Activity 1.1.3', description: 'Support capacity building on Anticipatory Action (AA) and FbF', uom: 'Person', annual_target: 200, annual_budget: 1_800_000 },
  { id: 'na-1-1-8', strategic_priority_id: 'sp-1', code: 'Activity 1.1.8', description: 'Provide BDRT training and establish response teams at branches', uom: 'Person', annual_target: 107, annual_budget: 3_580_000 },
  { id: 'na-1-2-1', strategic_priority_id: 'sp-1', code: 'Activity 1.2.1', description: 'Emergency food and NFI distribution to vulnerable households', uom: 'House Hold (HH)', annual_target: 1000, annual_budget: 5_200_000 },
];

export const INITIAL_REGIONS: Region[] = [
  { id: 'reg-1', name: 'Amhara' }, { id: 'reg-2', name: 'Oromia' }, { id: 'reg-3', name: 'Tigray' },
  { id: 'reg-4', name: 'Benshangul Gumuz' }, { id: 'reg-5', name: 'SNNPR' }, { id: 'reg-6', name: 'Somali' },
  { id: 'reg-7', name: 'Gambela' }, { id: 'reg-8', name: 'Harari' }, { id: 'reg-9', name: 'Afar' },
  { id: 'reg-10', name: 'Addis Ababa' }, { id: 'reg-11', name: 'Dire Dawa' },
];

export const INITIAL_PROJECTS: Project[] = [
  { id: 'proj-1', name: 'ECHO-HIP' }, { id: 'proj-2', name: 'DRC' }, { id: 'proj-3', name: 'NLRC' },
  { id: 'proj-4', name: 'HNS' }, { id: 'proj-5', name: 'EAP/Forecast-based Financing' },
];

// Each group below sums exactly to its National Activity's annual_target / annual_budget,
// so the Report page's reconciliation is visibly exact on first load.
export const INITIAL_PLAN_ENTRIES: PlanEntry[] = [
  // Activity 1.1.3 -> 2 Project entries: 100+100=200 target, 800k+1,000k=1,800,000 budget
  { id: 'pe-113-1', national_activity_id: 'na-1-1-3', scope_type: 'Project', project_id: 'proj-4', annual_target: 100, annual_budget: 800_000 },
  { id: 'pe-113-2', national_activity_id: 'na-1-1-3', scope_type: 'Project', project_id: 'proj-5', annual_target: 100, annual_budget: 1_000_000 },

  // Activity 1.1.8 -> 2 Project + 3 Regional entries: 1+1+35+40+30=107, budgets sum to 3,580,000
  { id: 'pe-118-1', national_activity_id: 'na-1-1-8', scope_type: 'Project', project_id: 'proj-1', annual_target: 1, annual_budget: 350_000 },
  { id: 'pe-118-2', national_activity_id: 'na-1-1-8', scope_type: 'Project', project_id: 'proj-2', annual_target: 1, annual_budget: 430_000 },
  { id: 'pe-118-3', national_activity_id: 'na-1-1-8', scope_type: 'Regional', region_id: 'reg-1', annual_target: 35, annual_budget: 1_000_000 },
  { id: 'pe-118-4', national_activity_id: 'na-1-1-8', scope_type: 'Regional', region_id: 'reg-2', annual_target: 40, annual_budget: 1_000_000 },
  { id: 'pe-118-5', national_activity_id: 'na-1-1-8', scope_type: 'Regional', region_id: 'reg-3', annual_target: 30, annual_budget: 800_000 },

  // Activity 1.2.1 -> 3 Project entries: 500+300+200=1000 target, budgets sum to 5,200,000
  { id: 'pe-121-1', national_activity_id: 'na-1-2-1', scope_type: 'Project', project_id: 'proj-1', annual_target: 500, annual_budget: 2_600_000 },
  { id: 'pe-121-2', national_activity_id: 'na-1-2-1', scope_type: 'Project', project_id: 'proj-2', annual_target: 300, annual_budget: 1_560_000 },
  { id: 'pe-121-3', national_activity_id: 'na-1-2-1', scope_type: 'Project', project_id: 'proj-3', annual_target: 200, annual_budget: 1_040_000 },
];

export const FISCAL_QUARTERS: Quarter[] = [
  { id: 'Q1', label: 'Q1 (Jul-Sep)' },
  { id: 'Q2', label: 'Q2 (Oct-Dec)' },
  { id: 'Q3', label: 'Q3 (Jan-Mar)' },
  { id: 'Q4', label: 'Q4 (Apr-Jun)' },
];

export const INITIAL_QUARTERLY_ACTUALS: QuarterlyActual[] = [
  { id: 'qa-1', plan_entry_id: 'pe-121-1', quarter_id: 'Q1', actual: 150, expenditure: 800_000 },
];

// The Conversion table: this is the one multiplier that turns raw "Actual" units
// into "Beneficiaries" on the Report page.
export const INITIAL_UOM_CONFIGS: UomFactorConfig[] = [
  { uom: 'Person', factor: 1 },
  { uom: 'House Hold (HH)', factor: 5 },
];
