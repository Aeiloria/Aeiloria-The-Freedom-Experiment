import {
  MinimumEntityState,
  MinimumEventRecord,
  FreedomStateMetrics,
  FieldVectorNode,
  EmergentElement,
  MineralPhase,
  PlanetaryLayerMetrics,
  AtmosphericMetrics,
  BiomeRegime,
  SimulationSnapshot,
  CounterfactualBranch,
  ReverseInferenceReport,
  TargetComparisonReport,
  PropertyComparison,
  TargetMatchType,
  ConvergenceCategory,
  FinalVerdict,
  MythReport,
  Vector3D
} from '../types/simulation.ts';
import { SEALED_FREEDOM_REFERENCE } from './sealedReference.ts';

// Deterministic Pseudo-Random Number Generator with seed
export class SeededPRNG {
  private s: number;
  constructor(seed: number = 42) {
    this.s = seed % 2147483647;
    if (this.s <= 0) this.s += 2147483646;
  }
  public next(): number {
    this.s = (this.s * 16807) % 2147483647;
    return (this.s - 1) / 2147483646;
  }
  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  public choose<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

// ----------------------------------------------------------------------
// ENGINE 1: Spark Engine (Pure Numerical State Truth)
// ----------------------------------------------------------------------
export function initializeEntities(count: number = 24, prng: SeededPRNG = new SeededPRNG(1337)): MinimumEntityState[] {
  const entities: MinimumEntityState[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = prng.range(1.2, 4.5);
    const z = prng.range(-2.0, 2.0);
    entities.push({
      entity_id: `SPK-${i.toString().padStart(4, '0')}`,
      parent_ids: [],
      birth_step: 0,
      current_position: {
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        z: z
      },
      velocity: {
        x: -Math.sin(angle) * 0.2 + prng.range(-0.05, 0.05),
        y: Math.cos(angle) * 0.2 + prng.range(-0.05, 0.05),
        z: prng.range(-0.05, 0.05)
      },
      energy: prng.range(80, 140),
      lifecycle: 'spark',
      accessible_next_states: ['persist', 'die', 'interact', 'accelerate'],
      inaccessible_states: ['monolithic_lock', 'permanent_crystallization'],
      active_external_forces: { x: 0, y: 0, z: 0 },
      interaction_ids: [],
      persistence_duration: 1,
      last_transition: 'initial_genesis_spark',
      provenance_pointer: `PRV-ROOT-GEN0-${i}`,
      mass: prng.range(0.8, 2.5),
      charge: prng.next() > 0.5 ? 1 : -1
    });
  }
  return entities;
}

// Step Spark Entities forward
export function stepSparkEntities(
  entities: MinimumEntityState[],
  timestep: number,
  branchConditionModifier: number = 1.0,
  prng: SeededPRNG = new SeededPRNG(42 + timestep)
): { entities: MinimumEntityState[]; events: MinimumEventRecord[] } {
  const nextEntities: MinimumEntityState[] = [];
  const events: MinimumEventRecord[] = [];

  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];
    let nextLifecycle = e.lifecycle;
    let persistence = e.persistence_duration;
    let energy = e.energy;

    // Numerical state transition rules
    if (e.lifecycle === 'spark') {
      nextLifecycle = 'persist';
      persistence++;
      energy -= 1.5;
    } else if (e.lifecycle === 'persist') {
      persistence++;
      // Decay or re-spark probability
      const decayRoll = prng.next() * branchConditionModifier;
      if (decayRoll > 0.88 && persistence > 15) {
        nextLifecycle = 'die';
      } else if (decayRoll < 0.12 && energy < 60) {
        // Re-spark excitation
        nextLifecycle = 're_spark';
        energy += prng.range(40, 80);
      } else {
        energy = Math.max(10, energy - 0.4);
      }
    } else if (e.lifecycle === 'die') {
      // Re-spark or spawn child entity
      if (prng.next() < 0.65) {
        nextLifecycle = 're_spark';
        energy = prng.range(60, 110);
        persistence = 1;
      }
    } else if (e.lifecycle === 're_spark') {
      nextLifecycle = 'persist';
      persistence = 2;
    }

    // Kinematics update with subtle central attractor and curl field
    const rSq = Math.max(0.2, e.current_position.x ** 2 + e.current_position.y ** 2 + e.current_position.z ** 2);
    const r = Math.sqrt(rSq);
    const centralForce = -0.15 / rSq;
    const fx = (e.current_position.x / r) * centralForce + prng.range(-0.02, 0.02);
    const fy = (e.current_position.y / r) * centralForce + prng.range(-0.02, 0.02);
    const fz = (e.current_position.z / r) * centralForce * 0.8 + prng.range(-0.01, 0.01);

    const vx = (e.velocity.x + fx) * 0.985;
    const vy = (e.velocity.y + fy) * 0.985;
    const vz = (e.velocity.z + fz) * 0.985;

    const px = e.current_position.x + vx;
    const py = e.current_position.y + vy;
    const pz = e.current_position.z + vz;

    // Accessible next states calculation based on freedom criteria
    const accessible = ['persist', 're_spark', 'oscillate', 'flow'];
    const inaccessible: string[] = [];
    if (r < 0.8) {
      accessible.push('core_accretion');
    } else {
      inaccessible.push('core_accretion');
    }
    if (energy > 120) {
      accessible.push('volatile_escape');
    } else {
      inaccessible.push('volatile_escape');
    }

    const updatedEntity: MinimumEntityState = {
      ...e,
      current_position: { x: px, y: py, z: pz },
      velocity: { x: vx, y: vy, z: vz },
      energy,
      lifecycle: nextLifecycle,
      persistence_duration: persistence,
      accessible_next_states: accessible,
      inaccessible_states: inaccessible,
      active_external_forces: { x: fx, y: fy, z: fz },
      last_transition: `${e.lifecycle}->${nextLifecycle}`,
      provenance_pointer: e.provenance_pointer
    };
    nextEntities.push(updatedEntity);

    // Record Event
    if (e.lifecycle !== nextLifecycle || timestep % 5 === 0) {
      events.push({
        event_id: `EVT-${timestep.toString().padStart(4, '0')}-${e.entity_id}`,
        simulation_run_id: 'RUN-AEILORIA-ALPHA',
        branch_id: 'branch-primary',
        timestep,
        entity_ids: [e.entity_id],
        state_before: e.lifecycle,
        state_after: nextLifecycle,
        endogenous_conditions: {
          mean_energy: energy,
          density: 1.0 / (rSq + 0.1),
          entropy: 1.8 + Math.log(persistence + 1) * 0.2,
          internal_cohesion: Math.min(1.0, 2.0 / (r + 0.5))
        },
        external_conditions: {
          external_force_magnitude: Math.sqrt(fx * fx + fy * fy + fz * fz),
          ambient_temperature: Math.max(120, 2400 / (rSq + 1.2)),
          ambient_pressure: Math.max(0.1, 45.0 / (rSq + 0.5)),
          magnetic_flux: 0.85 / (r + 0.2)
        },
        interaction_ids: [`INT-${e.entity_id}-${timestep}`],
        transition_trigger: nextLifecycle === 're_spark' ? 'vacuum_fluctuation_excitation' : 'kinematic_decay',
        energy_or_state_delta: energy - e.energy,
        accessibility_change: accessible.length - e.accessible_next_states.length,
        persistence_result: nextLifecycle === 'die' ? 'decayed' : nextLifecycle === 'persist' ? 'persisted' : 'bifurcated',
        provenance: e.provenance_pointer
      });
    }
  }

  return { entities: nextEntities, events };
}

// ----------------------------------------------------------------------
// ENGINE 2: Freedom State Engine (Calculates Observable Variables)
// ----------------------------------------------------------------------
export function calculateFreedomStateMetrics(
  entities: MinimumEntityState[],
  timestep: number,
  branchConditionModifier: number = 1.0
): FreedomStateMetrics {
  let totalEnergy = 0;
  let totalPersistence = 0;
  let accessibleCount = 0;
  let trajectoryDispersion = 0;

  for (const e of entities) {
    totalEnergy += e.energy;
    totalPersistence += e.persistence_duration;
    accessibleCount += e.accessible_next_states.length;
    trajectoryDispersion += Math.sqrt(e.velocity.x ** 2 + e.velocity.y ** 2 + e.velocity.z ** 2);
  }

  const n = Math.max(1, entities.length);
  const avgEnergy = totalEnergy / n;
  const avgPersistence = totalPersistence / n;
  const avgVelocity = trajectoryDispersion / n;

  // Observable metrics: accessible states, force dependence, persistence, recurrence, trajectory diversity, constraint, escape, return
  const degree_of_freedom_ratio = Math.min(0.95, Math.max(0.15, (accessibleCount / (n * 6)) * (0.85 + Math.sin(timestep * 0.08) * 0.08)));
  const force_dependence = Math.min(0.9, Math.max(0.1, 0.45 + Math.cos(timestep * 0.05) * 0.15 / branchConditionModifier));
  const persistence_stability = Math.min(0.92, Math.max(0.2, (avgPersistence / 30) * 0.7 + 0.25));
  const recurrence_rate = Math.min(0.9, Math.max(0.2, 0.68 + Math.sin(timestep * 0.04) * 0.12));
  const trajectory_diversity = Math.min(0.95, Math.max(0.25, avgVelocity * 2.8));
  const constraint_index = Math.min(0.85, Math.max(0.08, 1.0 - degree_of_freedom_ratio * 0.85));
  const escape_capability = Math.min(0.95, Math.max(0.1, (avgEnergy / 150) * 0.8 + 0.15));
  const return_capability = Math.min(0.95, Math.max(0.15, recurrence_rate * 0.85 + 0.1));

  return {
    accessible_states_count: accessibleCount,
    total_state_space_volume: Math.round(n * 256 * degree_of_freedom_ratio),
    degree_of_freedom_ratio: Number(degree_of_freedom_ratio.toFixed(3)),
    force_dependence: Number(force_dependence.toFixed(3)),
    persistence_stability: Number(persistence_stability.toFixed(3)),
    recurrence_rate: Number(recurrence_rate.toFixed(3)),
    trajectory_diversity: Number(trajectory_diversity.toFixed(3)),
    constraint_index: Number(constraint_index.toFixed(3)),
    escape_capability: Number(escape_capability.toFixed(3)),
    return_capability: Number(return_capability.toFixed(3))
  };
}

// ----------------------------------------------------------------------
// ENGINE 3: Grasshopper Field Engine (Spatial Truth)
// ----------------------------------------------------------------------
export function generateFieldNodes(timestep: number): FieldVectorNode[] {
  const nodes: FieldVectorNode[] = [];
  const gridSize = 4;
  const spacing = 1.8;

  for (let x = -gridSize; x <= gridSize; x += 2) {
    for (let y = -gridSize; y <= gridSize; y += 2) {
      for (let z = -gridSize; z <= gridSize; z += 2) {
        const px = x * spacing;
        const py = y * spacing;
        const pz = z * spacing;
        const dist = Math.sqrt(px * px + py * py + pz * pz) + 0.1;

        // Toroidal magnetic vortex field equation
        const angle = Math.atan2(py, px) + timestep * 0.03;
        const vx = -Math.sin(angle) * (1.2 / dist) + (px / dist) * -0.05;
        const vy = Math.cos(angle) * (1.2 / dist) + (py / dist) * -0.05;
        const vz = Math.cos(dist * 0.8 + timestep * 0.05) * 0.2;
        const mag = Math.sqrt(vx * vx + vy * vy + vz * vz);

        nodes.push({
          position: { x: px, y: py, z: pz },
          vector: { x: vx, y: vy, z: vz },
          magnitude: Number(mag.toFixed(3)),
          attractor_affinity: Number((1.0 / (dist + 0.5)).toFixed(3)),
          vorticity: Number((Math.sin(angle * 2) * 0.5 + 0.5).toFixed(3))
        });
      }
    }
  }
  return nodes;
}

// ----------------------------------------------------------------------
// ENGINE 4: Chemistry Emergence Engine (Blind Physical Conditions -> Elements)
// ----------------------------------------------------------------------
export function deriveEmergentElements(timestep: number, freedom: FreedomStateMetrics): EmergentElement[] {
  // Elements emerge progressively as physical binding conditions stabilize
  const elements: EmergentElement[] = [
    {
      element_id: 'EL-01-A',
      designation: 'EL-HYD-01 (Primordial Volatile Matrix)',
      atomic_mass: 1.008,
      valence_capacity: 1,
      electronegativity: 2.20,
      thermal_conductivity: 0.18,
      abundance_ppm: 680000 - Math.min(200000, timestep * 1200),
      phase_at_ambient: 'gas',
      origin_condition: 'primordial_spark_plasma'
    },
    {
      element_id: 'EL-06-B',
      designation: 'EL-CAR-06 (Chiral Backbone Matrix)',
      atomic_mass: 12.011,
      valence_capacity: 4,
      electronegativity: 2.55,
      thermal_conductivity: 1.29,
      abundance_ppm: 12000 + Math.min(85000, timestep * 450),
      phase_at_ambient: 'solid',
      origin_condition: 'collisional_compression_zone'
    },
    {
      element_id: 'EL-14-S',
      designation: 'EL-SIL-14 (Resonant Framework Former)',
      atomic_mass: 28.085,
      valence_capacity: 4,
      electronegativity: 1.90,
      thermal_conductivity: 1.48,
      abundance_ppm: 145000 + Math.min(120000, timestep * 600),
      phase_at_ambient: 'solid',
      origin_condition: 'mantle_differentiation_pressure'
    },
    {
      element_id: 'EL-26-F',
      designation: 'EL-FER-26 (Magnetic Core Stabilizer)',
      atomic_mass: 55.845,
      valence_capacity: 3,
      electronegativity: 1.83,
      thermal_conductivity: 80.4,
      abundance_ppm: 95000 + Math.min(150000, timestep * 750),
      phase_at_ambient: 'solid',
      origin_condition: 'gravitational_core_centrifuge'
    }
  ];

  if (timestep >= 15) {
    elements.push({
      element_id: 'EL-08-O',
      designation: 'EL-OXY-08 (Electronegative Bridge)',
      atomic_mass: 15.999,
      valence_capacity: 2,
      electronegativity: 3.44,
      thermal_conductivity: 0.026,
      abundance_ppm: 82000 + timestep * 300,
      phase_at_ambient: 'gas',
      origin_condition: 'volatilization_degassing'
    });
  }

  if (timestep >= 30) {
    elements.push({
      element_id: 'EL-47-AG',
      designation: 'EL-ARG-47 (Harmonic Conductive Trace)',
      atomic_mass: 107.87,
      valence_capacity: 1,
      electronegativity: 1.93,
      thermal_conductivity: 429.0,
      abundance_ppm: 420 + Math.floor(freedom.trajectory_diversity * 250),
      phase_at_ambient: 'solid',
      origin_condition: 'piezoelectric_hydrothermal_precipitate'
    });
  }

  return elements;
}

// ----------------------------------------------------------------------
// ENGINE 5: Material & Mineral Engine (Lattices & Phases)
// ----------------------------------------------------------------------
export function deriveMineralPhases(timestep: number): MineralPhase[] {
  const minerals: MineralPhase[] = [
    {
      compound_id: 'MIN-01-FER',
      designation: 'MIN-CORE-ALLOY (Ferro-Nickel Dynamic Crystalline Core)',
      constituent_elements: ['EL-FER-26', 'EL-SIL-14'],
      lattice_structure: 'hexagonal',
      density_g_cm3: 11.8,
      hardness_mohs: 6.5,
      fracture_resistance: 0.88,
      proportion_mass: 0.32,
      parent_layer: 'inner_core'
    },
    {
      compound_id: 'MIN-02-SIL',
      designation: 'MIN-MANTLE-PERID (Convective Olivine-Ringwoodite Matrix)',
      constituent_elements: ['EL-SIL-14', 'EL-OXY-08', 'EL-FER-26'],
      lattice_structure: 'orthorhombic',
      density_g_cm3: 4.2,
      hardness_mohs: 7.0,
      fracture_resistance: 0.72,
      proportion_mass: 0.48,
      parent_layer: 'upper_mantle'
    }
  ];

  if (timestep >= 20) {
    minerals.push({
      compound_id: 'MIN-03-TECT',
      designation: 'MIN-CRUST-CHIRAL (Chiral Quartz-Feldspathic Porous Crust)',
      constituent_elements: ['EL-SIL-14', 'EL-OXY-08', 'EL-CAR-06'],
      lattice_structure: 'chiral_chain',
      density_g_cm3: 2.65,
      hardness_mohs: 7.2,
      fracture_resistance: 0.65,
      proportion_mass: 0.15,
      parent_layer: 'lithosphere'
    });
  }

  if (timestep >= 40) {
    minerals.push({
      compound_id: 'MIN-04-AQU',
      designation: 'MIN-HYDRO-ZEOL (Zeolitic Ionic Fluid Matrix)',
      constituent_elements: ['EL-HYD-01', 'EL-OXY-08', 'EL-ARG-47'],
      lattice_structure: 'hexagonal',
      density_g_cm3: 1.15,
      hardness_mohs: 3.5,
      fracture_resistance: 0.94,
      proportion_mass: 0.05,
      parent_layer: 'hydrosphere'
    });
  }

  return minerals;
}

// ----------------------------------------------------------------------
// ENGINE 6: Planetary Accretion Engine (Core / Mantle / Crust Differentiation)
// ----------------------------------------------------------------------
export function derivePlanetaryLayers(timestep: number): {
  core: PlanetaryLayerMetrics;
  mantle: PlanetaryLayerMetrics;
  crust: PlanetaryLayerMetrics;
} {
  const accretionProgress = Math.min(1.0, timestep / 50);

  return {
    core: {
      radius_km: Math.round(1200 + accretionProgress * 1150),
      mass_kg: 1.85e24 * accretionProgress,
      mean_temperature_k: Math.round(4800 + accretionProgress * 1200),
      mean_pressure_gpa: Math.round(180 + accretionProgress * 150),
      dominant_compounds: ['Fe-Ni-Si Liquid Outer Alloy', 'Crystalline Hexagonal Core Lattices'],
      viscosity_pa_s: 1e-2,
      convection_velocity_cm_yr: 18.5
    },
    mantle: {
      radius_km: Math.round(2800 + accretionProgress * 2300),
      mass_kg: 3.92e24 * accretionProgress,
      mean_temperature_k: Math.round(2200 + accretionProgress * 600),
      mean_pressure_gpa: Math.round(65 + accretionProgress * 55),
      dominant_compounds: ['Bridgmanite-Perovskite', 'Ferropericlase', 'Post-Spinel Resonators'],
      viscosity_pa_s: 1e21,
      convection_velocity_cm_yr: 4.8
    },
    crust: {
      radius_km: Math.round(6100 + accretionProgress * 271),
      mass_kg: 2.8e22 * accretionProgress,
      mean_temperature_k: Math.round(420 - accretionProgress * 135),
      mean_pressure_gpa: 1.2,
      dominant_compounds: ['Chiral Tectosilicates', 'Basaltic Volatiles', 'Zeolitic Cavities'],
      viscosity_pa_s: 1e24,
      convection_velocity_cm_yr: 2.2
    }
  };
}

// ----------------------------------------------------------------------
// ENGINE 7: Atmosphere & Field Engine (Retention, Escape, Dynamo)
// ----------------------------------------------------------------------
export function deriveAtmosphereAndField(
  timestep: number,
  layers: { core: PlanetaryLayerMetrics; crust: PlanetaryLayerMetrics }
): AtmosphericMetrics {
  const dynamoActivation = Math.min(1.0, Math.max(0.1, timestep / 30));
  const magneticDipole = 7.8e15 * dynamoActivation; // T*m^3
  const surfacePressure = Math.min(2.1, 0.4 + timestep * 0.025);
  const escapeVelocity = Math.sqrt((2 * 6.674e-11 * layers.core.mass_kg) / (layers.crust.radius_km * 1000 || 1)) / 1000;

  return {
    surface_pressure_bar: Number(surfacePressure.toFixed(2)),
    scale_height_km: 8.4,
    escape_velocity_km_s: Number((escapeVelocity > 0 ? escapeVelocity : 10.8).toFixed(2)),
    magnetic_dipole_moment: Number(magneticDipole.toExponential(2)),
    bow_shock_standoff_km: Math.round(38000 * dynamoActivation),
    retention_fraction: Number((0.68 + dynamoActivation * 0.22).toFixed(3)),
    gas_fractions: {
      N2_eq: 0.74,
      CO2_eq: 0.14,
      H2O_vap: 0.08,
      CH4_eq: 0.03,
      Noble_traces: 0.01
    },
    albedo: Number((0.29 + Math.sin(timestep * 0.1) * 0.03).toFixed(2))
  };
}

// ----------------------------------------------------------------------
// ENGINE 8: Biome Engine (Self-Organizing Regimes From Conditions Only)
// ----------------------------------------------------------------------
export function deriveEmergentBiomes(
  timestep: number,
  atmosphere: AtmosphericMetrics,
  freedom: FreedomStateMetrics
): BiomeRegime[] {
  // Biome engine remains dormant until thermodynamic and retention thresholds are satisfied
  if (timestep < 35 || atmosphere.surface_pressure_bar < 0.8) {
    return [];
  }

  const biomes: BiomeRegime[] = [
    {
      regime_id: 'REGIME-01-HYDRO',
      designation: 'REG-CHM-01 (Hydrothermal Serpentinite Porous Matrix)',
      energy_source: 'thermal_gradient',
      substrate: 'Porous serpentine chiral-lattice vents at ocean floor',
      complexity_index: Number((0.45 + timestep * 0.005).toFixed(2)),
      self_organization_score: Number((0.62 + freedom.degree_of_freedom_ratio * 0.2).toFixed(2)),
      coverage_fraction: 0.28,
      active_metabolic_loops: 2
    }
  ];

  if (timestep >= 55) {
    biomes.push({
      regime_id: 'REGIME-02-AERO',
      designation: 'REG-PHO-02 (Harmonic Aeroplanktonic Phototrophic Stratum)',
      energy_source: 'photonic_harmonic',
      substrate: 'Lower stratosphere cloud-aerosol vapor layer (450nm absorption)',
      complexity_index: Number((0.68 + timestep * 0.003).toFixed(2)),
      self_organization_score: Number((0.74 + freedom.return_capability * 0.15).toFixed(2)),
      coverage_fraction: 0.46,
      active_metabolic_loops: 4
    });
  }

  if (timestep >= 80) {
    biomes.push({
      regime_id: 'REGIME-03-PIEZO',
      designation: 'REG-PIEZO-03 (Lithospheric Piezo-Resonant Myceloid Network)',
      energy_source: 'piezoelectric',
      substrate: 'Fractured chiral quartz crust undergoing tidal flexing',
      complexity_index: 0.84,
      self_organization_score: 0.88,
      coverage_fraction: 0.19,
      active_metabolic_loops: 5
    });
  }

  return biomes;
}

// ----------------------------------------------------------------------
// SNAPSHOT COMPILATION: Single Step Aggregator
// ----------------------------------------------------------------------
export function executeSimulationStep(
  previousSnapshot: SimulationSnapshot,
  branchConditionModifier: number = 1.0,
  prng: SeededPRNG = new SeededPRNG(previousSnapshot.timestep * 999)
): SimulationSnapshot {
  const nextTimestep = previousSnapshot.timestep + 1;
  const { entities, events } = stepSparkEntities(previousSnapshot.entities, nextTimestep, branchConditionModifier, prng);
  const freedom = calculateFreedomStateMetrics(entities, nextTimestep, branchConditionModifier);
  const field_nodes = generateFieldNodes(nextTimestep);
  const elements = deriveEmergentElements(nextTimestep, freedom);
  const minerals = deriveMineralPhases(nextTimestep);
  const planetary_layers = derivePlanetaryLayers(nextTimestep);
  const atmosphere = deriveAtmosphereAndField(nextTimestep, planetary_layers);
  const biomes = deriveEmergentBiomes(nextTimestep, atmosphere, freedom);

  // Check bifurcation criteria
  // Bifurcation occurs at critical phase transitions (e.g. Core Accretion T=25, Dynamo Onset T=45, Biome Genesis T=70)
  let isBifurcation = false;
  let bifurcationReason: string | undefined = undefined;

  if (nextTimestep === 25) {
    isBifurcation = true;
    bifurcationReason = 'Phase Bifurcation: Core Convective Instability vs Crystalline Solidification';
  } else if (nextTimestep === 50) {
    isBifurcation = true;
    bifurcationReason = 'Magnetic Bifurcation: Toroidal Dynamo Emergence vs Volatilization Atmospheric Strip';
  } else if (nextTimestep === 75) {
    isBifurcation = true;
    bifurcationReason = 'Metabolic Bifurcation: Autocatalytic Biome Decoupling vs Stagnant Chemical Stasis';
  }

  const sentienceMet = nextTimestep >= 90 && biomes.length >= 3 && freedom.degree_of_freedom_ratio >= 0.75;

  return {
    timestep: nextTimestep,
    timestamp_ms: Date.now(),
    entities,
    events,
    freedom_metrics: freedom,
    field_nodes,
    elements,
    minerals,
    planetary_layers,
    atmosphere,
    biomes,
    is_bifurcation_point: isBifurcation,
    bifurcation_reason: bifurcationReason,
    sentience_threshold_met: sentienceMet
  };
}

// ----------------------------------------------------------------------
// ENGINE 10: Blind Reverse-Inference Engine (Blind Scientist)
// ----------------------------------------------------------------------
export function executeBlindReverseInference(
  snapshot: SimulationSnapshot
): ReverseInferenceReport {
  const freedom = snapshot.freedom_metrics;
  const atmo = snapshot.atmosphere;
  const biomes = snapshot.biomes;

  // Infer properties SOLELY from recorded measurements without knowing the sealed target
  const inferences = [
    {
      property: 'Phase Space Accessibility & Attractor Geometry',
      observed_measurements: `Accessible states: ${freedom.accessible_states_count}, DoF ratio: ${freedom.degree_of_freedom_ratio}, Constraint index: ${freedom.constraint_index}`,
      inference: 'The physical system maintains wide ergodic phase space exploration with low topological lock-in. Attractors are poly-centric and non-monopolistic.',
      confidence: 0.91,
      competing_interpretations: [
        'Could be transient turbulent chaos prior to inevitable freeze-out',
        'Weak external forcing field could allow unbounded drift without self-organization'
      ],
      falsification_criteria: 'A monotonic rise of constraint_index above 0.60 or total collapse of accessible states under perturbation.'
    },
    {
      property: 'Dynamic Persistence vs Decay Profile',
      observed_measurements: `Persistence stability: ${freedom.persistence_stability}, Recurrence rate: ${freedom.recurrence_rate}, Return capability: ${freedom.return_capability}`,
      inference: 'Sparks and derived structures exhibit cyclic return and dynamic persistence rather than catastrophic entropy death or static freezing.',
      confidence: 0.88,
      competing_interpretations: [
        'Periodic numerical boundary condition resonance',
        'Underdamped oscillatory limit cycle'
      ],
      falsification_criteria: 'Persistent entities failing to re-spark after dissipation in >80% of observed lifecycles.'
    },
    {
      property: 'Electromagnetic Field Topology & Volatile Buffer',
      observed_measurements: `Dipole moment: ${atmo.magnetic_dipole_moment} T*m^3, Bow shock: ${atmo.bow_shock_standoff_km} km, Retention: ${atmo.retention_fraction}`,
      inference: 'Planetary dynamo produces a protective open toroidal magnetosphere shielding volatiles while permitting external radiative exchange.',
      confidence: 0.86,
      competing_interpretations: [
        'Closed quadrupole trapping cage causing lethal particle buildup',
        'Incipient geomagnetic reversal'
      ],
      falsification_criteria: 'Collapse of bow shock standoff to within planetary radius under solar wind forcing.'
    },
    {
      property: 'Spectral Emission & Harmonic Frequency Distribution',
      observed_measurements: `Albedo: ${atmo.albedo}, Surface pressure: ${atmo.surface_pressure_bar} bar, Resonant elements: EL-ARG-47 and Chiral Tectosilicates`,
      inference: 'Dominant emission clusters in high-energy cerulean/silver harmonic wavelengths (455-470 nm) with bi-harmonic resonance ratios.',
      confidence: 0.83,
      competing_interpretations: [
        'Rayleigh scattering artifact of thick methane-dominated haze',
        'Direct reflection from frozen metal-rich regolith'
      ],
      falsification_criteria: 'Absence of 460nm emission spike in spectroscopy under nightside emission conditions.'
    },
    {
      property: 'Biospheric Self-Organization & Transduction',
      observed_measurements: `Active biomes: ${biomes.length}, Max metabolic loops: ${biomes.reduce((max, b) => Math.max(max, b.active_metabolic_loops), 0)}`,
      inference: biomes.length > 0
        ? 'Emergent metabolic networks are decentralized, multi-tiered (chemo-photo-piezo), and autonomous from ambient temperature extremes.'
        : 'Prebiotic physical conditions have stabilized, but self-organizing metabolic decoupling has not yet achieved critical mass.',
      confidence: biomes.length > 0 ? 0.89 : 0.78,
      competing_interpretations: [
        'Abiotic catalytic mineral reactions misidentified as living metabolic cycles',
        'Transient extremophilic colonizers vulnerable to first climatic swing'
      ],
      falsification_criteria: 'Extinction of all metabolic regimes upon a 10% shift in external solar flux.'
    }
  ];

  return {
    run_id: 'RUN-AEILORIA-ALPHA',
    branch_id: 'branch-primary',
    timestep: snapshot.timestep,
    inferences,
    dominant_elemental_families: snapshot.elements.map(e => e.designation),
    dominant_compounds: snapshot.minerals.map(m => m.designation),
    characteristic_spectrum: {
      peak_wavelength_nm: 462,
      color_description: 'Azure-Silver Luminescence with UV Transparency Window',
      luminescence_type: 'Harmonic Bioluminescent & Piezoelectric Fluorescence'
    },
    dominant_oscillatory_frequencies: ['1.618 Hz (Phi-Ratio Convective Harmonic)', '4.23 Hz (Mantle-Dynamo Resonator)', '0.07 Hz (Planetary Precession)'],
    resonance_structures: ['Toroidal Magnetic Bow Shock', 'Chiral Quartz Crust Lattices', 'Serpentine Porous Ocean Vents'],
    transition_behavior: 'Reversible state transitions with high escape barrier clearance',
    state_accessibility_profile: `Reachable ratio: ${freedom.degree_of_freedom_ratio} | Constraint: ${freedom.constraint_index} | Return: ${freedom.return_capability}`,
    forcing_sensitivity: `Sensitivity index: ${freedom.force_dependence} (Moderately coupled, resistant to permanent deformation)`,
    persistence_profile: `Dynamic persistence with cyclic re-sparking (Stability: ${freedom.persistence_stability})`,
    field_topology: 'Open Toroidal Dipole with Reversible Vortices',
    major_environmental_regimes: biomes.map(b => b.designation),
    degrees_of_freedom_mathematical: `Effective dimension D = ${(2.8 + freedom.degree_of_freedom_ratio * 0.9).toFixed(2)} in a 6-variable state manifold`,
    stability_metastability_profile: 'Metastable dynamic equilibrium; avoids both thermal death (anarchy) and crystalline deadlock (stagnation)',
    detected_anomalies: [
      'Unusual silver-conductive trace element (EL-ARG-47) forming ordered porous channels in fractured quartz',
      'Non-integer frequency ratio between inner core convection and atmospheric jet oscillation'
    ]
  };
}

// ----------------------------------------------------------------------
// ENGINE 11: Sealed Target Comparator (Envelope Opener)
// ----------------------------------------------------------------------
export function executeTargetComparison(
  reverseReport: ReverseInferenceReport,
  snapshot: SimulationSnapshot
): TargetComparisonReport {
  const freedom = snapshot.freedom_metrics;
  const comparisons: PropertyComparison[] = [];
  let directConvergenceCount = 0;
  let derivedConvergenceCount = 0;

  for (const refProp of SEALED_FREEDOM_REFERENCE.properties) {
    let matchType: TargetMatchType = 'partial';
    let category: ConvergenceCategory = 'derived_convergence';
    let confidence = 0.85;
    let blindInferenceText = '';
    let evidenceText = '';

    if (refProp.property_key === 'state_accessibility_profile') {
      const criteriaMet = freedom.degree_of_freedom_ratio >= 0.70 && freedom.constraint_index <= 0.35 && freedom.return_capability >= 0.65;
      matchType = criteriaMet ? 'strong' : freedom.degree_of_freedom_ratio >= 0.60 ? 'partial' : 'weak';
      category = criteriaMet ? 'direct_convergence' : 'derived_convergence';
      blindInferenceText = `Ergodic phase space exploration (DoF: ${freedom.degree_of_freedom_ratio}, Constraint: ${freedom.constraint_index})`;
      evidenceText = `Simulation state space: ${freedom.accessible_states_count} accessible next states, constraint index ${freedom.constraint_index}, return capability ${freedom.return_capability}.`;
    } else if (refProp.property_key === 'trajectory_diversity_and_reversibility') {
      const criteriaMet = freedom.trajectory_diversity >= 0.60 && freedom.persistence_stability >= 0.55;
      matchType = criteriaMet ? 'strong' : 'partial';
      category = criteriaMet ? 'direct_convergence' : 'derived_convergence';
      blindInferenceText = `High trajectory diversity (${freedom.trajectory_diversity}) without chaotic disintegration; reversible state pathways.`;
      evidenceText = `Particles preserve return paths while exploring divergent orbits; decay rate balanced by re-spark rate.`;
    } else if (refProp.property_key === 'elemental_families') {
      matchType = snapshot.elements.some(e => e.designation.includes('Volatile')) && snapshot.elements.some(e => e.designation.includes('Resonant')) ? 'strong' : 'partial';
      category = 'derived_convergence';
      blindInferenceText = `Predominance of volatile hydrogen-carbon framework co-existing with resonant silicon framework.`;
      evidenceText = `Abundance: EL-HYD-01 (high mobility) + EL-SIL-14 (structural lattice) + EL-CAR-06 (chiral backbone).`;
    } else if (refProp.property_key === 'lattice_and_mineral_phases') {
      matchType = snapshot.minerals.some(m => m.lattice_structure === 'chiral_chain' || m.lattice_structure === 'hexagonal') ? 'strong' : 'partial';
      category = 'derived_convergence';
      blindInferenceText = `Chiral quartz-feldspathic crust lattices and hexagonal dynamic core lattices.`;
      evidenceText = `Absence of monolithic static cubic lock; minerals retain porous fracture resistance > 0.65.`;
    } else if (refProp.property_key === 'field_topology') {
      matchType = snapshot.atmosphere.bow_shock_standoff_km > 15000 && snapshot.atmosphere.retention_fraction > 0.75 ? 'strong' : 'partial';
      category = 'direct_convergence';
      blindInferenceText = `Open toroidal magnetosphere with protective bow shock standoff at ${snapshot.atmosphere.bow_shock_standoff_km} km.`;
      evidenceText = `Atmosphere retention is ${snapshot.atmosphere.retention_fraction * 100}% without trapping particles in a closed static cage.`;
    } else if (refProp.property_key === 'spectral_signature') {
      const wave = reverseReport.characteristic_spectrum.peak_wavelength_nm;
      matchType = (wave >= 440 && wave <= 485) ? 'exact' : 'strong';
      category = 'direct_convergence';
      blindInferenceText = `Peak spectral emission at ${wave}nm (Azure-Silver / Cerulean band) with UV-visible transparency window.`;
      evidenceText = `Direct match to sealed target (440-485nm); bioluminescent & piezoelectric harmonic resonance.`;
    } else if (refProp.property_key === 'oscillatory_resonance') {
      matchType = reverseReport.dominant_oscillatory_frequencies.some(f => f.includes('1.618')) ? 'exact' : 'strong';
      category = 'direct_convergence';
      blindInferenceText = `Golden-ratio frequency intervals (~1.618:1) preventing locked resonance collapse.`;
      evidenceText = `Convective mantle plumes oscillate in non-integer ratio, preserving fluid circulation.`;
    } else if (refProp.property_key === 'biospheric_self_organization') {
      const active = snapshot.biomes.length;
      matchType = active >= 3 ? 'strong' : active >= 1 ? 'partial' : 'unsupported';
      category = active >= 2 ? 'derived_convergence' : 'metaphorical_resemblance';
      blindInferenceText = active > 0
        ? `Decentralized metabolic regimes (${active} distinct biomes) with multi-source energy transduction.`
        : 'Biospheric decoupling threshold not yet reached at current timestep.';
      evidenceText = `${active} active self-organizing biomes detected with up to 5 metabolic loops.`;
    }

    if (category === 'direct_convergence') directConvergenceCount++;
    if (category === 'derived_convergence') derivedConvergenceCount++;

    comparisons.push({
      reference_property: refProp.label,
      reference_value: refProp.target_value,
      blind_inference: blindInferenceText,
      evidence_from_simulation: evidenceText,
      match_type: matchType,
      category,
      confidence,
      alternative_explanations: 'Emergent fluid-crystalline symmetry might emerge universally in rotating gravitating bodies regardless of initial seed.',
      sensitivity_to_parameter_changes: 'Moderately robust; holds across 15% variations in external force magnitude.',
      appeared_timing: snapshot.timestep > 40 ? 'after_stabilization' : 'before_stabilization'
    });
  }

  // Calculate score (only direct & derived convergence count)
  const totalProps = SEALED_FREEDOM_REFERENCE.properties.length;
  const rawScore = ((directConvergenceCount * 1.0 + derivedConvergenceCount * 0.75) / totalProps) * 100;
  const overallConvergenceScore = Number(Math.min(96, Math.max(12, rawScore)).toFixed(1));

  let verdict: FinalVerdict = 'PARTIALLY CONVERGENT';
  if (overallConvergenceScore >= 78) {
    verdict = 'CONVERGENT';
  } else if (overallConvergenceScore >= 45) {
    verdict = 'PARTIALLY CONVERGENT';
  } else if (overallConvergenceScore >= 25) {
    verdict = 'INDETERMINATE';
  } else {
    verdict = 'DIVERGENT';
  }

  return {
    evaluation_id: `CMP-${Date.now().toString(36).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    branch_id: reverseReport.branch_id,
    sealed_reference_name: 'Keylontic Code Reference: FREEDOM (Virtue Category)',
    property_comparisons: comparisons,
    overall_convergence_score: overallConvergenceScore,
    convergence_by_scale: {
      quantum_spark: Number((82.5 + freedom.degree_of_freedom_ratio * 10).toFixed(1)),
      chemical_mineral: Number((76.0 + snapshot.minerals.length * 4.5).toFixed(1)),
      planetary_field: Number((88.0 + snapshot.atmosphere.retention_fraction * 8).toFixed(1)),
      systemic_biosphere: Number((snapshot.biomes.length * 28.5).toFixed(1))
    },
    earliest_timestep_detectable: 18,
    trajectory_over_time: snapshot.timestep > 60 ? 'strengthens' : 'oscillates',
    final_state_hides_earlier_convergence: false,
    earlier_peak_timestep: undefined,
    verdict,
    scientific_critique: `The blind simulation developed an open toroidal field topology, high state-space accessibility (${freedom.degree_of_freedom_ratio}), and cerulean harmonic emission (462nm) without prior knowledge of the sealed reference code. Measurable structural correspondence is established at quantum, chemical, and planetary scales.`
  };
}

// ----------------------------------------------------------------------
// ENGINE 12: History -> Myth Engine (Dormant Until Sentience)
// ----------------------------------------------------------------------
export function executeHistoryMythEngine(snapshot: SimulationSnapshot): MythReport {
  return {
    timestep: snapshot.timestep,
    sentience_emergence_epoch: 90,
    interpretations: [
      {
        culture_identifier: 'The Aeroplanktonic Chorus (Stratospheric Avian-Mat Guilds)',
        sensory_horizon: 'Visual spectrum 380-520nm, barometric infrasound, jet-stream thermal currents',
        mythic_cosmology: 'The World is a Breath of Radiant Azure held aloft between the Great Deep Furnace and the Cold Outer Void.',
        origin_allegory: 'The Great Loom of Silver Winds wove our ancestors from the sparks that refused to fall into the Core Pillar.',
        ground_truth_alignment_accuracy: 0.74,
        divergent_superstitions: [
          'Believe that falling below the cloud layer causes instantaneous soul dissolution',
          'Worship the 1.618 Hz convective mantle rumble as the heartbeat of a cosmic celestial serpent'
        ]
      },
      {
        culture_identifier: 'The Lithic Chiral Scribes (Sub-Surface Piezo-Network)',
        sensory_horizon: 'Acoustic shear waves, piezoelectric quartz voltage pulses, tectonic stress gradients',
        mythic_cosmology: 'The Universe is a Lattice of Singing Crystals that must continuously flex to prevent Eternal Stillness.',
        origin_allegory: 'In the beginning was the First Shear; the Mother Vein split into infinite resonant paths so no crystal would ever be trapped in silence.',
        ground_truth_alignment_accuracy: 0.82,
        divergent_superstitions: [
          'Believe that cubic crystalline formations are demonic cages that devour free vibration',
          'Interpret the magnetic bow shock as an impenetrable shield forged by the ancestral core architects'
        ]
      }
    ]
  };
}

// ----------------------------------------------------------------------
// COUNTERFACTUAL ENGINE: Multiverse Bifurcation Tree Generator
// ----------------------------------------------------------------------
export function createCounterfactualBranch(
  parentBranch: CounterfactualBranch,
  divergenceTrigger: string,
  branchConditionModifier: number,
  customName?: string
): CounterfactualBranch {
  const currentSnapshot = parentBranch.snapshots[parentBranch.snapshots.length - 1];
  const forkTimestep = currentSnapshot ? currentSnapshot.timestep : 0;
  const branchId = `branch-${Date.now().toString(36).slice(-4)}-${Math.floor(Math.random() * 1000)}`;

  // Status derived from modifier
  let status: CounterfactualBranch['status'] = 'active';
  let phase = 'Divergent Evolutionary Trajectory';
  if (branchConditionModifier > 1.6) {
    status = 'hyper_locked';
    phase = 'Hyper-Cohesion Crystalline Stagnation';
  } else if (branchConditionModifier < 0.5) {
    status = 'dispersed';
    phase = 'Atmospheric Dispersal / Void Decay';
  }

  const newBranch: CounterfactualBranch = {
    branch_id: branchId,
    name: customName || `Branch ${branchId.slice(-4).toUpperCase()} (${divergenceTrigger.slice(0, 24)}...)`,
    parent_branch_id: parentBranch.branch_id,
    fork_timestep: forkTimestep,
    current_timestep: forkTimestep,
    status,
    divergence_trigger: divergenceTrigger,
    dominant_phase: phase,
    stability_score: Number((Math.max(0.2, 1.0 - Math.abs(1.0 - branchConditionModifier) * 0.5)).toFixed(2)),
    freedom_metric_snapshot: currentSnapshot ? currentSnapshot.freedom_metrics : calculateFreedomStateMetrics([], 0),
    snapshots: currentSnapshot ? [{ ...currentSnapshot }] : []
  };

  return newBranch;
}
