import React from 'react';
import { CounterfactualBranch, TargetComparisonReport } from '../types/simulation.ts';

interface CounterfactualTreeViewerProps {
  branches: CounterfactualBranch[];
  activeBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onForkBranch: () => void;
  branchComparisons: Record<string, TargetComparisonReport | null>;
  onRunComparatorForAll: () => void;
}

export const CounterfactualTreeViewer: React.FC<CounterfactualTreeViewerProps> = ({
  branches,
  activeBranchId,
  onSelectBranch,
  onForkBranch,
  branchComparisons,
  onRunComparatorForAll,
}) => {
  return (
    <div className="w-full h-full bg-slate-950 rounded-lg p-5 border border-slate-800/80 overflow-y-auto font-mono flex flex-col">
      {/* Header Deck */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-5 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
            COUNTERFACTUAL WORLDS // MULTIVERSE BIFURCATION TREE
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Preserved branch lineages as experimental control groups across phase transitions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onForkBranch}
            className="px-3 py-1.5 text-xs font-medium rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            + FORK COUNTERFACTUAL BRANCH
          </button>
          <button
            onClick={onRunComparatorForAll}
            className="px-3 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            COMPARE SEALED TARGET ACROSS ALL WORLDS
          </button>
        </div>
      </div>

      {/* Branch Cards Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {branches.map((branch) => {
          const isActive = branch.branch_id === activeBranchId;
          const comparison = branchComparisons[branch.branch_id];

          return (
            <div
              key={branch.branch_id}
              onClick={() => onSelectBranch(branch.branch_id)}
              className={`p-4 rounded-lg cursor-pointer transition-all border ${
                isActive
                  ? 'bg-slate-900 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <span>{branch.name}</span>
                    {isActive && (
                      <span className="text-[10px] text-sky-400 font-normal">● ACTIVE HEAD</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    FORK: T={branch.fork_timestep} · CURRENT: T={branch.current_timestep}
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    branch.status === 'active'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                      : branch.status === 'stabilized'
                      ? 'bg-sky-950/80 text-sky-400 border border-sky-800/60'
                      : branch.status === 'hyper_locked'
                      ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                      : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                  }`}
                >
                  {branch.status.toUpperCase()}
                </span>
              </div>

              <div className="text-xs text-slate-400 mb-3 line-clamp-2">
                Trigger: {branch.divergence_trigger}
              </div>

              {/* Telemetry Snapshot */}
              <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800/80 space-y-1.5 text-[11px] mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Degree of Freedom:</span>
                  <span className="text-slate-300 font-bold">{branch.freedom_metric_snapshot.degree_of_freedom_ratio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Constraint Index:</span>
                  <span className="text-slate-300">{branch.freedom_metric_snapshot.constraint_index}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Stability Score:</span>
                  <span className="text-emerald-400">{branch.stability_score}</span>
                </div>
              </div>

              {/* Target Comparator Cross-Branch Assessment */}
              <div className="border-t border-slate-800/80 pt-2 flex justify-between items-center text-[10px]">
                <span className="text-slate-500">Sealed Target Match:</span>
                {comparison ? (
                  <span
                    className={`font-bold ${
                      comparison.verdict === 'CONVERGENT'
                        ? 'text-emerald-400'
                        : comparison.verdict === 'PARTIALLY CONVERGENT'
                        ? 'text-sky-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {comparison.overall_convergence_score}% ({comparison.verdict})
                  </span>
                ) : (
                  <span className="text-slate-600">Pending Envelope Opening</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Multiverse Control Philosophy Note */}
      <div className="bg-slate-900/40 p-3.5 rounded border border-slate-800 text-xs text-slate-400 mt-auto">
        <span className="text-slate-200 font-semibold block mb-1">EXPERIMENTAL CONTROL PRINCIPLE</span>
        <p>
          "Maybe the surviving branch reaches the sealed code closely. Maybe some extinct branch gets closer.
          Maybe the code appears repeatedly across independently stabilizing branches. That giant pile of failed planets
          isn't garbage—it is the experimental control group."
        </p>
      </div>
    </div>
  );
};
