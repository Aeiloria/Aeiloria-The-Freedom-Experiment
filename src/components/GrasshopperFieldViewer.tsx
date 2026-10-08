import React, { useRef, useEffect } from 'react';
import { SimulationSnapshot } from '../types/simulation.ts';

interface GrasshopperFieldViewerProps {
  snapshot: SimulationSnapshot;
}

export const GrasshopperFieldViewer: React.FC<GrasshopperFieldViewerProps> = ({ snapshot }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let timeOffset = 0;

    const render = () => {
      timeOffset += 0.02;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      // Dark technical grid
      ctx.fillStyle = '#070d18';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(30, 58, 138, 0.25)';
      ctx.lineWidth = 1;
      const gridStep = 32;
      for (let x = 0; x < w; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw Vector Field Nodes from Grasshopper Field Engine
      const scale = 22;
      snapshot.field_nodes.forEach((node) => {
        const nx = cx + node.position.x * scale;
        const ny = cy + node.position.y * scale;

        if (nx > 0 && nx < w && ny > 0 && ny < h) {
          const vx = node.vector.x * 12;
          const vy = node.vector.y * 12;

          ctx.beginPath();
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 + node.attractor_affinity * 0.4})`;
          ctx.lineWidth = 1.0;
          ctx.moveTo(nx, ny);
          ctx.lineTo(nx + vx, ny + vy);
          ctx.stroke();

          // Vector arrowhead
          ctx.beginPath();
          ctx.arc(nx + vx, ny + vy, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(125, 211, 252, 0.6)';
          ctx.fill();
        }
      });

      // Draw Spark Entities Trajectories and Interaction Lines
      const entities = snapshot.entities;

      // Interaction lines between proximate entities
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.18)';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const e1 = entities[i];
          const e2 = entities[j];
          const dx = (e1.current_position.x - e2.current_position.x) * scale;
          const dy = (e1.current_position.y - e2.current_position.y) * scale;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 75) {
            ctx.beginPath();
            ctx.moveTo(cx + e1.current_position.x * scale, cy + e1.current_position.y * scale);
            ctx.lineTo(cx + e2.current_position.x * scale, cy + e2.current_position.y * scale);
            ctx.stroke();
          }
        }
      }

      // Draw Spark Entities
      entities.forEach((e) => {
        const ex = cx + e.current_position.x * scale;
        const ey = cy + e.current_position.y * scale;

        // Velocity vector trail
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - e.velocity.x * scale * 4, ey - e.velocity.y * scale * 4);
        ctx.stroke();

        // Entity point
        ctx.beginPath();
        const color = e.lifecycle === 'spark'
          ? '#38bdf8'
          : e.lifecycle === 'persist'
          ? '#4ade80'
          : e.lifecycle === 're_spark'
          ? '#f43f5e'
          : '#94a3b8';

        ctx.arc(ex, ey, 2.5 + (e.energy / 50), 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Entity ID label (small monospace)
        ctx.font = '8px monospace';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.fillText(e.entity_id, ex + 6, ey + 3);
      });

      // Attractor Core Central Rings
      ctx.beginPath();
      ctx.arc(cx, cy, 18 + Math.sin(timeOffset) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [snapshot]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 rounded-lg overflow-hidden border border-slate-800/80">
      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          width={800}
          height={480}
          className="w-full h-full object-contain"
        />

        {/* Viewport Header */}
        <div className="absolute top-3 right-3 text-right text-xs text-slate-400 font-mono pointer-events-none">
          <div>GRASSHOPPER FIELD ENGINE</div>
          <div className="text-emerald-400 font-medium">SPATIAL TRUTH // NODES & VECTORS</div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-slate-900/85 p-2 rounded border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
          <div className="text-slate-200 font-semibold mb-1">FIELD METRICS</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
            <span>Active Spark ({snapshot.entities.filter(e => e.lifecycle === 'spark').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>Persisting ({snapshot.entities.filter(e => e.lifecycle === 'persist').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span>Re-Spark Fluctuation ({snapshot.entities.filter(e => e.lifecycle === 're_spark').length})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
