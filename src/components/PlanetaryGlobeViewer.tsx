import React, { useRef, useEffect } from 'react';
import { SimulationSnapshot } from '../types/simulation.ts';

interface PlanetaryGlobeViewerProps {
  snapshot: SimulationSnapshot;
  onScrubTimestep?: (step: number) => void;
  maxTimestep: number;
  currentTimestep: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const PlanetaryGlobeViewer: React.FC<PlanetaryGlobeViewerProps> = ({
  snapshot,
  onScrubTimestep,
  maxTimestep,
  currentTimestep,
  isPlaying,
  onTogglePlay,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotRef = useRef({ x: 0.3, y: 0.0 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Handle drag rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    rotRef.current.y += dx * 0.008;
    rotRef.current.x = Math.max(-1.4, Math.min(1.4, rotRef.current.x + dy * 0.008));
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Auto rotate slowly if not dragging
      if (!isDraggingRef.current) {
        rotRef.current.y += 0.004;
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const baseRadius = Math.min(w, h) * 0.28;

      // Draw background space stars
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, w, h);

      // Subtle star grid
      ctx.fillStyle = 'rgba(160, 190, 240, 0.25)';
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 97) % w);
        const sy = ((i * 139) % h);
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }

      // Draw Magnetospheric Bow Shock & Open Toroidal Field Lines
      const dynamoOn = snapshot.atmosphere.bow_shock_standoff_km > 5000;
      if (dynamoOn) {
        const bowRadius = baseRadius * 1.55;
        // Toroidal field lines
        ctx.strokeStyle = 'rgba(74, 158, 255, 0.18)';
        ctx.lineWidth = 1.2;

        for (let ring = -2; ring <= 2; ring++) {
          ctx.beginPath();
          ctx.ellipse(cx, cy + ring * 12, bowRadius, baseRadius * 0.85, rotRef.current.x * 0.2, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Bow shock arc
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(100, 210, 255, 0.45)';
        ctx.lineWidth = 2.0;
        ctx.arc(cx - baseRadius * 0.6, cy, bowRadius, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();

        // Magnetic cusp gradient
        const cuspGrad = ctx.createRadialGradient(cx, cy, baseRadius, cx, cy, bowRadius);
        cuspGrad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
        cuspGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = cuspGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, bowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Planetary Sphere Gradient Base
      const planetGrad = ctx.createRadialGradient(
        cx - baseRadius * 0.35,
        cy - baseRadius * 0.35,
        baseRadius * 0.1,
        cx,
        cy,
        baseRadius
      );

      // Color scheme emerges from physical characteristics
      const hasBiomes = snapshot.biomes.length > 0;
      const isAzure = snapshot.timestep > 20;

      if (hasBiomes) {
        planetGrad.addColorStop(0, '#7dd3fc');
        planetGrad.addColorStop(0.4, '#0284c7');
        planetGrad.addColorStop(0.75, '#0f3a60');
        planetGrad.addColorStop(1, '#051329');
      } else if (isAzure) {
        planetGrad.addColorStop(0, '#93c5fd');
        planetGrad.addColorStop(0.45, '#2563eb');
        planetGrad.addColorStop(0.8, '#1e3a8a');
        planetGrad.addColorStop(1, '#0c1738');
      } else {
        // Primordial accretion molten / proto-metallic
        planetGrad.addColorStop(0, '#fdba74');
        planetGrad.addColorStop(0.4, '#ea580c');
        planetGrad.addColorStop(0.8, '#7c2d12');
        planetGrad.addColorStop(1, '#2b1008');
      }

      // Core / Globe body
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = planetGrad;
      ctx.fill();
      ctx.clip(); // Clip surface patterns inside planet

      // Draw surface procedural bands & convection plumes (projected with 3D rotation)
      const ry = rotRef.current.y;
      const rx = rotRef.current.x;

      for (let lat = -5; lat <= 5; lat++) {
        const yNorm = lat / 6;
        const py = cy + yNorm * baseRadius * 0.9 + Math.sin(rx) * 15;
        const bandWidth = Math.sqrt(Math.max(0, baseRadius * baseRadius - (py - cy) ** 2));

        if (bandWidth > 5) {
          ctx.beginPath();
          const wavePhase = ry * 2 + lat * 0.6;
          ctx.fillStyle = lat % 2 === 0
            ? (hasBiomes ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.12)')
            : (hasBiomes ? 'rgba(34, 197, 94, 0.20)' : 'rgba(180, 83, 9, 0.22)');

          ctx.ellipse(
            cx + Math.sin(wavePhase) * 12,
            py,
            bandWidth,
            baseRadius * 0.12 * Math.cos(rx),
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      // Draw active biome colonies / metabolic sites if present
      if (snapshot.biomes.length > 0) {
        snapshot.biomes.forEach((biome, idx) => {
          const bAngle = ry + idx * (Math.PI * 2 / snapshot.biomes.length);
          const bx = cx + Math.cos(bAngle) * (baseRadius * 0.65);
          const by = cy + Math.sin(bAngle) * (baseRadius * 0.35) * Math.cos(rx);

          if (Math.sin(bAngle) > -0.2) { // Front hemisphere
            ctx.beginPath();
            ctx.arc(bx, by, 7 + biome.active_metabolic_loops * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = biome.energy_source === 'photonic_harmonic'
              ? 'rgba(56, 189, 248, 0.85)'
              : biome.energy_source === 'piezoelectric'
              ? 'rgba(192, 132, 252, 0.85)'
              : 'rgba(52, 211, 153, 0.85)';
            ctx.fill();

            // Pulse ring
            ctx.beginPath();
            ctx.arc(bx, by, 12 + Math.sin(Date.now() * 0.005 + idx) * 3, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      }

      // Shadow overlay for 3D planetary lighting
      const shadowGrad = ctx.createRadialGradient(
        cx - baseRadius * 0.35,
        cy - baseRadius * 0.35,
        baseRadius * 0.2,
        cx + baseRadius * 0.5,
        cy + baseRadius * 0.5,
        baseRadius * 1.2
      );
      shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
      shadowGrad.addColorStop(0.7, 'rgba(3, 7, 18, 0.4)');
      shadowGrad.addColorStop(1, 'rgba(3, 7, 18, 0.95)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // Restore clipping

      // Atmosphere outer glow ring (Rayleigh & Cerulean emission)
      const atmoGrad = ctx.createRadialGradient(
        cx,
        cy,
        baseRadius * 0.96,
        cx,
        cy,
        baseRadius * 1.15
      );
      atmoGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      atmoGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.2)');
      atmoGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = atmoGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // Telemetry annotations overlay on canvas
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
      ctx.fillText(`RADIUS: ${snapshot.planetary_layers.crust.radius_km} KM`, 16, 24);
      ctx.fillText(`SURF PRESS: ${snapshot.atmosphere.surface_pressure_bar} BAR`, 16, 40);
      ctx.fillText(`BOW SHOCK: ${snapshot.atmosphere.bow_shock_standoff_km} KM`, 16, 56);
      ctx.fillText(`CONVECTION HARMONIC: 1.618 Hz`, 16, 72);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [snapshot]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 rounded-lg overflow-hidden border border-slate-800/80">
      {/* 3D Canvas Area */}
      <div className="relative flex-1 cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          width={800}
          height={480}
          className="w-full h-full object-contain"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Viewport Badge Info */}
        <div className="absolute top-3 right-3 text-right pointer-events-none text-xs text-slate-400 font-mono">
          <div>TIME-EVOLVING VISUAL TRUTH</div>
          <div className="text-sky-400 font-medium">BLENDER SIMULATION ZONE // ACTIVE</div>
        </div>

        {/* Layer Cross-Section Pill-less indicators */}
        <div className="absolute bottom-16 left-3 text-[11px] font-mono text-slate-400 space-y-1 bg-slate-900/80 p-2.5 rounded border border-slate-800">
          <div className="text-slate-300 font-semibold mb-1">INTERNAL ACCRETION LAYERS</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Core: {snapshot.planetary_layers.core.radius_km} km ({snapshot.planetary_layers.core.dominant_compounds[0]})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 inline-block" />
            <span>Mantle: {snapshot.planetary_layers.mantle.radius_km} km ({snapshot.planetary_layers.mantle.dominant_compounds[0]})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
            <span>Crust: {snapshot.planetary_layers.crust.radius_km} km ({snapshot.planetary_layers.crust.dominant_compounds[0]})</span>
          </div>
        </div>
      </div>

      {/* Blender Simulation Zone: Time Scrubbing & Baking Deck */}
      <div className="border-t border-slate-800 bg-slate-900/90 px-4 py-3 flex items-center gap-4">
        <button
          onClick={onTogglePlay}
          className="px-3 py-1.5 text-xs font-mono font-medium rounded bg-sky-600 hover:bg-sky-500 text-white transition-colors"
        >
          {isPlaying ? 'PAUSE BAKE' : 'RUN SIMULATION'}
        </button>

        <div className="flex-1 flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">FRAME {currentTimestep} / {maxTimestep}</span>
          <input
            type="range"
            min="0"
            max={maxTimestep || 1}
            value={currentTimestep}
            onChange={(e) => onScrubTimestep?.(Number(e.target.value))}
            className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
        </div>

        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
          <span>SIM ZONE: CACHED</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
