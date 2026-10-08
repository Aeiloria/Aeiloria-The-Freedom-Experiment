import React, { useState } from 'react';
import { ReverseInferenceReport, SimulationSnapshot } from '../types/simulation.ts';

interface ReverseScientistModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot: SimulationSnapshot;
  initialReport: ReverseInferenceReport;
  onRunLiveAIInference: () => Promise<ReverseInferenceReport | null>;
}

export const ReverseScientistModal: React.FC<ReverseScientistModalProps> = ({
  isOpen,
  onClose,
  snapshot,
  initialReport,
  onRunLiveAIInference,
}) => {
  const [report, setReport] = useState<ReverseInferenceReport>(initialReport);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  if (!isOpen) return null;

  const handleRunAI = async () => {
    setIsLoadingAI(true);
    try {
      const newReport = await onRunLiveAIInference();
      if (newReport) setReport(newReport);
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-lg flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
              <h2 className="text-sm font-bold text-slate-100 tracking-wide uppercase">
                ENGINE 10: BLIND REVERSE-INFERENCE ENGINE
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Role: Blind Reverse Scientist · Evaluates planetary data with reference strictly SEALED
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAI}
              disabled={isLoadingAI}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white transition-colors"
            >
              {isLoadingAI ? 'QUERYING GEMINI BLIND SCIENTIST...' : 'RUN GEMINI BLIND SCIENTIST'}
            </button>
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
          {/* Isolation Guarantee Banner */}
          <div className="bg-sky-950/40 border border-sky-800/80 p-3 rounded text-sky-200">
            <div className="font-semibold text-sky-300 mb-0.5">STRICT BLIND PROTOCOL ENFORCED</div>
            <div>
              This engine has NO access to the generating virtue's sealed reference properties.
              Inferences are derived exclusively from observed measurements, spectral frequencies, and phase-space trajectories.
            </div>
          </div>

          {/* Core Telemetry Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px]">CHARACTERISTIC SPECTRUM:</span>
              <span className="text-sky-400 font-bold text-sm">
                {report.characteristic_spectrum.peak_wavelength_nm} nm
              </span>
              <span className="block text-[11px] text-slate-400 mt-1">
                {report.characteristic_spectrum.color_description}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px]">FIELD TOPOLOGY:</span>
              <span className="text-emerald-400 font-semibold">
                {report.field_topology}
              </span>
              <span className="block text-[10px] text-slate-500 mt-1">
                Bow shock standoff: {snapshot.atmosphere.bow_shock_standoff_km} km
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px]">EFFECTIVE DIMENSION / DOF:</span>
              <span className="text-indigo-400 font-semibold">
                {report.degrees_of_freedom_mathematical}
              </span>
              <span className="block text-[10px] text-slate-500 mt-1">
                Accessibility: {report.state_accessibility_profile}
              </span>
            </div>
          </div>

          {/* Inferences Breakdown with Falsification Criteria */}
          <div>
            <h3 className="text-slate-200 font-semibold mb-3 border-b border-slate-800 pb-1">
              OBSERVATIONAL INFERENCES & FALSIFICATION CRITERIA
            </h3>

            <div className="space-y-3">
              {report.inferences.map((inf, idx) => (
                <div key={idx} className="bg-slate-950/70 p-3.5 rounded border border-slate-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-slate-200">{inf.property}</span>
                    <span className="text-[10px] bg-slate-800 text-sky-400 px-2 py-0.5 rounded">
                      Confidence: {(inf.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[10px] block">MEASUREMENTS:</span>
                    <span className="text-slate-400">{inf.observed_measurements}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[10px] block">INFERENCE:</span>
                    <span className="text-slate-200 font-medium">{inf.inference}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-slate-900">
                    <div>
                      <span className="text-amber-400/80 text-[10px] block">COMPETING INTERPRETATIONS:</span>
                      <ul className="list-disc list-inside text-slate-400 text-[11px] space-y-0.5">
                        {inf.competing_interpretations.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-rose-400/80 text-[10px] block">FALSIFICATION CRITERIA:</span>
                      <span className="text-slate-400 text-[11px]">{inf.falsification_criteria}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dominant Resonances & Anomalies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-3.5 rounded border border-slate-800">
              <span className="text-slate-300 font-semibold block mb-2">RESONANCE STRUCTURES</span>
              <ul className="space-y-1 text-slate-400 text-[11px]">
                {report.dominant_oscillatory_frequencies.map((freq, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-sky-400">●</span> {freq}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-950 p-3.5 rounded border border-slate-800">
              <span className="text-slate-300 font-semibold block mb-2">PRESERVED ANOMALIES</span>
              <ul className="space-y-1 text-slate-400 text-[11px]">
                {report.detected_anomalies.map((anom, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-amber-400">▲</span> {anom}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
