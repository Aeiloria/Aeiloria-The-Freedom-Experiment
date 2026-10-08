export type EntityId = string;
export type EventId = string;
export type SimulationRunId = string;
export type BranchId = string;

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type SparkLifecycleState = 'spark' | 'persist' | 'die' | 're_spark';

export interface MinimumEntityState {
  entity_id: EntityId;
  parent_ids: EntityId[];
  birth_step: number;
  current_position: Vector3D;
  velocity: Vector3D;
  energy: number;
  lifecycle: SparkLifecycleState;
  accessible_next_states: string[];
  inaccessible_states: string[];
  active_external_forces: Vector3D;
  interaction_ids: string[];
  persistence_duration: number;
  last_transition: string;
  provenance_pointer: string; // Pointer back to ancestral spark chain
  charge?: number;
  mass?: number;
  bound_compound_id?: string;
}

export interface MinimumEventRecord {
  event_id: EventId;
  simulation_run_id: SimulationRunId;
  branch_id: BranchId;
  timestep: number;
  entity_ids: EntityId[];
  state_before: string;
  state_after: string;
  endogenous_conditions: {
    mean_energy: number;
    density: number;
    entropy: number;
    internal_cohesion: number;
  };
  external_conditions: {
    external_force_magnitude: number;
    ambient_temperature: number;
    ambient_pressure: number;
    magnetic_flux: number;
  };
  interaction_ids: string[];
  transition_trigger: string;
  energy_or_state_delta: number;
  accessibility_change: number; // Delta in reachable states
  persistence_result: 'persisted' | 'decayed' | 'bifurcated' | 'bonded';
  provenance: string;
}

export interface FreedomStateMetrics {
  accessible_states_count: number;
  total_state_space_volume: number;
  degree_of_freedom_ratio: number; // 0.0 - 1.0
  force_dependence: number;        // Sensitivity to external perturbation
  persistence_stability: number;   // Mean duration in steady state
  recurrence_rate: number;          // Ability to return to previous states without lock
  trajectory_diversity: number;    // Path divergence in state space
  constraint_index: number;        // Confinement measure (0 = free, 1 = locked)
  escape_capability: number;       // Barrier clearance metric
  return_capability: number;       // Cyclic return without irreversible stagnation
}

export interface FieldVectorNode {
  position: Vector3D;
  vector: Vector3D;
  magnitude: number;
  attractor_affinity: number;
  vorticity: number;
}

export interface EmergentElement {
  element_id: string;
  designation: string; // Neutral technical identifier, e.g. "EL-104-ALPHA"
  atomic_mass: number;
  valence_capacity: number;
  electronegativity: number;
  thermal_conductivity: number;
  abundance_ppm: number;
  phase_at_ambient: 'gas' | 'liquid' | 'solid' | 'plasma';
  origin_condition: string;
}

export interface MineralPhase {
  compound_id: string;
  designation: string; // e.g. "MIN-SIL-01"
  constituent_elements: string[];
  lattice_structure: 'hexagonal' | 'orthorhombic' | 'cubic' | 'amorphous' | 'chiral_chain';
  density_g_cm3: number;
  hardness_mohs: number;
  fracture_resistance: number;
  proportion_mass: number;
  parent_layer: 'inner_core' | 'outer_core' | 'lower_mantle' | 'upper_mantle' | 'lithosphere' | 'hydrosphere';
}

export interface PlanetaryLayerMetrics {
  radius_km: number;
  mass_kg: number;
  mean_temperature_k: number;
  mean_pressure_gpa: number;
  dominant_compounds: string[];
  viscosity_pa_s?: number;
  convection_velocity_cm_yr?: number;
}

export interface AtmosphericMetrics {
  surface_pressure_bar: number;
  scale_height_km: number;
  escape_velocity_km_s: number;
  magnetic_dipole_moment: number; // T*m^3
  bow_shock_standoff_km: number;
  retention_fraction: number;
  gas_fractions: Record<string, number>;
  albedo: number;
}

export interface BiomeRegime {
  regime_id: string;
  designation: string; // e.g. "REGIME-CHEMOSYN-09"
  energy_source: 'thermal_gradient' | 'radiolytic' | 'photonic_harmonic' | 'piezoelectric';
  substrate: string;
  complexity_index: number;
  self_organization_score: number;
  coverage_fraction: number;
  active_metabolic_loops: number;
}

export interface SimulationSnapshot {
  timestep: number;
  timestamp_ms: number;
  entities: MinimumEntityState[];
  events: MinimumEventRecord[];
  freedom_metrics: FreedomStateMetrics;
  field_nodes: FieldVectorNode[];
  elements: EmergentElement[];
  minerals: MineralPhase[];
  planetary_layers: {
    core: PlanetaryLayerMetrics;
    mantle: PlanetaryLayerMetrics;
    crust: PlanetaryLayerMetrics;
  };
  atmosphere: AtmosphericMetrics;
  biomes: BiomeRegime[];
  is_bifurcation_point: boolean;
  bifurcation_reason?: string;
  sentience_threshold_met: boolean;
}

export interface CounterfactualBranch {
  branch_id: BranchId;
  name: string;
  parent_branch_id: BranchId | null;
  fork_timestep: number;
  current_timestep: number;
  status: 'active' | 'stabilized' | 'extinct' | 'hyper_locked' | 'dispersed';
  divergence_trigger: string;
  dominant_phase: string;
  stability_score: number;
  freedom_metric_snapshot: FreedomStateMetrics;
  snapshots: SimulationSnapshot[];
}

export interface BlindInference {
  property: string;
  observed_measurements: string;
  inference: string;
  confidence: number; // 0.0 - 1.0
  competing_interpretations: string[];
  falsification_criteria: string;
}

export interface ReverseInferenceReport {
  run_id: string;
  branch_id: string;
  timestep: number;
  inferences: BlindInference[];
  dominant_elemental_families: string[];
  dominant_compounds: string[];
  characteristic_spectrum: {
    peak_wavelength_nm: number;
    color_description: string;
    luminescence_type: string;
  };
  dominant_oscillatory_frequencies: string[];
  resonance_structures: string[];
  transition_behavior: string;
  state_accessibility_profile: string;
  forcing_sensitivity: string;
  persistence_profile: string;
  field_topology: string;
  major_environmental_regimes: string[];
  degrees_of_freedom_mathematical: string;
  stability_metastability_profile: string;
  detected_anomalies: string[];
}

export type TargetMatchType = 'exact' | 'strong' | 'partial' | 'weak' | 'divergent' | 'unsupported';
export type ConvergenceCategory = 'direct_convergence' | 'derived_convergence' | 'metaphorical_resemblance' | 'no_relationship';

export interface PropertyComparison {
  reference_property: string;
  reference_value: string;
  blind_inference: string;
  evidence_from_simulation: string;
  match_type: TargetMatchType;
  category: ConvergenceCategory;
  confidence: number;
  alternative_explanations: string;
  sensitivity_to_parameter_changes: string;
  appeared_timing: 'before_stabilization' | 'after_stabilization';
}

export type FinalVerdict = 'CONVERGENT' | 'PARTIALLY CONVERGENT' | 'INDETERMINATE' | 'DIVERGENT';

export interface TargetComparisonReport {
  evaluation_id: string;
  timestamp: string;
  branch_id: string;
  sealed_reference_name: string; // "Keylontic Code: Freedom"
  property_comparisons: PropertyComparison[];
  overall_convergence_score: number; // 0.0 - 100.0%
  convergence_by_scale: {
    quantum_spark: number;
    chemical_mineral: number;
    planetary_field: number;
    systemic_biosphere: number;
  };
  earliest_timestep_detectable: number;
  trajectory_over_time: 'strengthens' | 'weakens' | 'oscillates' | 'static';
  final_state_hides_earlier_convergence: boolean;
  earlier_peak_timestep?: number;
  verdict: FinalVerdict;
  scientific_critique: string;
}

export interface MythInterpretation {
  culture_identifier: string;
  sensory_horizon: string;
  mythic_cosmology: string;
  origin_allegory: string;
  ground_truth_alignment_accuracy: number; // 0.0 - 1.0 (how much physical truth they distorted)
  divergent_superstitions: string[];
}

export interface MythReport {
  timestep: number;
  sentience_emergence_epoch: number;
  interpretations: MythInterpretation[];
}
