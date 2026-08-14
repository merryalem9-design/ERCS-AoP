// ---------------------------------------------------------------------------
// SIMPLIFIED DATA MODEL
// The goal at this stage is to make one pipeline crystal clear:
//
//   Strategic Priority (grouping)
//     -> National Activity (data entry)
//       -> Plan Entry (data entry)
//         -> Quarterly Actual (data entry)
//           -> Beneficiaries = Actual x UOM Conversion Factor   (conversion)
//             -> Summed by Strategic Priority / National Activity / Region / Project (aggregation)
//               -> Report Page                                  (reporting)
//
// User roles and approval workflows have been removed for this stage so the
// core pipeline is not obscured. Strategic Priorities were reintroduced as a
// lightweight grouping layer above National Activity, used only for
// filtering/aggregation — no separate workflow attached to it.
// ---------------------------------------------------------------------------

/** Top-level grouping — a Strategic Priority that National Activities roll up into. */
export interface StrategicPriority {
  id: string;
  code: string;      // e.g. "SP1"
  name: string;       // e.g. "Disaster Preparedness and Response (DPR)"
  objective: string;  // e.g. "Strategy Objective 1.1: Enhance disaster preparedness measures..."
}

/** The top-level "what" — a National Activity with its own official annual target. */
export interface NationalActivity {
  id: string;
  strategic_priority_id: string; // links up to a StrategicPriority
  code: string;          // e.g. "Activity 1.1.8"
  description: string;
  uom: string;            // Unit of Measure, e.g. "Person", "House Hold (HH)"
  annual_target: number;  // Official national target for this activity
  annual_budget: number;  // Official national budget (ETB) for this activity
}

export interface Region { id: string; name: string; }
export interface Project { id: string; name: string; }

export type ScopeType = 'Regional' | 'Project';

/** The "how" — who is executing against a National Activity: a Region or a Project. */
export interface PlanEntry {
  id: string;
  national_activity_id: string;
  scope_type: ScopeType;
  region_id?: string;   // set when scope_type === 'Regional'
  project_id?: string;  // set when scope_type === 'Project'
  annual_target: number;
  annual_budget: number;
}

export type QuarterId = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export interface Quarter { id: QuarterId; label: string; }

/** Actual performance reported against a Plan Entry, for one quarter. */
export interface QuarterlyActual {
  id: string;
  plan_entry_id: string;
  quarter_id: QuarterId;
  actual: number;
  expenditure: number; // ETB spent
}

/** Global conversion table: Actual (in UOM units) x factor = Beneficiaries reached. */
export interface UomFactorConfig {
  uom: string;
  factor: number;
}

export interface FilterState {
  strategicPriorityId: string; // 'ALL' or a StrategicPriority id
  nationalActivityId: string;  // 'ALL' or a NationalActivity id
  regionId: string;            // 'ALL' or a Region id
  projectId: string;           // 'ALL' or a Project id
  quarterId: string;           // 'ALL' or a QuarterId
}
