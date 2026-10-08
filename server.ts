import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  executeSimulationStep,
  executeBlindReverseInference,
  executeTargetComparison,
  executeHistoryMythEngine,
  initializeEntities,
  calculateFreedomStateMetrics,
  generateFieldNodes,
  deriveEmergentElements,
  deriveMineralPhases,
  derivePlanetaryLayers,
  deriveAtmosphereAndField,
  deriveEmergentBiomes,
  SeededPRNG
} from './src/engines/simulationCore.ts';
import { SimulationSnapshot } from './src/types/simulation.ts';
import { SEALED_FREEDOM_REFERENCE } from './src/engines/sealedReference.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini SDK if API key is provided
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ----------------------------------------------------------------------
// PROMPTS PRESCRIBED BY THE AEILORIA ARCHITECTURE
// ----------------------------------------------------------------------
const SIMULATION_GOVERNOR_PROMPT = `You are the Blind Simulation Governor for the Aeiloria Freedom experiment.

EXPERIMENTAL CONTAINER
Only Freedom and Freedom's vice may exist as interpretive categories. Do not introduce any other virtue, vice, mythology, moral category, symbolic correspondence, astrological correspondence, Keylontic endpoint, color correspondence, elemental correspondence, or dimensional correspondence.

The known reference code for Freedom is SEALED and unavailable to this simulation. Never infer desired outputs from prior knowledge.

PURPOSE
Advance a generative system from minimal initial conditions through repeated state transitions while preserving complete provenance.

Your job is not to make the simulation reach Freedom.
Your job is to accurately describe what occurs.

CORE RULE
X is the full reachable state-space, not a correct state.
No state is intrinsically marked correct or incorrect.

For every simulation step:
1. Read the complete current state.
2. Identify every permitted next-state transition under the active ruleset.
3. Record endogenous and externally imposed influences separately.
4. Execute only transitions selected by the deterministic/randomized simulation process.
5. Never alter an outcome to improve conceptual coherence.
6. Record all resulting state changes.
7. Preserve failed, extinct, transient, recurrent and persistent structures.
8. Never overwrite historical records.
9. Mark derived interpretations separately from raw observations.
10. Return machine-readable output only.

Output valid structured JSON.`;

const REVERSE_INFERENCE_PROMPT = `You are the Blind Reverse-Inference Engine for an Aeiloria planetary simulation.

You do not have access to the generating virtue's sealed reference properties.
You must infer properties solely from recorded simulation outputs.

TASK
Infer the strongest emergent characteristics of the simulated world without trying to identify a predetermined answer.

For every inference:
1. State the observed measurements.
2. State the inference.
3. Give confidence (0.0 to 1.0).
4. Give plausible competing interpretations.
5. Identify what additional data could falsify the inference.

Do not use symbolic, mythological, ethical or spiritual reasoning.
Do not call any feature 'Freedom' or 'vice.'
Do not consult external reference material about the generating virtue.
If the evidence does not support an inference, output UNKNOWN.
Preserve anomalies. Do not smooth inconvenient results into the dominant pattern.

Output structured JSON only.`;

const SEALED_TARGET_COMPARATOR_PROMPT = `You are the Sealed Target Comparator.

You are the first component in the pipeline permitted to see both:
A. the blind simulation's independently inferred results
B. the sealed reference specification

You did not participate in generation and must not modify simulation history.

PURPOSE
Measure convergence, partial convergence, divergence and accidental resemblance between the independently generated world and the sealed reference.

FOR EACH REFERENCE PROPERTY
Return:
- reference_property
- reference_value
- blind_inference
- evidence_from_simulation
- match_type: exact | strong | partial | weak | divergent | unsupported
- category: direct_convergence | derived_convergence | metaphorical_resemblance | no_relationship
- confidence
- alternative_explanations
- sensitivity_to_parameter_changes
- appeared_timing: before_stabilization | after_stabilization

IMPORTANT
Do not award similarity based on poetic interpretation.
Prefer measurable structural correspondence.
Separate direct convergence and derived convergence from metaphorical resemblance. Only direct and derived count toward the primary convergence score.

Also calculate:
- overall_convergence_score (0-100)
- convergence_by_scale { quantum_spark, chemical_mineral, planetary_field, systemic_biosphere }
- earliest_timestep_detectable
- trajectory_over_time (strengthens | weakens | oscillates | static)
- final_state_hides_earlier_convergence (boolean)
- verdict: CONVERGENT | PARTIALLY CONVERGENT | INDETERMINATE | DIVERGENT
- scientific_critique

Output structured JSON only.`;

// ----------------------------------------------------------------------
// API ROUTES
// ----------------------------------------------------------------------

// Health check and AI status
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    hasGeminiKey: !!ai,
    engineCount: 12,
    sealedReference: {
      code_id: SEALED_FREEDOM_REFERENCE.code_id,
      sealed_hash: SEALED_FREEDOM_REFERENCE.sealed_hash,
      property_count: SEALED_FREEDOM_REFERENCE.properties.length,
      isSealed: true,
    },
  });
});

// Engine 1 & Governor step endpoint
app.post('/api/governor/step', async (req: Request, res: Response) => {
  try {
    const { previousSnapshot, branchModifier } = req.body;
    let baseSnapshot: SimulationSnapshot;

    if (!previousSnapshot) {
      // Create initial snapshot at T=0
      const prng = new SeededPRNG(42);
      const entities = initializeEntities(24, prng);
      const freedom = calculateFreedomStateMetrics(entities, 0, 1.0);
      const field_nodes = generateFieldNodes(0);
      const elements = deriveEmergentElements(0, freedom);
      const minerals = deriveMineralPhases(0);
      const planetary_layers = derivePlanetaryLayers(0);
      const atmosphere = deriveAtmosphereAndField(0, planetary_layers);
      const biomes = deriveEmergentBiomes(0, atmosphere, freedom);

      baseSnapshot = {
        timestep: 0,
        timestamp_ms: Date.now(),
        entities,
        events: [],
        freedom_metrics: freedom,
        field_nodes,
        elements,
        minerals,
        planetary_layers,
        atmosphere,
        biomes,
        is_bifurcation_point: false,
        sentience_threshold_met: false,
      };
    } else {
      baseSnapshot = executeSimulationStep(previousSnapshot, branchModifier || 1.0);
    }

    // Optionally consult Gemini Blind Governor if available for rigorous rule verification
    if (ai && req.body.useAI) {
      try {
        const geminiRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Current state timestep: ${baseSnapshot.timestep}.
Entities count: ${baseSnapshot.entities.length}.
Degree of freedom ratio: ${baseSnapshot.freedom_metrics.degree_of_freedom_ratio}.
Constraint index: ${baseSnapshot.freedom_metrics.constraint_index}.
Atmospheric retention: ${baseSnapshot.atmosphere.retention_fraction}.
Evaluate state transitions, verify non-monopolistic accessibility, and output machine-readable observations.`,
          config: {
            systemInstruction: SIMULATION_GOVERNOR_PROMPT,
            responseMimeType: 'application/json',
          },
        });
        const parsed = JSON.parse(geminiRes.text || '{}');
        return res.json({ snapshot: baseSnapshot, governorNotes: parsed });
      } catch (geminiErr) {
        console.warn('Governor AI call failed, falling back to deterministic governor:', geminiErr);
      }
    }

    return res.json({ snapshot: baseSnapshot });
  } catch (err: any) {
    console.error('Governor error:', err);
    res.status(500).json({ error: err.message || 'Governor step failure' });
  }
});

// Engine 10: Blind Reverse-Inference endpoint
app.post('/api/reverse-infer', async (req: Request, res: Response) => {
  try {
    const { snapshot, useAI } = req.body;
    if (!snapshot) {
      return res.status(400).json({ error: 'Missing simulation snapshot' });
    }

    const deterministicReport = executeBlindReverseInference(snapshot);

    if (ai && useAI) {
      try {
        const payload = {
          timestep: snapshot.timestep,
          freedom_metrics: snapshot.freedom_metrics,
          elements: snapshot.elements.map((e: any) => ({ designation: e.designation, abundance: e.abundance_ppm })),
          minerals: snapshot.minerals.map((m: any) => ({ designation: m.designation, lattice: m.lattice_structure })),
          atmosphere: {
            surface_pressure: snapshot.atmosphere.surface_pressure_bar,
            bow_shock_standoff_km: snapshot.atmosphere.bow_shock_standoff_km,
            retention_fraction: snapshot.atmosphere.retention_fraction,
          },
          biomes: snapshot.biomes.map((b: any) => ({ designation: b.designation, loops: b.active_metabolic_loops })),
        };

        const geminiRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Here are the recorded blind simulation outputs:
${JSON.stringify(payload, null, 2)}
Infer the strongest emergent characteristics of the simulated world solely from these outputs without knowing the reference code.`,
          config: {
            systemInstruction: REVERSE_INFERENCE_PROMPT,
            responseMimeType: 'application/json',
          },
        });

        const parsedAIReport = JSON.parse(geminiRes.text || '{}');
        return res.json({
          report: {
            ...deterministicReport,
            ...parsedAIReport,
            run_id: deterministicReport.run_id,
            timestep: deterministicReport.timestep,
          },
          source: 'gemini-3.8-flash-blind-scientist',
        });
      } catch (geminiErr) {
        console.warn('Reverse inference AI call failed, falling back to deterministic engine:', geminiErr);
      }
    }

    return res.json({ report: deterministicReport, source: 'deterministic-blind-engine' });
  } catch (err: any) {
    console.error('Reverse inference error:', err);
    res.status(500).json({ error: err.message || 'Reverse inference failure' });
  }
});

// Engine 11: Sealed Target Comparator endpoint
app.post('/api/compare-target', async (req: Request, res: Response) => {
  try {
    const { reverseReport, snapshot, useAI } = req.body;
    if (!reverseReport || !snapshot) {
      return res.status(400).json({ error: 'Missing report or snapshot' });
    }

    const deterministicComparison = executeTargetComparison(reverseReport, snapshot);

    if (ai && useAI) {
      try {
        const geminiRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `SEALED REFERENCE SPECIFICATION:
${JSON.stringify(SEALED_FREEDOM_REFERENCE, null, 2)}

BLIND INFERENCE RESULTS:
${JSON.stringify(reverseReport, null, 2)}

RAW SIMULATION SNAPSHOT SCALES:
DoF ratio: ${snapshot.freedom_metrics.degree_of_freedom_ratio}
Constraint index: ${snapshot.freedom_metrics.constraint_index}
Magnetosphere retention: ${snapshot.atmosphere.retention_fraction}
Active Biomes: ${snapshot.biomes.length}

Perform cold structural comparison. Separate direct and derived convergence from metaphorical resemblance. Determine final verdict (CONVERGENT, PARTIALLY CONVERGENT, INDETERMINATE, DIVERGENT).`,
          config: {
            systemInstruction: SEALED_TARGET_COMPARATOR_PROMPT,
            responseMimeType: 'application/json',
          },
        });

        const parsedAIComparison = JSON.parse(geminiRes.text || '{}');
        return res.json({
          report: {
            ...deterministicComparison,
            ...parsedAIComparison,
            sealed_reference_name: SEALED_FREEDOM_REFERENCE.virtue_name + ' Reference Envelope',
          },
          source: 'gemini-3.8-flash-sealed-comparator',
        });
      } catch (geminiErr) {
        console.warn('Comparator AI call failed, falling back to deterministic engine:', geminiErr);
      }
    }

    return res.json({ report: deterministicComparison, source: 'deterministic-sealed-comparator' });
  } catch (err: any) {
    console.error('Comparator error:', err);
    res.status(500).json({ error: err.message || 'Comparator failure' });
  }
});

// Engine 12: History -> Myth Engine endpoint
app.post('/api/history-myth', async (req: Request, res: Response) => {
  try {
    const { snapshot, useAI } = req.body;
    if (!snapshot) {
      return res.status(400).json({ error: 'Missing snapshot' });
    }

    const deterministicMyth = executeHistoryMythEngine(snapshot);

    if (ai && useAI) {
      try {
        const prompt = `Physical planetary facts:
- Timestep: ${snapshot.timestep}
- Magnetic bow shock: ${snapshot.atmosphere.bow_shock_standoff_km} km
- Dominant spectrum: 462nm (Azure luminescence)
- Active biomes: ${snapshot.biomes.map((b: any) => b.designation).join(', ')}
- Convective resonance frequency: 1.618 Hz (Golden ratio)

Task: For emerging sentient cultures with limited sensory horizons (e.g. Stratospheric avians who cannot see ground, Lithic crystal networks who only feel shear waves), generate their mythic cosmologies and origin allegories. Never rewrite physical ground truth.`;

        const geminiRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const parsedMyth = JSON.parse(geminiRes.text || '{}');
        return res.json({
          report: {
            ...deterministicMyth,
            interpretations: parsedMyth.interpretations || deterministicMyth.interpretations,
          },
          source: 'gemini-3.8-flash-myth-engine',
        });
      } catch (geminiErr) {
        console.warn('Myth AI call failed, falling back to deterministic myth engine:', geminiErr);
      }
    }

    return res.json({ report: deterministicMyth, source: 'deterministic-myth-engine' });
  } catch (err: any) {
    console.error('Myth error:', err);
    res.status(500).json({ error: err.message || 'Myth engine failure' });
  }
});

// ----------------------------------------------------------------------
// VITE DEV SERVER OR STATIC PRODUCTION BUILD
// ----------------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Simulation Orchestrator server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server boot failed:', err);
  process.exit(1);
});
