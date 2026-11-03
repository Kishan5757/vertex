import { useState } from "react";
import { ArrowRight, AlertTriangle, RefreshCw } from "lucide-react";

export interface CircularDepItem {
  cycle: string[];
}

interface CircularDependencyGraphProps {
  cycles: CircularDepItem[];
  className?: string;
}

function getBasename(path: string): string {
  const lastSlash = path.lastIndexOf("/");
  return lastSlash === -1 ? path : path.slice(lastSlash + 1);
}

export function CircularDependencyGraph({
  cycles,
  className = "",
}: CircularDependencyGraphProps) {
  const [activeCycleIdx, setActiveCycleIdx] = useState(0);

  if (cycles.length === 0) return null;

  const activeCycle = cycles[activeCycleIdx] || cycles[0];
  const nodes = activeCycle.cycle;
  const count = nodes.length;

  // Geometry for circular layout
  const size = 360;
  const center = size / 2;
  const radius = Math.min(130, Math.max(70, count * 28));

  // Compute node coordinates along circle
  const nodeCoords = nodes.map((file, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return {
      file,
      name: getBasename(file),
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    };
  });

  return (
    <div className={`flex flex-col gap-4 rounded-sm border border-border bg-surface p-4 ${className}`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rust" aria-hidden="true" />
          <span className="text-xs font-medium text-foreground">
            {cycles.length} Circular Dependenc{cycles.length === 1 ? "y" : "ies"} Detected
          </span>
        </div>

        {/* Cycle selector buttons if multiple */}
        {cycles.length > 1 && (
          <div className="flex items-center gap-1">
            {cycles.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveCycleIdx(i)}
                className={`cursor-pointer rounded-sm px-2 py-0.5 text-xs font-mono transition-colors ${
                  activeCycleIdx === i
                    ? "bg-rust/20 text-rust font-bold border border-rust/40"
                    : "text-muted hover:bg-raised hover:text-foreground"
                }`}
              >
                Cycle {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Graphical Ring Diagram */}
      <div className="flex flex-col items-center justify-center p-2">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full max-w-[360px] h-auto overflow-visible select-none"
        >
          <defs>
            <marker
              id="cycle-arrow"
              viewBox="0 -5 10 10"
              refX="8"
              refY="0"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0,-4L8,0L0,4" fill="#f87171" />
            </marker>
          </defs>

          {/* Central Loop Glow Indicator */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(244, 63, 94, 0.08)"
            strokeWidth={18}
          />

          {/* Directed Links between sequential nodes in cycle */}
          {nodeCoords.map((cur, i) => {
            const next = nodeCoords[(i + 1) % count];
            const dx = next.x - cur.x;
            const dy = next.y - cur.y;
            const dist = Math.hypot(dx, dy) || 1;

            const startX = cur.x + (dx / dist) * 16;
            const startY = cur.y + (dy / dist) * 16;
            const endX = next.x - (dx / dist) * 20;
            const endY = next.y - (dy / dist) * 20;

            // Slight curve for circular flow
            const midX = (cur.x + next.x) / 2 + (cur.y - next.y) * 0.12;
            const midY = (cur.y + next.y) / 2 + (next.x - cur.x) * 0.12;

            return (
              <path
                key={i}
                d={`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`}
                fill="none"
                stroke="#f87171"
                strokeWidth={2}
                markerEnd="url(#cycle-arrow)"
                strokeDasharray="4 3"
                className="animate-pulse"
              />
            );
          })}

          {/* Nodes */}
          {nodeCoords.map((node, i) => (
            <g key={i} transform={`translate(${node.x}, ${node.y})`}>
              <circle
                r={16}
                fill="var(--color-surface)"
                stroke="#f87171"
                strokeWidth={2}
              />
              <circle r={4} fill="#f87171" />
              <text
                y={28}
                textAnchor="middle"
                className="font-mono text-[11px] font-semibold"
                fill="var(--color-foreground)"
              >
                {node.name}
              </text>
            </g>
          ))}
        </svg>

        {/* Cycle Step by Step Chain */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
          {nodes.map((file, i) => (
            <span key={i} className="flex items-center gap-1.5 font-mono text-foreground">
              <span className="rounded-sm bg-rust/10 border border-rust/30 px-2 py-1 text-rust font-medium">
                {getBasename(file)}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-rust/70" />
            </span>
          ))}
          <span className="rounded-sm bg-rust/10 border border-rust/30 px-2 py-1 text-rust font-medium font-mono">
            {getBasename(nodes[0])}
          </span>
        </div>
      </div>
    </div>
  );
}

