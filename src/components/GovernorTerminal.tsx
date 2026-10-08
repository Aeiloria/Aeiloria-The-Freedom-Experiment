import React, { useState } from 'react';
import { MinimumEventRecord, FreedomStateMetrics } from '../types/simulation.ts';

interface GovernorTerminalProps {
  events: MinimumEventRecord[];
  freedom: FreedomStateMetrics;
  onVerifyTransitionsViaAI: () => Promise<void>;
  isVerifying: boolean;
}

export const GovernorTerminal: React.FC<GovernorTerminalProps> = ({
  events,
  freedom,
  onVerifyTransitionsViaAI,
  isVerifying,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'persisted' | 'bifurcated' | 'decayed'>('all');

  const filteredEvents = events.filter((ev) => {
    if (filterType === 'all') return true;
    return ev.persistence_result === filterType;
  });

  return (
    <div className="w-full h-full bg-slate-950 rounded-lg p-5 border border-slate-800/80 font-mono flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
              BLIND SIMULATION GOVERNOR // LOG & EVENT MONITOR
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Rule enforcement: Pure state-space reporting · Zero teleological bias
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onVerifyTransitionsViaAI}
            disabled={isVerifying}
            className="px-3 py-1.5 text-xs font-medium rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white transition-colors"
          >
            {isVerifying ? 'VERIFYING VIA GEMINI GOVERNOR...' : 'VERIFY STATE RULES (GEMINI)'}
          </button>
        </div>
      </div>

      {/* Experimental Container Mandate Strip */}
      <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 text-[11px] text-slate-400 mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span>RULE: X is reachable state-space, NOT a correct state</span>
          <span>·</span>
          <span className="text-emerald-400">STATE PURITY: UNBIASED</span>
        </div>
        <div className="text-slate-500">
          DOF RATIO: <span className="text-sky-400 font-bold">{freedom.degree_of_freedom_ratio}</span> · CONSTRAINT: <span className="text-slate-300">{freedom.constraint_index}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-3 text-xs">
        <span className="text-slate-500 text-[11px] mr-1">FILTER:</span>
        {(['all', 'persisted', 'bifurcated', 'decayed'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
              filterType === type
                ? 'bg-slate-800 text-sky-400 font-medium'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            {type.toUpperCase()}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-slate-500">
          {filteredEvents.length} EVENTS REGISTERED
        </span>
      </div>

      {/* Events Log Stream */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
        {filteredEvents.length > 0 ? (
          filteredEvents.slice().reverse().map((ev) => (
            <div
              key={ev.event_id}
              className="bg-slate-900/40 hover:bg-slate-900/80 p-2.5 rounded border border-slate-800/80 text-xs transition-colors space-y-1"
            >
              <div className="flex justify-between items-center text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-sky-400 font-semibold">{ev.event_id}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-300 font-medium">{ev.entity_ids[0]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">T={ev.timestep}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                      ev.persistence_result === 'persisted'
                        ? 'text-emerald-400 bg-emerald-950/60'
                        : ev.persistence_result === 'bifurcated'
                        ? 'text-indigo-400 bg-indigo-950/60'
                        : 'text-amber-400 bg-amber-950/60'
                    }`}
                  >
                    {ev.persistence_result.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="text-slate-300 flex items-center gap-2">
                <span className="text-slate-500">Transition:</span>
                <span className="text-slate-400">{ev.state_before}</span>
                <span className="text-slate-600">→</span>
                <span className="text-emerald-300 font-medium">{ev.state_after}</span>
                <span className="text-slate-500 text-[10px] ml-auto">
                  Trigger: {ev.transition_trigger}
                </span>
              </div>

              <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-900">
                <span>Δ Energy: {ev.energy_or_state_delta.toFixed(2)}</span>
                <span>Ambient Temp: {ev.external_conditions.ambient_temperature.toFixed(0)} K</span>
                <span>B-Flux: {ev.external_conditions.magnetic_flux.toFixed(2)} T</span>
                <span>Accessibility Δ: {ev.accessibility_change > 0 ? `+${ev.accessibility_change}` : ev.accessibility_change}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-xs text-slate-500 p-8 text-center">
            No events match the selected criteria. Run or step the simulation to log state transitions.
          </div>
        )}
      </div>
    </div>
  );
};
