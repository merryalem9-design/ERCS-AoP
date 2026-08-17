import {
  StrategicPriority, NationalActivity, Region, Zone, Project, PlanEntry, Quarter, QuarterlyPlan, QuarterlyActual, UomFactorConfig,
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
  { id: 'na-1-1-3', strategic_priority_id: 'sp-1', code: 'Activity 1.1.3', description: 'Support capacity building on Anticipatory Action (AA) and FbF', uom: 'Person', responsibility: 'HQ', annual_target: 200, annual_budget: 1_800_000 },
  { id: 'na-1-1-8', strategic_priority_id: 'sp-1', code: 'Activity 1.1.8', description: 'Provide BDRT training and establish response teams at branches', uom: 'Person', responsibility: 'Both', annual_target: 107, annual_budget: 3_580_000 },
  { id: 'na-1-2-1', strategic_priority_id: 'sp-1', code: 'Activity 1.2.1', description: 'Emergency food and NFI distribution to vulnerable households', uom: 'House Hold (HH)', responsibility: 'Branch', annual_target: 1000, annual_budget: 5_200_000 },
];

export const INITIAL_REGIONS: Region[] = [
  { id: 'reg-1', name: 'Amhara' }, { id: 'reg-2', name: 'Oromia' }, { id: 'reg-3', name: 'Tigray' },
  { id: 'reg-4', name: 'Benshangul Gumuz' }, { id: 'reg-5', name: 'SNNPR' }, { id: 'reg-6', name: 'Somali' },
  { id: 'reg-7', name: 'Gambela' }, { id: 'reg-8', name: 'Harari' }, { id: 'reg-9', name: 'Afar' },
  { id: 'reg-10', name: 'Addis Ababa' }, { id: 'reg-11', name: 'Dire Dawa' },
];

// Starter Zone data per Region (Region > Zone). Not exhaustive — use the
// "+ Add Zone" control in the National Activity form to add any that are
// missing; new entries persist alongside the rest of the app's data.
export const INITIAL_ZONES: Zone[] = [
  // Amhara
  { id: 'zone-1-1', region_id: 'reg-1', name: 'North Gondar' },
  { id: 'zone-1-2', region_id: 'reg-1', name: 'South Wollo' },
  { id: 'zone-1-3', region_id: 'reg-1', name: 'East Gojjam' },
  // Oromia
  { id: 'zone-2-1', region_id: 'reg-2', name: 'West Shewa' },
  { id: 'zone-2-2', region_id: 'reg-2', name: 'Jimma' },
  { id: 'zone-2-3', region_id: 'reg-2', name: 'Arsi' },
  // Tigray
  { id: 'zone-3-1', region_id: 'reg-3', name: 'Central Tigray' },
  { id: 'zone-3-2', region_id: 'reg-3', name: 'Eastern Tigray' },
  // Benshangul Gumuz
  { id: 'zone-4-1', region_id: 'reg-4', name: 'Assosa' },
  { id: 'zone-4-2', region_id: 'reg-4', name: 'Metekel' },
  // SNNPR
  { id: 'zone-5-1', region_id: 'reg-5', name: 'Gurage' },
  { id: 'zone-5-2', region_id: 'reg-5', name: 'Wolayta' },
  // Somali
  { id: 'zone-6-1', region_id: 'reg-6', name: 'Jarar' },
  { id: 'zone-6-2', region_id: 'reg-6', name: 'Shabelle' },
  // Gambela
  { id: 'zone-7-1', region_id: 'reg-7', name: 'Agnuak' },
  { id: 'zone-7-2', region_id: 'reg-7', name: 'Nuer' },
  // Harari
  { id: 'zone-8-1', region_id: 'reg-8', name: 'Harari' },
  // Afar
  { id: 'zone-9-1', region_id: 'reg-9', name: 'Zone 1' },
  { id: 'zone-9-2', region_id: 'reg-9', name: 'Zone 2' },
  // Addis Ababa
  { id: 'zone-10-1', region_id: 'reg-10', name: 'Addis Ababa' },
  // Dire Dawa
  { id: 'zone-11-1', region_id: 'reg-11', name: 'Dire Dawa' },
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

// FIX: this export was missing entirely — AppContext.tsx imports
// INITIAL_QUARTERLY_PLANS, but seedData.ts never declared it, which is the
// exact "has no exported member" TS error. That left `quarterlyPlans` seeded
// from `undefined` on first load, so every Plan Entry showed "no Quarterly
// Plan set" with everything reading 0.
//
// Each entry's four quarters sum exactly to that Plan Entry's own
// annual_target / annual_budget (same reconciled-on-first-load convention
// used by INITIAL_PLAN_ENTRIES above), so the Quarterly Plan page, the
// National Activity Detail page and Quarterly Actual Entry all show correct,
// reconciled figures immediately — and update live from there as normal.
export const INITIAL_QUARTERLY_PLANS: QuarterlyPlan[] = [
  // Activity 1.1.3
  { id: 'qp-pe-113-1-Q1', plan_entry_id: 'pe-113-1', quarter_id: 'Q1', target: 25, budget: 200_000 },
  { id: 'qp-pe-113-1-Q2', plan_entry_id: 'pe-113-1', quarter_id: 'Q2', target: 25, budget: 200_000 },
  { id: 'qp-pe-113-1-Q3', plan_entry_id: 'pe-113-1', quarter_id: 'Q3', target: 25, budget: 200_000 },
  { id: 'qp-pe-113-1-Q4', plan_entry_id: 'pe-113-1', quarter_id: 'Q4', target: 25, budget: 200_000 },

  { id: 'qp-pe-113-2-Q1', plan_entry_id: 'pe-113-2', quarter_id: 'Q1', target: 25, budget: 250_000 },
  { id: 'qp-pe-113-2-Q2', plan_entry_id: 'pe-113-2', quarter_id: 'Q2', target: 25, budget: 250_000 },
  { id: 'qp-pe-113-2-Q3', plan_entry_id: 'pe-113-2', quarter_id: 'Q3', target: 25, budget: 250_000 },
  { id: 'qp-pe-113-2-Q4', plan_entry_id: 'pe-113-2', quarter_id: 'Q4', target: 25, budget: 250_000 },

  // Activity 1.1.8
  { id: 'qp-pe-118-1-Q1', plan_entry_id: 'pe-118-1', quarter_id: 'Q1', target: 0, budget: 87_500 },
  { id: 'qp-pe-118-1-Q2', plan_entry_id: 'pe-118-1', quarter_id: 'Q2', target: 0, budget: 87_500 },
  { id: 'qp-pe-118-1-Q3', plan_entry_id: 'pe-118-1', quarter_id: 'Q3', target: 0, budget: 87_500 },
  { id: 'qp-pe-118-1-Q4', plan_entry_id: 'pe-118-1', quarter_id: 'Q4', target: 1, budget: 87_500 },

  { id: 'qp-pe-118-2-Q1', plan_entry_id: 'pe-118-2', quarter_id: 'Q1', target: 0, budget: 107_500 },
  { id: 'qp-pe-118-2-Q2', plan_entry_id: 'pe-118-2', quarter_id: 'Q2', target: 0, budget: 107_500 },
  { id: 'qp-pe-118-2-Q3', plan_entry_id: 'pe-118-2', quarter_id: 'Q3', target: 0, budget: 107_500 },
  { id: 'qp-pe-118-2-Q4', plan_entry_id: 'pe-118-2', quarter_id: 'Q4', target: 1, budget: 107_500 },

  { id: 'qp-pe-118-3-Q1', plan_entry_id: 'pe-118-3', quarter_id: 'Q1', target: 8, budget: 250_000 },
  { id: 'qp-pe-118-3-Q2', plan_entry_id: 'pe-118-3', quarter_id: 'Q2', target: 8, budget: 250_000 },
  { id: 'qp-pe-118-3-Q3', plan_entry_id: 'pe-118-3', quarter_id: 'Q3', target: 8, budget: 250_000 },
  { id: 'qp-pe-118-3-Q4', plan_entry_id: 'pe-118-3', quarter_id: 'Q4', target: 11, budget: 250_000 },

  { id: 'qp-pe-118-4-Q1', plan_entry_id: 'pe-118-4', quarter_id: 'Q1', target: 10, budget: 250_000 },
  { id: 'qp-pe-118-4-Q2', plan_entry_id: 'pe-118-4', quarter_id: 'Q2', target: 10, budget: 250_000 },
  { id: 'qp-pe-118-4-Q3', plan_entry_id: 'pe-118-4', quarter_id: 'Q3', target: 10, budget: 250_000 },
  { id: 'qp-pe-118-4-Q4', plan_entry_id: 'pe-118-4', quarter_id: 'Q4', target: 10, budget: 250_000 },

  { id: 'qp-pe-118-5-Q1', plan_entry_id: 'pe-118-5', quarter_id: 'Q1', target: 7, budget: 200_000 },
  { id: 'qp-pe-118-5-Q2', plan_entry_id: 'pe-118-5', quarter_id: 'Q2', target: 7, budget: 200_000 },
  { id: 'qp-pe-118-5-Q3', plan_entry_id: 'pe-118-5', quarter_id: 'Q3', target: 7, budget: 200_000 },
  { id: 'qp-pe-118-5-Q4', plan_entry_id: 'pe-118-5', quarter_id: 'Q4', target: 9, budget: 200_000 },

  // Activity 1.2.1
  { id: 'qp-pe-121-1-Q1', plan_entry_id: 'pe-121-1', quarter_id: 'Q1', target: 125, budget: 650_000 },
  { id: 'qp-pe-121-1-Q2', plan_entry_id: 'pe-121-1', quarter_id: 'Q2', target: 125, budget: 650_000 },
  { id: 'qp-pe-121-1-Q3', plan_entry_id: 'pe-121-1', quarter_id: 'Q3', target: 125, budget: 650_000 },
  { id: 'qp-pe-121-1-Q4', plan_entry_id: 'pe-121-1', quarter_id: 'Q4', target: 125, budget: 650_000 },

  { id: 'qp-pe-121-2-Q1', plan_entry_id: 'pe-121-2', quarter_id: 'Q1', target: 75, budget: 390_000 },
  { id: 'qp-pe-121-2-Q2', plan_entry_id: 'pe-121-2', quarter_id: 'Q2', target: 75, budget: 390_000 },
  { id: 'qp-pe-121-2-Q3', plan_entry_id: 'pe-121-2', quarter_id: 'Q3', target: 75, budget: 390_000 },
  { id: 'qp-pe-121-2-Q4', plan_entry_id: 'pe-121-2', quarter_id: 'Q4', target: 75, budget: 390_000 },

  { id: 'qp-pe-121-3-Q1', plan_entry_id: 'pe-121-3', quarter_id: 'Q1', target: 50, budget: 260_000 },
  { id: 'qp-pe-121-3-Q2', plan_entry_id: 'pe-121-3', quarter_id: 'Q2', target: 50, budget: 260_000 },
  { id: 'qp-pe-121-3-Q3', plan_entry_id: 'pe-121-3', quarter_id: 'Q3', target: 50, budget: 260_000 },
  { id: 'qp-pe-121-3-Q4', plan_entry_id: 'pe-121-3', quarter_id: 'Q4', target: 50, budget: 260_000 },
];

export const INITIAL_QUARTERLY_ACTUALS: QuarterlyActual[] = [
  { id: 'qa-1', plan_entry_id: 'pe-121-1', quarter_id: 'Q1', actual: 150, expenditure: 800_000 },
];

// The Conversion table: this is the one multiplier that turns raw "Actual" units
// into "Beneficiaries" on the Report page.
export const INITIAL_UOM_CONFIGS: UomFactorConfig[] = [
  { uom: 'Person', factor: 1 },
  { uom: 'House Hold (HH)', factor: 5 },
  { uom: '# of MHCP', factor: 1 },
  { uom: '# of assessment', factor: 1 },
  { uom: '# of Policy, guidelines & SOP', factor: 1 },
  { uom: '# of warehouse', factor: 1 },
  { uom: '# of people trained', factor: 1 },
  { uom: '# of established EOCs', factor: 1 },





];
