import React, { useState } from 'react';
import { MinimumEntityState, MinimumEventRecord } from '../types/simulation.ts';

interface ProvenanceExplorerProps {
  entities: MinimumEntityState[];
  events: MinimumEventRecord[];
  onExportProvenanceJSON: () => void;
}

export const ProvenanceExplorer: React.FC<ProvenanceExplorerProps> = ({
  entities,
  events,
  onExportProvenanceJSON,
}) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string>(entities[0]?.entity_id || '');
  const selectedEntity = entities.find((e) => e.entity_id === selectedEntityId) || entities[0];
  const relatedEvents = events.filter((ev) => ev.entity_ids.includes(selectedEntityId));

  return (
    <div className="w-full h-full bg-slate-950 rounded-lg p-5 border border-slate-800/80 overflow-y-auto font-mono flex flex-col">
      {/* Header Deck */}
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
            PROVENANCE & ANCESTRY GRAPH // IMMUTABLE EVENT LEDGER
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic state lineage tracing every particle back to Genesis Spark Step 0
          </p>
        </div>

        <button
          onClick={onExportProvenanceJSON}
          className="px-3 py-1.5 text-xs font-medium rounded bg-sky-600 hover:bg-sky-500 text-white transition-colors"
        >
          EXPORT PROVENANCE JSON
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 flex-1 min-h-0">
        {/* Left Column: Entity Registry */}
        <div className="bg-slate-900/60 p-3 rounded border border-slate-800 flex flex-col h-full min-h-[300px]">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex justify-between">
            <span>SPARK ENTITY LEDGER</span>
            <span className="text-slate-500">{entities.length} TOTAL</span>
          </div>
          <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
            {entities.map((ent) => (
              <div
                key={ent.entity_id}
                onClick={() => setSelectedEntityId(ent.entity_id)}
                className={`p-2 rounded text-xs cursor-pointer transition-colors flex justify-between items-center ${
                  ent.entity_id === selectedEntityId
                    ? 'bg-sky-950/80 text-sky-200 border border-sky-800'
                    : 'bg-slate-950/60 text-slate-400 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div>
                  <span className="font-semibold text-slate-200">{ent.entity_id}</span>
                  <div className="text-[10px] text-slate-500">Birth: T={ent.birth_step} · {ent.lifecycle}</div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {ent.energy.toFixed(1)} E
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Center Column: Detailed Minimum Entity State */}
        {selectedEntity ? (
          <div className="bg-slate-900/60 p-4 rounded border border-slate-800 overflow-y-auto">
            <div className="text-xs font-semibold text-slate-300 mb-3 border-b border-slate-800 pb-2">
              MINIMUM ENTITY STATE: {selectedEntity.entity_id}
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">PROVENANCE POINTER:</span>
                <span className="text-sky-400 break-all">{selectedEntity.provenance_pointer}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-2.5 rounded border border-slate-800/80">
                <div>
                  <span className="text-slate-500 text-[10px] block">LIFECYCLE STATE:</span>
                  <span className="text-emerald-400 font-semibold">{selectedEntity.lifecycle}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">PERSISTENCE DURATION:</span>
                  <span className="text-slate-300">{selectedEntity.persistence_duration} steps</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">CURRENT POSITION:</span>
                  <span className="text-slate-300">
                    ({selectedEntity.current_position.x.toFixed(2)}, {selectedEntity.current_position.y.toFixed(2)}, {selectedEntity.current_position.z.toFixed(2)})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">ENERGY LEVEL:</span>
                  <span className="text-amber-400 font-semibold">{selectedEntity.energy.toFixed(2)} units</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block mb-1">ACCESSIBLE NEXT STATES (NON-MONOPOLISTIC):</span>
                <div className="flex flex-wrap gap-1">
                  {selectedEntity.accessible_next_states.map((st, i) => (
                    <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                      {st}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block mb-1">INACCESSIBLE STATES:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedEntity.inaccessible_states.length > 0 ? (
                    selectedEntity.inaccessible_states.map((st, i) => (
                      <span key={i} className="text-[10px] bg-rose-950/50 text-rose-400 px-1.5 py-0.5 rounded border border-rose-900/50">
                        {st}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500">None (Full state-space mobility)</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">LAST TRANSITION:</span>
                <span className="text-slate-300">{selectedEntity.last_transition}</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Right Column: Historical Event Ledger */}
        <div className="bg-slate-900/60 p-4 rounded border border-slate-800 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-300 mb-3 border-b border-slate-800 pb-2 flex justify-between">
            <span>TRANSITION EVENTS</span>
            <span className="text-slate-500">{relatedEvents.length} RECORDED</span>
          </div>

          <div className="space-y-2">
            {relatedEvents.length > 0 ? (
              relatedEvents.map((ev) => (
                <div key={ev.event_id} className="bg-slate-950/80 p-2.5 rounded border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sky-400 font-semibold">{ev.event_id}</span>
                    <span className="text-slate-500 text-[10px]">T={ev.timestep}</span>
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-500">Transition:</span> {ev.state_before} → {ev.state_after}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Trigger: {ev.transition_trigger}
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Δ Energy: {ev.energy_or_state_delta.toFixed(2)}</span>
                    <span className="text-emerald-400">{ev.persistence_result}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 p-4 text-center">
                Initial genesis state. No discrete transition events registered yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
