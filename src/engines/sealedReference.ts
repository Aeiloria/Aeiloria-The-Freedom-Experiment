export interface SealedReferenceSpecification {
  code_id: string;
  virtue_name: string;
  sealed_hash: string;
  properties: {
    property_key: string;
    label: string;
    target_value: string;
    scale: 'quantum_spark' | 'chemical_mineral' | 'planetary_field' | 'systemic_biosphere';
    measurable_criteria: string;
  }[];
}

export const SEALED_FREEDOM_REFERENCE: SealedReferenceSpecification = {
  code_id: "REF-AEILORIA-FREEDOM-V1",
  virtue_name: "Freedom",
  sealed_hash: "0x8f72c1a93b2e55d400192eab883c74f114e92a",
  properties: [
    {
      property_key: "state_accessibility_profile",
      label: "Reachable State Space & Non-Monopolistic Attractors",
      target_value: "Wide accessible state space (>0.72 ratio) with open return pathways; zero permanent dead-end traps or monopolistic basin collapse",
      scale: "quantum_spark",
      measurable_criteria: "degree_of_freedom_ratio >= 0.70 and constraint_index <= 0.35 with return_capability >= 0.65"
    },
    {
      property_key: "trajectory_diversity_and_reversibility",
      label: "Trajectory Diversity & Reversible Pathing",
      target_value: "High trajectory divergence without chaotic disintegration; pathways preserve reversible transition triggers",
      scale: "quantum_spark",
      measurable_criteria: "trajectory_diversity >= 0.60 and persistence_stability >= 0.55"
    },
    {
      property_key: "elemental_families",
      label: "Fluidic-Resonant Elemental Substrate",
      target_value: "Predominance of high-mobility volatile matrices paired with resonant semi-conducting chiral matrices (Hydride-Silicate-Carbon equivalents)",
      scale: "chemical_mineral",
      measurable_criteria: "Fluid volatile presence > 40% with crystalline lattice co-existence"
    },
    {
      property_key: "lattice_and_mineral_phases",
      label: "Dynamic Metastable Lattices",
      target_value: "Chiral chains and hexagonal/orthorhombic porous lattices permitting fluid transport and phase transitions under ambient forcing",
      scale: "chemical_mineral",
      measurable_criteria: "Prevalence of porous/chiral lattice structures rather than monolithic cubic lock"
    },
    {
      property_key: "field_topology",
      label: "Open Toroidal Field & Magnetospheric Buffer",
      target_value: "Open toroidal dipole with protective bow shock preventing volatilization without creating static confinement cages",
      scale: "planetary_field",
      measurable_criteria: "Toroidal magnetospheric bow shock with balanced retention fraction (0.75 - 0.92)"
    },
    {
      property_key: "spectral_signature",
      label: "Cerulean-Silver Harmonic Luminescence",
      target_value: "Peak spectral emission between 440nm and 485nm (Azure / Cerulean / Silver harmonic band) with UV-visible transparency window",
      scale: "planetary_field",
      measurable_criteria: "Peak wavelength 440nm - 485nm and luminescence category harmonic/bioluminescent"
    },
    {
      property_key: "oscillatory_resonance",
      label: "Poly-Harmonic Golden Ratio Frequency Ratio",
      target_value: "Non-integer golden-ratio frequency intervals (~1.618:1) preventing phase-locking resonances that would enforce rigid crystallization",
      scale: "planetary_field",
      measurable_criteria: "Rotational / convective harmonic ratio approximating phi (1.55 - 1.68)"
    },
    {
      property_key: "biospheric_self_organization",
      label: "Emergent Decentralized Metabolic Regimes",
      target_value: "Self-organizing metabolic loops that decouple internal entropy from ambient fluctuations through autonomous energy transduction",
      scale: "systemic_biosphere",
      measurable_criteria: "Multiple active metabolic loops (>= 3) with self_organization_score >= 0.68"
    }
  ]
};
