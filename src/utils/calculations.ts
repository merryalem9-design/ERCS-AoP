import { PlanEntry, QuarterlyActual, UomFactorConfig } from '../types';

/** Sum of annual targets across a set of Plan Entries. */
export const sumTarget = (entries: PlanEntry[]): number =>
  entries.reduce((sum, e) => sum + e.annual_target, 0);

/** Sum of annual budgets across a set of Plan Entries. */
export const sumBudget = (entries: PlanEntry[]): number =>
  entries.reduce((sum, e) => sum + e.annual_budget, 0);

/**
 * Sum of quarterly actuals reported against the given Plan Entries.
 * quarterId === 'ALL' (or undefined) sums every quarter reported so far.
 */
export const sumActual = (
  entries: PlanEntry[],
  actuals: QuarterlyActual[],
  quarterId?: string
): number => {
  const ids = new Set(entries.map(e => e.id));
  return actuals
    .filter(a => ids.has(a.plan_entry_id))
    .filter(a => !quarterId || quarterId === 'ALL' || a.quarter_id === quarterId)
    .reduce((sum, a) => sum + a.actual, 0);
};

/** Sum of quarterly expenditure reported against the given Plan Entries. */
export const sumExpenditure = (
  entries: PlanEntry[],
  actuals: QuarterlyActual[],
  quarterId?: string
): number => {
  const ids = new Set(entries.map(e => e.id));
  return actuals
    .filter(a => ids.has(a.plan_entry_id))
    .filter(a => !quarterId || quarterId === 'ALL' || a.quarter_id === quarterId)
    .reduce((sum, a) => sum + a.expenditure, 0);
};

export const achievementPct = (actual: number, target: number): number =>
  target === 0 ? 0 : (actual / target) * 100;

export const budgetUtilizationPct = (spent: number, budget: number): number =>
  budget === 0 ? 0 : (spent / budget) * 100;

/**
 * THE CONVERSION STEP.
 * Turns a raw "actual" figure (reported in a UOM, e.g. 150 Persons trained)
 * into a beneficiaries-reached figure using the global conversion factor
 * for that UOM (e.g. x1 for Person, x5 for a Household representing 5 people).
 */
export const convertToBeneficiaries = (
  actual: number,
  uom: string,
  uomConfigs: UomFactorConfig[]
): number => {
  const config = uomConfigs.find(c => c.uom.toLowerCase() === uom.toLowerCase());
  return actual * (config ? config.factor : 0);
};

export const getStatusBadge = (achievement: number, hasActuals: boolean) => {
  if (!hasActuals) return { label: 'Planning', color: 'bg-slate-100 text-slate-700 border-slate-300' };
  if (achievement > 100) return { label: 'Overachieved', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
  if (achievement >= 100) return { label: 'Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  if (achievement >= 85) return { label: 'On Track', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  if (achievement >= 60) return { label: 'At Risk', color: 'bg-amber-100 text-amber-800 border-amber-300' };
  return { label: 'Behind', color: 'bg-rose-100 text-rose-800 border-rose-300' };
};
