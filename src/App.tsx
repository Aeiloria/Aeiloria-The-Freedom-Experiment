/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SimulationSnapshot,
  CounterfactualBranch,
  ReverseInferenceReport,
  TargetComparisonReport,
  MythReport
} from './types/simulation.ts';
import {
  initializeEntities,
  calculateFreedomStateMetrics,
  generateFieldNodes,
  deriveEmergentElements,
  deriveMineralPhases,
  derivePlanetaryLayers,
  deriveAtmosphereAndField,
  deriveEmergentBiomes,
  executeSimulationStep,
  executeBlindReverseInference,
  executeTargetComparison,
  executeHistoryMythEngine,
  createCounterfactualBranch,
  SeededPRNG
} from './engines/simulationCore.ts';
import { HeaderDeck, ActiveView } from './components/HeaderDeck.tsx';
import { EngineConductorMatrix } from './components/EngineConductorMatrix.tsx';
import { PlanetaryGlobeViewer } from './components/PlanetaryGlobeViewer.tsx';
import { GrasshopperFieldViewer } from './components/GrasshopperFieldViewer.tsx';
import { StateSpaceViewer } from './components/StateSpaceViewer.tsx';
import { CounterfactualTreeViewer } from './components/CounterfactualTreeViewer.tsx';
import { GovernorTerminal } from './components/GovernorTerminal.tsx';
import { ProvenanceExplorer } from './components/ProvenanceExplorer.tsx';
import { ReverseScientistModal } from './components/ReverseScientistModal.tsx';
import { SealedComparatorModal } from './components/SealedComparatorModal.tsx';
import { MythEngineModal } from './components/MythEngineModal.tsx';

export default function App() {
  // Primary Simulation State
  const [branches, setBranches] = useState<CounterfactualBranch[]>(() => {
    const prng = new SeededPRNG(42);
    const initialEntities = initializeEntities(24, prng);
    const initialFreedom = calculateFreedomStateMetrics(initialEntities, 0, 1.0);
    const initialField = generateFieldNodes(0);
    const initialElements = deriveEmergentElements(0, initialFreedom);
    const initialMinerals = deriveMineralPhases(0);
    const initialLayers = derivePlanetaryLayers(0);
    const initialAtmo = deriveAtmosphereAndField(0, initialLayers);
    const initialBiomes = deriveEmergentBiomes(0, initialAtmo, initialFreedom);

    const initialSnapshot: SimulationSnapshot = {
      timestep: 0,
      timestamp_ms: Date.now(),
      entities: initialEntities,
      events: [],
      freedom_metrics: initialFreedom,
      field_nodes: initialField,
      elements: initialElements,
      minerals: initialMinerals,
      planetary_layers: initialLayers,
      atmosphere: initialAtmo,
      biomes: initialBiomes,
      is_bifurcation_point: false,
      sentience_threshold_met: false,
    };

    return [
      {
        branch_id: 'branch-alpha-prime',
        name: 'Branch α (Surviving Prime Trajectory)',
        parent_branch_id: null,
        fork_timestep: 0,
        current_timestep: 0,
        status: 'active',
        divergence_trigger: 'Genesis Spark Initial Conditions',
        dominant_phase: 'Balanced Dynamic Equilibrium',
        stability_score: 0.94,
        freedom_metric_snapshot: initialFreedom,
        snapshots: [initialSnapshot],
      },
    ];
  });

  const [activeBranchId, setActiveBranchId] = useState<string>('branch-alpha-prime');
  const [scrubTimestepIndex, setScrubTimestepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<ActiveView>('planet_3d');
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);
  const [isVerifyingGovernor, setIsVerifyingGovernor] = useState<boolean>(false);

  // Modals state
  const [isReverseModalOpen, setIsReverseModalOpen] = useState<boolean>(false);
  const [isComparatorModalOpen, setIsComparatorModalOpen] = useState<boolean>(false);
  const [isMythModalOpen, setIsMythModalOpen] = useState<boolean>(false);

  // Cached evaluations per branch
  const [branchComparisons, setBranchComparisons] = useState<Record<string, TargetComparisonReport | null>>({});

  const activeBranch = branches.find((b) => b.branch_id === activeBranchId) || branches[0];
  const maxTimestep = activeBranch.snapshots.length - 1;
  const currentSnapshot = activeBranch.snapshots[Math.min(scrubTimestepIndex, maxTimestep)] || activeBranch.snapshots[maxTimestep];

  // Check backend server status
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasGeminiKey) setHasGeminiKey(true);
      })
      .catch(() => {
        // Deterministic core handles offline seamlessly
      });
  }, []);

  // Step the simulation forward
  const stepForward = useCallback((stepsCount: number = 1) => {
    setBranches((prevBranches) => {
      return prevBranches.map((branch) => {
        if (branch.branch_id !== activeBranchId) return branch;

        let lastSnapshot = branch.snapshots[branch.snapshots.length - 1];
        const newSnapshots = [...branch.snapshots];

        for (let i = 0; i < stepsCount; i++) {
          const nextSnap = executeSimulationStep(lastSnapshot, 1.0);
          newSnapshots.push(nextSnap);
          lastSnapshot = nextSnap;
        }

        const latest = newSnapshots[newSnapshots.length - 1];
        return {
          ...branch,
          current_timestep: latest.timestep,
          freedom_metric_snapshot: latest.freedom_metrics,
          snapshots: newSnapshots,
        };
      });
    });

    setScrubTimestepIndex((prev) => prev + stepsCount);
  }, [activeBranchId]);

  // Simulation Play/Pause Loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      stepForward(1);
    }, 450);

    return () => clearInterval(interval);
  }, [isPlaying, stepForward]);

  // Fork a Counterfactual Branch
  const handleForkBranch = () => {
    const forkModifier = branches.length % 2 === 0 ? 1.8 : 0.45;
    const trigger = forkModifier > 1.0
      ? 'Phase Bifurcation: Hyper-Cohesive Crystalline Lock'
      : 'Phase Bifurcation: Atmospheric Stripping & Void Dispersion';

    const newBranch = createCounterfactualBranch(activeBranch, trigger, forkModifier);
    setBranches((prev) => [...prev, newBranch]);
    setActiveBranchId(newBranch.branch_id);
    setActiveView('counterfactual_tree');
  };

  // Reset Simulation to Genesis
  const handleReset = () => {
    setIsPlaying(false);
    const prng = new SeededPRNG(Date.now() % 100000);
    const initialEntities = initializeEntities(24, prng);
    const initialFreedom = calculateFreedomStateMetrics(initialEntities, 0, 1.0);
    const initialField = generateFieldNodes(0);
    const initialElements = deriveEmergentElements(0, initialFreedom);
    const initialMinerals = deriveMineralPhases(0);
    const initialLayers = derivePlanetaryLayers(0);
    const initialAtmo = deriveAtmosphereAndField(0, initialLayers);
    const initialBiomes = deriveEmergentBiomes(0, initialAtmo, initialFreedom);

    const initialSnapshot: SimulationSnapshot = {
      timestep: 0,
      timestamp_ms: Date.now(),
      entities: initialEntities,
      events: [],
      freedom_metrics: initialFreedom,
      field_nodes: initialField,
      elements: initialElements,
      minerals: initialMinerals,
      planetary_layers: initialLayers,
      atmosphere: initialAtmo,
      biomes: initialBiomes,
      is_bifurcation_point: false,
      sentience_threshold_met: false,
    };

    const newPrime: CounterfactualBranch = {
      branch_id: `branch-genesis-${Date.now().toString(36)}`,
      name: 'Branch α (Genesis Recurrence)',
      parent_branch_id: null,
      fork_timestep: 0,
      current_timestep: 0,
      status: 'active',
      divergence_trigger: 'Re-seeded Genesis Spark Initial Conditions',
      dominant_phase: 'Primordial Plasma State',
      stability_score: 0.95,
      freedom_metric_snapshot: initialFreedom,
      snapshots: [initialSnapshot],
    };

    setBranches([newPrime]);
    setActiveBranchId(newPrime.branch_id);
    setScrubTimestepIndex(0);
    setBranchComparisons({});
  };

  // Run Comparator across all branches
  const handleRunComparatorForAll = () => {
    const updatedMap: Record<string, TargetComparisonReport | null> = {};
    for (const b of branches) {
      const snap = b.snapshots[b.snapshots.length - 1];
      const rev = executeBlindReverseInference(snap);
      const comp = executeTargetComparison(rev, snap);
      updatedMap[b.branch_id] = comp;
    }
    setBranchComparisons(updatedMap);
  };

  // Live AI Governor rule verification
  const handleVerifyTransitionsViaAI = async () => {
    setIsVerifyingGovernor(true);
    try {
      await fetch('/api/governor/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousSnapshot: currentSnapshot,
          useAI: true,
        }),
      });
    } catch (err) {
      console.warn('Governor verification finished with local fallback', err);
    } finally {
      setIsVerifyingGovernor(false);
    }
  };

  // Live AI Reverse Scientist call
  const handleRunLiveAIInference = async (): Promise<ReverseInferenceReport | null> => {
    try {
      const res = await fetch('/api/reverse-infer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshot: currentSnapshot,
          useAI: true,
        }),
      });
      const data = await res.json();
      return data.report || null;
    } catch {
      return executeBlindReverseInference(currentSnapshot);
    }
  };

  // Live AI Target Comparator call
  const handleRunLiveAIComparison = async (): Promise<TargetComparisonReport | null> => {
    const revReport = executeBlindReverseInference(currentSnapshot);
    try {
      const res = await fetch('/api/compare-target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reverseReport: revReport,
          snapshot: currentSnapshot,
          useAI: true,
        }),
      });
      const data = await res.json();
      const comp = data.report || null;
      if (comp) {
        setBranchComparisons((prev) => ({ ...prev, [activeBranch.branch_id]: comp }));
      }
      return comp;
    } catch {
      const comp = executeTargetComparison(revReport, currentSnapshot);
      setBranchComparisons((prev) => ({ ...prev, [activeBranch.branch_id]: comp }));
      return comp;
    }
  };

  // Live AI Myth Engine call
  const handleRunLiveAIMyth = async (): Promise<MythReport | null> => {
    try {
      const res = await fetch('/api/history-myth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshot: currentSnapshot,
          useAI: true,
        }),
      });
      const data = await res.json();
      return data.report || null;
    } catch {
      return executeHistoryMythEngine(currentSnapshot);
    }
  };

  // Export full simulation provenance JSON
  const handleExportProvenance = () => {
    const payload = {
      experiment: 'Aeiloria: The Freedom Experiment',
      timestamp: new Date().toISOString(),
      activeBranchId,
      branchMetadata: {
        name: activeBranch.name,
        forkTimestep: activeBranch.fork_timestep,
        currentTimestep: activeBranch.current_timestep,
        status: activeBranch.status,
      },
      provenanceLineage: {
        totalSnapshots: activeBranch.snapshots.length,
        totalEntities: currentSnapshot.entities.length,
        totalEvents: currentSnapshot.events.length,
        snapshots: activeBranch.snapshots,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aeiloria-provenance-${activeBranch.branch_id}-T${currentSnapshot.timestep}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-mono selection:bg-sky-500/30">
      {/* Scientific Header & Navigation Console */}
      <HeaderDeck
        currentTimestep={currentSnapshot.timestep}
        activeBranchName={activeBranch.name}
        activeView={activeView}
        onChangeView={setActiveView}
        onStepForward={stepForward}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onReset={handleReset}
        onForkBranch={handleForkBranch}
        onOpenReverseInference={() => setIsReverseModalOpen(true)}
        onOpenComparator={() => setIsComparatorModalOpen(true)}
        onOpenMythEngine={() => setIsMythModalOpen(true)}
        hasGeminiKey={hasGeminiKey}
      />

      {/* 12 Generative Engines Pipeline Status Bar */}
      <EngineConductorMatrix
        snapshot={currentSnapshot}
        onOpenReverseInference={() => setIsReverseModalOpen(true)}
        onOpenComparator={() => setIsComparatorModalOpen(true)}
        onOpenMythEngine={() => setIsMythModalOpen(true)}
      />

      {/* Main Scientific Viewport */}
      <main className="flex-1 p-4 overflow-hidden min-h-0 bg-slate-950">
        {activeView === 'planet_3d' && (
          <PlanetaryGlobeViewer
            snapshot={currentSnapshot}
            onScrubTimestep={(step) => setScrubTimestepIndex(step)}
            maxTimestep={maxTimestep}
            currentTimestep={currentSnapshot.timestep}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
          />
        )}

        {activeView === 'spatial_field' && (
          <GrasshopperFieldViewer snapshot={currentSnapshot} />
        )}

        {activeView === 'state_space' && (
          <StateSpaceViewer metrics={currentSnapshot.freedom_metrics} />
        )}

        {activeView === 'counterfactual_tree' && (
          <CounterfactualTreeViewer
            branches={branches}
            activeBranchId={activeBranchId}
            onSelectBranch={(id) => {
              setActiveBranchId(id);
              const b = branches.find((item) => item.branch_id === id);
              if (b) setScrubTimestepIndex(b.snapshots.length - 1);
            }}
            onForkBranch={handleForkBranch}
            branchComparisons={branchComparisons}
            onRunComparatorForAll={handleRunComparatorForAll}
          />
        )}

        {activeView === 'governor_log' && (
          <GovernorTerminal
            events={currentSnapshot.events}
            freedom={currentSnapshot.freedom_metrics}
            onVerifyTransitionsViaAI={handleVerifyTransitionsViaAI}
            isVerifying={isVerifyingGovernor}
          />
        )}

        {activeView === 'provenance' && (
          <ProvenanceExplorer
            entities={currentSnapshot.entities}
            events={currentSnapshot.events}
            onExportProvenanceJSON={handleExportProvenance}
          />
        )}
      </main>

      {/* Engine 10: Blind Reverse-Inference Modal */}
      <ReverseScientistModal
        isOpen={isReverseModalOpen}
        onClose={() => setIsReverseModalOpen(false)}
        snapshot={currentSnapshot}
        initialReport={executeBlindReverseInference(currentSnapshot)}
        onRunLiveAIInference={handleRunLiveAIInference}
      />

      {/* Engine 11: Sealed Target Comparator Modal (The Envelope Opener) */}
      <SealedComparatorModal
        isOpen={isComparatorModalOpen}
        onClose={() => setIsComparatorModalOpen(false)}
        snapshot={currentSnapshot}
        reverseReport={executeBlindReverseInference(currentSnapshot)}
        initialReport={executeTargetComparison(executeBlindReverseInference(currentSnapshot), currentSnapshot)}
        onRunLiveAIComparison={handleRunLiveAIComparison}
      />

      {/* Engine 12: History → Myth Engine Modal */}
      <MythEngineModal
        isOpen={isMythModalOpen}
        onClose={() => setIsMythModalOpen(false)}
        snapshot={currentSnapshot}
        initialReport={executeHistoryMythEngine(currentSnapshot)}
        onRunLiveAIMyth={handleRunLiveAIMyth}
      />
    </div>
  );
}
