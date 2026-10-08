import React, { useState } from 'react';
import { MythReport, SimulationSnapshot } from '../types/simulation.ts';

interface MythEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot: SimulationSnapshot;
  initialReport: MythReport;
  onRunLiveAIMyth: () => Promise<MythReport | null>;
}

export const MythEngineModal: React.FC<MythEngineModalProps> = ({
  isOpen,
  onClose,
  snapshot,
  initialReport,
  onRunLiveAIMyth,
}) => {
  const [report, setReport] = useState<MythReport>(initialReport);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  if (!isOpen) return null;

  const handleRunAI = async () => {
    setIsLoadingAI(true);
    try {
      const res = await onRunLiveAIMyth();
      if (res) setReport(res);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const isDormant = !snapshot.sentience_threshold_met;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-lg flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isDormant ? 'bg-amber-500' : 'bg-emerald-400'} inline-block`} />
              <h2 className="text-sm font-bold text-slate-100 tracking-wide uppercase">
                ENGINE 12: HISTORY → MYTH ENGINE
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Receives physical history + sensory observational horizons to generate emergent cultural cosmologies
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAI}
              disabled={isLoadingAI}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-colors"
            >
              {isLoadingAI ? 'INDUCING VIA GEMINI...' : 'GENERATE VIA GEMINI MYTH ENGINE'}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-sm px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Status Banner */}
          <div className={`p-3.5 rounded border ${
            isDormant
              ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
              : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
          }`}>
            <span className="font-semibold block mb-0.5">
              {isDormant ? 'PRE-SENTIENT THRESHOLD PROTOCOL' : 'SENTIENT COMPLEXITY THRESHOLD ACTIVE'}
            </span>
            <p>
              {isDormant
                ? 'Sentience threshold requires complexity index > 0.75, minimum 3 active biomes, and DoF ratio > 0.75. Currently in preview simulation mode.'
                : 'Planetary self-organizing biomes have breached sentience threshold. Cultural myth-making active.'}
            </p>
          </div>

          {/* Interpretations List */}
          <div className="space-y-4">
            {report.interpretations.map((interp, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                <div className="flex justify-between items-start border-b border-slate-900 pb-2">
                  <span className="text-sm font-bold text-purple-300">
                    {interp.culture_identifier}
                  </span>
                  <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                    Ground Truth Alignment: {(interp.ground_truth_alignment_accuracy * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500 text-[10px] block mb-0.5">SENSORY OBSERVATIONAL HORIZON:</span>
                  <span className="text-slate-300">{interp.sensory_horizon}</span>
                </div>

                <div>
                  <span className="text-purple-400 text-[10px] block mb-0.5">MYTHIC COSMOLOGY:</span>
                  <p className="text-slate-200 text-xs italic bg-slate-900/40 p-2.5 rounded border border-slate-900">
                    "{interp.mythic_cosmology}"
                  </p>
                </div>

                <div>
                  <span className="text-sky-400 text-[10px] block mb-0.5">ORIGIN ALLEGORY:</span>
                  <p className="text-slate-300 text-xs bg-slate-900/40 p-2.5 rounded border border-slate-900">
                    {interp.origin_allegory}
                  </p>
                </div>

                <div>
                  <span className="text-amber-400/90 text-[10px] block mb-1">DIVERGENT SUPERSTITIONS:</span>
                  <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                    {interp.divergent_superstitions.map((sup, sIdx) => (
                      <li key={sIdx}>{sup}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] text-slate-500">
            Rule: "The Myth Engine receives physical history plus each culture's actual observation access and generates
            interpretations, NEVER rewriting ground truth."
          </div>
        </div>
      </div>
    </div>
  );
};
