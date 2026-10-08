import React from 'react';
import { SimulationSnapshot } from '../types/simulation.ts';

interface EngineConductorMatrixProps {
  snapshot: SimulationSnapshot;
  onOpenReverseInference: () => void;
  onOpenComparator: () => void;
  onOpenMythEngine: () => void;
}

export const EngineConductorMatrix: React.FC<EngineConductorMatrixProps> = ({
  snapshot,
  onOpenReverseInference,
  onOpenComparator,
  onOpenMythEngine,
}) => {
  const engines = [
    {
      id: 1,
      name: 'Spark Engine',
      role: 'Python Numerical Truth',
      status: 'Active',
      desc: 'Generates primitive spark → persist → die → re-spark state transitions.',
      outputTelemetry: `${snapshot.entities.length} entities tracked`,
      isolation: 'Blind. Pure numerical state, zero geometry.',
    },
    {
      id: 2,
      name: 'Freedom State Engine',
      role: 'Observable Phase Space',
      status: 'Active',
      desc: 'Calculates accessible states, force dependence, persistence, recurrence, return.',
      outputTelemetry: `DoF: ${snapshot.freedom_metrics.degree_of_freedom_ratio} · Constraint: ${snapshot.freedom_metrics.constraint_index}`,
      isolation: 'Blind. Reads spark histories only.',
    },
    {
      id: 3,
      name: 'Grasshopper Field Engine',
      role: 'Spatial Truth',
      status: 'Active',
      desc: 'Translates spark records into 3D vectors, gradient lines, attractors, and vortices.',
      outputTelemetry: `${snapshot.field_nodes.length} spatial field nodes`,
      isolation: 'Blind. Vector coordinates only.',
    },
    {
      id: 4,
      name: 'Chemistry Emergence Engine',
      role: 'Physical Viability',
      status: 'Active',
      desc: 'Infers atomic/elemental mixtures viable solely under emergent temperature & pressure.',
      outputTelemetry: `${snapshot.elements.length} emergent elements`,
      isolation: 'Blind. Does NOT know Keylontic elements.',
    },
    {
      id: 5,
      name: 'Material / Mineral Engine',
      role: 'Crystalline Lattices',
      status: 'Active',
      desc: 'Derives chemical bonding, lattices, compounds, mineral phases, and fracture resistance.',
      outputTelemetry: `${snapshot.minerals.length} mineral phases`,
      isolation: 'Blind. Operates solely on emergent atoms.',
    },
    {
      id: 6,
      name: 'Planetary Accretion Engine',
      role: 'Core/Mantle/Crust',
      status: 'Active',
      desc: 'Aggregates persistent structures with ancestry pointers back to genesis sparks.',
      outputTelemetry: `Radius: ${snapshot.planetary_layers.crust.radius_km} km`,
      isolation: 'Blind. Preserves strict provenance tree.',
    },
    {
      id: 7,
      name: 'Atmosphere / Field Engine',
      role: 'Magnetosphere & Dynamo',
      status: 'Active',
      desc: 'Tracks retained volatiles, magnetic dipole moment, and escape velocities.',
      outputTelemetry: `Retention: ${(snapshot.atmosphere.retention_fraction * 100).toFixed(1)}%`,
      isolation: 'Blind. Direct thermodynamic forcing.',
    },
    {
      id: 8,
      name: 'Biome Engine',
      role: 'Metabolic Decoupling',
      status: snapshot.biomes.length > 0 ? 'Active' : 'Dormant (Thermodynamic Threshold)',
      desc: 'Derives self-organizing habitat classes strictly from emerged conditions.',
      outputTelemetry: `${snapshot.biomes.length} autonomous biomes`,
      isolation: 'Blind. Activates only when conditions permit.',
    },
    {
      id: 9,
      name: 'Blender History Renderer',
      role: 'Time-Evolving Truth',
      status: 'Active',
      desc: 'Simulation zone frame cache, scrubbing, and temporal baking.',
      outputTelemetry: `Frame ${snapshot.timestep} cached`,
      isolation: 'Historical snapshot renderer.',
    },
    {
      id: 10,
      name: 'Blind Reverse-Inference Engine',
      role: 'Blind Reverse Scientist',
      status: 'Interactive',
      desc: 'Examines world without target knowledge; infers spectrum, DOF, and resonance.',
      outputTelemetry: 'Click to Inspect Blind Report',
      action: onOpenReverseInference,
      isolation: 'STRICTLY BLIND. Zero reference access.',
    },
    {
      id: 11,
      name: 'Sealed Target Comparator',
      role: 'Envelope Opener',
      status: 'Sealed / Ready',
      desc: 'The ONLY module permitted to see both blind inference and sealed Keylontic reference.',
      outputTelemetry: 'Break Seal & Compare',
      action: onOpenComparator,
      highlight: true,
      isolation: 'Isolated chamber. Opens sealed envelope.',
    },
    {
      id: 12,
      name: 'History → Myth Engine',
      role: 'Sentience Cultural Lens',
      status: snapshot.sentience_threshold_met ? 'Active' : 'Preview Available',
      desc: 'Generates mythic interpretations from physical history and limited sensory horizons.',
      outputTelemetry: 'Inspect Cultural Myths',
      action: onOpenMythEngine,
      isolation: 'Never rewrites ground truth.',
    },
  ];

  return (
    <div className="w-full bg-slate-950 p-4 border-b border-slate-800/80 font-mono">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">12 GENERATIVE ENGINES // PIPELINE CONDUCTOR</span>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] text-emerald-400">ISOLATION BOUNDARY ENFORCED</span>
        </div>
        <div className="text-[11px] text-slate-400">
          RULE: "No engine receives information it would not yet be capable of knowing."
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {engines.map((eng) => (
          <div
            key={eng.id}
            onClick={eng.action}
            className={`p-2.5 rounded text-left transition-all border ${
              eng.highlight
                ? 'bg-amber-950/40 border-amber-600/70 hover:bg-amber-900/40 cursor-pointer'
                : eng.action
                ? 'bg-slate-900/80 border-slate-700 hover:border-sky-500 cursor-pointer'
                : 'bg-slate-900/40 border-slate-800'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-slate-500">#{eng.id.toString().padStart(2, '0')}</span>
              <span className={`text-[9px] px-1 rounded ${
                eng.status.includes('Active')
                  ? 'text-emerald-400 bg-emerald-950/60'
                  : eng.status.includes('Sealed')
                  ? 'text-amber-400 bg-amber-950/60'
                  : 'text-sky-400 bg-sky-950/60'
              }`}>
                {eng.status}
              </span>
            </div>

            <div className="text-xs font-semibold text-slate-200 truncate">{eng.name}</div>
            <div className="text-[10px] text-slate-400 truncate mb-1.5">{eng.role}</div>

            <div className="text-[10px] text-sky-400/90 font-mono truncate">
              {eng.outputTelemetry}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
