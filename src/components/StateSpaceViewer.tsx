import React from 'react';
import { FreedomStateMetrics } from '../types/simulation.ts';

interface StateSpaceViewerProps {
  metrics: FreedomStateMetrics;
}

export const StateSpaceViewer: React.FC<StateSpaceViewerProps> = ({ metrics }) => {
  const metricItems = [
    {
      label: 'Degree of Freedom Ratio',
      value: metrics.degree_of_freedom_ratio,
      percent: Math.round(metrics.degree_of_freedom_ratio * 100),
      desc: 'Proportion of unconstrained reachable transitions in phase space',
      target: 'Target: > 0.70',
      status: metrics.degree_of_freedom_ratio >= 0.70 ? 'Optimal' : 'Constrained',
      color: 'bg-sky-500',
    },
    {
      label: 'Trajectory Diversity',
      value: metrics.trajectory_diversity,
      percent: Math.round(metrics.trajectory_diversity * 100),
      desc: 'Path divergence in velocity & orbital coordinates',
      target: 'Target: > 0.60',
      status: metrics.trajectory_diversity >= 0.60 ? 'Optimal' : 'Low Dispersion',
      color: 'bg-emerald-500',
    },
    {
      label: 'Recurrence Rate',
      value: metrics.recurrence_rate,
      percent: Math.round(metrics.recurrence_rate * 100),
      desc: 'Ability to return to prior state configurations without lock',
      target: 'Target: > 0.65',
      status: metrics.recurrence_rate >= 0.65 ? 'Optimal' : 'Irreversible',
      color: 'bg-indigo-500',
    },
    {
      label: 'Constraint Index',
      value: metrics.constraint_index,
      percent: Math.round(metrics.constraint_index * 100),
      desc: 'Boundary confinement and potential energy barriers',
      target: 'Target: < 0.35',
      status: metrics.constraint_index <= 0.35 ? 'Optimal' : 'High Barrier',
      color: 'bg-amber-500',
    },
    {
      label: 'Return Capability',
      value: metrics.return_capability,
      percent: Math.round(metrics.return_capability * 100),
      desc: 'Dynamic equilibrium without irreversible dead-end collapse',
      target: 'Target: > 0.65',
      status: metrics.return_capability >= 0.65 ? 'Optimal' : 'Attractor Trap',
      color: 'bg-teal-500',
    },
    {
      label: 'Escape Capability',
      value: metrics.escape_capability,
      percent: Math.round(metrics.escape_capability * 100),
      desc: 'Clearance of local potential wells under internal excitation',
      target: 'Target: > 0.50',
      status: metrics.escape_capability >= 0.50 ? 'Optimal' : 'Confined',
      color: 'bg-violet-500',
    },
  ];

  return (
    <div className="w-full h-full bg-slate-950 rounded-lg p-5 border border-slate-800/80 overflow-y-auto font-mono">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
            FREEDOM STATE ENGINE // NUMERICAL TRUTH
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Phase-space topology: accessible states, recurrence, constraint, and escape metrics
          </p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div>TOTAL ACCESSIBLE STATES: <span className="text-sky-400 font-bold">{metrics.accessible_states_count}</span></div>
          <div>STATE-SPACE VOLUME: <span className="text-slate-300 font-bold">{metrics.total_state_space_volume} AU³</span></div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {metricItems.map((item, idx) => (
          <div key={idx} className="bg-slate-900/70 p-4 rounded border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-300 font-medium">{item.label}</span>
                <span className="text-xs text-sky-400 font-bold">{item.value.toFixed(3)}</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">{item.desc}</p>
            </div>

            <div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full ${item.color} transition-all duration-300`}
                  style={{ width: `${Math.min(100, item.percent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{item.target}</span>
                <span className={item.status === 'Optimal' ? 'text-emerald-400' : 'text-amber-400'}>
                  {item.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mathematical Phase-Space Invariance Note */}
      <div className="bg-slate-900/40 p-3.5 rounded border border-slate-800 text-xs text-slate-400 space-y-1">
        <div className="text-slate-300 font-semibold flex items-center gap-2">
          <span>GOVERNOR RIGOROUS CONTAINER CHECK</span>
          <span className="text-emerald-400">● COMPLIANT</span>
        </div>
        <p>
          "X is the full reachable state-space, not a correct state. No state is intrinsically marked correct or incorrect."
          The simulation records pure accessibility deltas and does not force trajectories toward an arbitrary moral endpoint.
        </p>
      </div>
    </div>
  );
};
