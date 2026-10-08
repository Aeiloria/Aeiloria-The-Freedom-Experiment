import React, { useState } from 'react';
import { TargetComparisonReport, SimulationSnapshot, ReverseInferenceReport } from '../types/simulation.ts';
import { SEALED_FREEDOM_REFERENCE } from '../engines/sealedReference.ts';

interface SealedComparatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot: SimulationSnapshot;
  reverseReport: ReverseInferenceReport;
  initialReport: TargetComparisonReport;
  onRunLiveAIComparison: () => Promise<TargetComparisonReport | null>;
}

export const SealedComparatorModal: React.FC<SealedComparatorModalProps> = ({
  isOpen,
  onClose,
  snapshot,
  reverseReport,
  initialReport,
  onRunLiveAIComparison,
}) => {
  const [report, setReport] = useState<TargetComparisonReport>(initialReport);
  const [isSealBroken, setIsSealBroken] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  if (!isOpen) return null;

  const handleRunAI = async () => {
    setIsLoadingAI(true);
    try {
      const newReport = await onRunLiveAIComparison();
      if (newReport) setReport(newReport);
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl max-h-[92vh] rounded-lg flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isSealBroken ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'} inline-block`} />
              <h2 className="text-sm font-bold text-slate-100 tracking-wide uppercase">
                ENGINE 11: SEALED TARGET COMPARATOR // THE ENVELOPE OPENER
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              The ONLY module permitted to view both blind inferences and the sealed Keylontic reference
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isSealBroken && (
              <button
                onClick={handleRunAI}
                disabled={isLoadingAI}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white transition-colors"
              >
                {isLoadingAI ? 'ANALYZING VIA GEMINI COMPARATOR...' : 'RUN GEMINI TARGET COMPARATOR'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-sm px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {!isSealBroken ? (
            /* Sealed Envelope Chamber State */
            <div className="p-8 text-center space-y-4 max-w-xl mx-auto my-12 bg-slate-950 rounded-lg border border-slate-800">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-950/40 border border-amber-600/70 flex items-center justify-center text-amber-400 text-2xl font-bold">
                ⚿
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide">
                  SEALED VALIDATION TARGET ENVELOPE
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Target Virtue: <span className="text-slate-200 font-semibold">{SEALED_FREEDOM_REFERENCE.virtue_name}</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cryptographic Seal Hash: <span className="font-mono text-sky-400">{SEALED_FREEDOM_REFERENCE.sealed_hash}</span>
                </p>
              </div>

              <div className="bg-slate-900 p-3 rounded text-[11px] text-slate-400 text-left space-y-1">
                <span className="text-slate-300 font-semibold block">ARCHITECTURAL RULE:</span>
                <p>
                  "No engine receives information it would not yet be capable of knowing. The known reference code for Freedom
                  has been strictly sealed throughout generation to prevent bias."
                </p>
              </div>

              <button
                onClick={() => setIsSealBroken(true)}
                className="px-6 py-2.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-amber-500/20"
              >
                UNSEAL ENVELOPE & COMPUTE CONVERGENCE
              </button>
            </div>
          ) : (
            /* Unsealed Comparison Analysis View */
            <>
              {/* Verdict Banner */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    TARGET COMPARATOR CONCLUSION
                  </div>
                  <div className="text-xl font-bold tracking-tight mt-0.5 flex items-center gap-2">
                    <span
                      className={
                        report.verdict === 'CONVERGENT'
                          ? 'text-emerald-400'
                          : report.verdict === 'PARTIALLY CONVERGENT'
                          ? 'text-sky-400'
                          : 'text-amber-400'
                      }
                    >
                      {report.verdict}
                    </span>
                    <span className="text-sm text-slate-400 font-normal">
                      ({report.overall_convergence_score}% Structural Match)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    {report.scientific_critique}
                  </p>
                </div>

                {/* Scale Convergence Badges */}
                <div className="grid grid-cols-2 gap-2 text-[10px] w-full md:w-auto">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block">Quantum Spark:</span>
                    <span className="text-sky-400 font-bold">{report.convergence_by_scale.quantum_spark}%</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block">Chemical / Mineral:</span>
                    <span className="text-emerald-400 font-bold">{report.convergence_by_scale.chemical_mineral}%</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block">Planetary Field:</span>
                    <span className="text-indigo-400 font-bold">{report.convergence_by_scale.planetary_field}%</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block">Biosphere:</span>
                    <span className="text-teal-400 font-bold">{report.convergence_by_scale.systemic_biosphere}%</span>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Property Comparison Matrix */}
              <div>
                <h3 className="text-slate-200 font-semibold mb-3 border-b border-slate-800 pb-1 flex justify-between">
                  <span>STRUCTURAL CORRESPONDENCE AUDIT (SEALED REFERENCE VS BLIND INFERENCE)</span>
                  <span className="text-[10px] text-slate-500">
                    Earliest Detection: Timestep {report.earliest_timestep_detectable} · Trajectory: {report.trajectory_over_time}
                  </span>
                </h3>

                <div className="space-y-3">
                  {report.property_comparisons.map((item, idx) => (
                    <div key={idx} className="bg-slate-950/80 p-3.5 rounded border border-slate-800 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-slate-200">{item.reference_property}</span>
                          <span className="text-[10px] text-slate-500 ml-2">
                            ({item.category.replace('_', ' ')})
                          </span>
                        </div>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                            item.match_type === 'exact'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                              : item.match_type === 'strong'
                              ? 'bg-sky-950/80 text-sky-300 border border-sky-700'
                              : item.match_type === 'partial'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-700'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-700'
                          }`}
                        >
                          {item.match_type.toUpperCase()} MATCH
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                          <span className="text-amber-400/90 text-[10px] font-semibold block mb-0.5">
                            SEALED KEYLONTIC TARGET VALUE:
                          </span>
                          <span className="text-slate-300">{item.reference_value}</span>
                        </div>

                        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                          <span className="text-sky-400/90 text-[10px] font-semibold block mb-0.5">
                            BLIND SIMULATION EVIDENCE:
                          </span>
                          <span className="text-slate-300">{item.blind_inference}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded">
                        <span className="text-slate-500">Measurable Ground Truth:</span> {item.evidence_from_simulation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strict Audit Footnote */}
              <div className="bg-slate-900/40 p-3 rounded border border-slate-800 text-[11px] text-slate-400">
                <span className="text-slate-300 font-semibold block mb-0.5">METRIC PURITY AUDIT</span>
                "Do not award similarity based on poetic interpretation. Prefer measurable structural correspondence.
                Separate direct convergence and derived convergence from metaphorical resemblance. Only direct and derived
                count toward the primary convergence score."
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
