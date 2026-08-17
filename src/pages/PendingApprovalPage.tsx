import React from 'react';
import { useApp } from '../context/AppContext';
import { ApprovalStatus } from '../types';
import { CheckCircle2, XCircle, Clock3, Inbox, FileText } from 'lucide-react';

const statusClass: Record<ApprovalStatus, string> = {
  Draft: 'bg-slate-100 text-slate-700 border-slate-300',
  'Pending Approval': 'bg-amber-100 text-amber-800 border-amber-300',
  Approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Rejected: 'bg-rose-100 text-rose-800 border-rose-300',
};

export const PendingApprovalPage: React.FC = () => {
  const { currentRole, planEntries, nationalActivities, regions, projects, approvePlanEntry, rejectPlanEntry } = useApp();

  if (currentRole !== 'National Activity AOP') {
    return <div className="bg-white rounded-xl border p-8 text-center text-xs text-slate-500">This page is only available to the National Activity AOP role.</div>;
  }

  const pending = planEntries.filter(pe => pe.approval_status === 'Pending Approval');
  const draftCount = planEntries.filter(pe => pe.approval_status !== 'Approved').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800">Pending Approval</h2>
        <p className="text-xs text-slate-500 mt-1">Review Regional and Project plan proposals submitted by coordinators. Approval moves an entry into the real report; rejection keeps it outside the approved report and marks it for revision.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500"><Clock3 className="w-4 h-4" /> Pending</div><div className="text-2xl font-black mt-2">{pending.length}</div></div>
        <div className="bg-white rounded-xl border shadow-sm p-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500"><Inbox className="w-4 h-4" /> Non-approved</div><div className="text-2xl font-black mt-2">{draftCount}</div></div>
        <div className="bg-white rounded-xl border shadow-sm p-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500"><CheckCircle2 className="w-4 h-4" /> Approved</div><div className="text-2xl font-black mt-2">{planEntries.filter(pe => pe.approval_status === 'Approved').length}</div></div>
      </div>

      <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><FileText className="w-4 h-4 text-ercs-red" /> Submitted Proposals</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b text-slate-600 uppercase font-bold">
              <tr>
                <th className="p-3">Activity Code</th>
                <th className="p-3">Activity Description</th>
                <th className="p-3">Executed By</th>
                <th className="p-3 text-right">Target</th>
                <th className="p-3 text-right">Budget</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pending.map(pe => {
                const na = nationalActivities.find(na => na.id === pe.national_activity_id);
                const scopeName = pe.scope_type === 'Regional' ? regions.find(r => r.id === pe.region_id)?.name : projects.find(p => p.id === pe.project_id)?.name;
                return (
                  <tr key={pe.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-ercs-red">{pe.activity_code}</td>
                    <td className="p-3 min-w-72"><div className="font-bold text-slate-800">{pe.activity_name}</div><div className="text-[10px] text-slate-500 mt-0.5">{pe.activity_description}</div></td>
                    <td className="p-3"><span className="font-semibold">{scopeName || '—'}</span><div className="text-[10px] text-slate-400">{pe.scope_type}</div></td>
                    <td className="p-3 text-right font-bold">{pe.annual_target.toLocaleString()} {na?.uom}</td>
                    <td className="p-3 text-right">ETB {pe.annual_budget.toLocaleString()}</td>
                    <td className="p-3 text-center"><span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusClass[pe.approval_status]}`}>{pe.approval_status}</span></td>
                    <td className="p-3"><div className="flex justify-center gap-2"><button onClick={() => approvePlanEntry(pe.id)} className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approve</button><button onClick={() => rejectPlanEntry(pe.id)} className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> Reject</button></div></td>
                  </tr>
                );
              })}
              {pending.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500">There are no submitted plan entries waiting for approval.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
