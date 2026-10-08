import React from 'react';

export type ActiveView = 'planet_3d' | 'spatial_field' | 'state_space' | 'counterfactual_tree' | 'governor_log' | 'provenance';

interface HeaderDeckProps {
  currentTimestep: number;
  activeBranchName: string;
  activeView: ActiveView;
  onChangeView: (view: ActiveView) => void;
  onStepForward: (steps: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onForkBranch: () => void;
  onOpenReverseInference: () => void;
  onOpenComparator: () => void;
  onOpenMythEngine: () => void;
  hasGeminiKey: boolean;
}

export const HeaderDeck: React.FC<HeaderDeckProps> = ({
  currentTimestep,
  activeBranchName,
  activeView,
  onChangeView,
  onStepForward,
  isPlaying,
  onTogglePlay,
  onReset,
  onForkBranch,
  onOpenReverseInference,
  onOpenComparator,
  onOpenMythEngine,
  hasGeminiKey,
}) => {
  return (
    <header className="w-full bg-slate-950 border-b border-slate-800 text-slate-200 font-mono">
      {/* Top Console Bar */}
      <div className="px-5 py-3 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Brand & Provenance Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-sky-950 border border-sky-600/70 flex items-center justify-center text-sky-400 font-bold text-sm shadow-inner">
            Δ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-100 tracking-wider uppercase">
                AEILORIA: THE FREEDOM EXPERIMENT
              </h1>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] text-sky-400 font-medium">GEN 0.9.4 CONDUCTOR</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>Branch: <strong className="text-slate-300 font-medium">{activeBranchName}</strong></span>
              <span aria-hidden="true" className="text-slate-600">/</span>
              <span>Timestep: <strong className="text-sky-400 font-semibold">{currentTimestep}</strong></span>
              <span aria-hidden="true" className="text-slate-600">/</span>
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${hasGeminiKey ? 'bg-emerald-400' : 'bg-sky-400'}`} />
                <span className="text-[11px] text-slate-400">
                  {hasGeminiKey ? 'Gemini 3.8 Flash Active' : 'Deterministic Core Active'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Primary Simulation Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => onStepForward(1)}
            disabled={isPlaying}
            className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-700 transition-colors"
          >
            STEP +1
          </button>
          <button
            onClick={() => onStepForward(10)}
            disabled={isPlaying}
            className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-700 transition-colors"
          >
            STEP +10
          </button>
          <button
            onClick={onTogglePlay}
            className={`px-3.5 py-1.5 rounded font-semibold transition-colors ${
              isPlaying
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-sky-600 hover:bg-sky-500 text-white'
            }`}
          >
            {isPlaying ? 'PAUSE' : 'PLAY SIMULATION'}
          </button>

          <button
            onClick={onForkBranch}
            className="px-3 py-1.5 rounded bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-700 transition-colors"
          >
            FORK BRANCH
          </button>

          <button
            onClick={onReset}
            className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-colors"
          >
            RESET
          </button>

          <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* AI Orchestrator Action Triggers */}
          <button
            onClick={onOpenReverseInference}
            className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-700 hover:border-sky-500 transition-colors flex items-center gap-1.5"
          >
            <span>BLIND SCIENTIST</span>
          </button>

          <button
            onClick={onOpenComparator}
            className="px-3 py-1.5 rounded bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-600/70 transition-colors flex items-center gap-1.5 font-bold"
          >
            <span>OPEN ENVELOPE</span>
          </button>

          <button
            onClick={onOpenMythEngine}
            className="px-3 py-1.5 rounded bg-purple-950/70 hover:bg-purple-900/80 text-purple-300 border border-purple-800/80 transition-colors flex items-center gap-1.5"
          >
            <span>MYTH ENGINE</span>
          </button>
        </div>
      </div>

      {/* View Switcher Navigation Tabs */}
      <div className="px-5 py-2 border-t border-slate-800/80 flex items-center gap-1 overflow-x-auto text-xs bg-slate-950/60">
        <span className="text-[11px] text-slate-500 mr-2 uppercase tracking-wider">VIEWPORT:</span>

        {[
          { id: 'planet_3d', label: '3D Planet & Blender Sim Zone' },
          { id: 'spatial_field', label: 'Grasshopper Spatial Vectors' },
          { id: 'state_space', label: 'Freedom Phase Space' },
          { id: 'counterfactual_tree', label: 'Counterfactual Multiverse Tree' },
          { id: 'governor_log', label: 'Governor Event Monitor' },
          { id: 'provenance', label: 'Provenance & Ancestry Graph' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChangeView(tab.id as ActiveView)}
            className={`px-3 py-1 rounded text-xs transition-colors whitespace-nowrap ${
              activeView === tab.id
                ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
