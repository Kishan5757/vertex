import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Package,
  FileCode,
  ArrowRight,
  X,
} from "lucide-react";

export interface ExternalDepItem {
  name: string;
  imports: string[];
}

interface ExternalGraphNode extends SimulationNodeDatum {
  id: string;
  name: string;
  fullPath?: string;
  type: "package" | "file";
  count: number;
  radius: number;
  color: string;
}

interface ExternalGraphLink extends SimulationLinkDatum<ExternalGraphNode> {
  id: string;
  source: string | ExternalGraphNode;
  target: string | ExternalGraphNode;
}

interface ExternalDependencyGraphProps {
  dependencies: ExternalDepItem[];
  searchQuery?: string;
  height?: number;
  className?: string;
}

function getBasename(path: string): string {
  const lastSlash = path.lastIndexOf("/");
  return lastSlash === -1 ? path : path.slice(lastSlash + 1);
}

export function ExternalDependencyGraph({
  dependencies,
  searchQuery = "",
  height = 540,
  className = "",
}: ExternalDependencyGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height });
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const draggingNodeRef = useRef<ExternalGraphNode | null>(null);

  // Active hover and selection
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);

  // Tooltip
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: React.ReactNode;
  } | null>(null);

  const [, setTick] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      setDimensions({
        width: Math.max(300, el.clientWidth || 800),
        height: Math.max(300, height),
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  const { initialNodes, initialLinks } = useMemo(() => {
    const nodes: ExternalGraphNode[] = [];
    const links: ExternalGraphLink[] = [];
    const fileSet = new Set<string>();

    dependencies.forEach((pkg, i) => {
      const angle = (i / Math.max(1, dependencies.length)) * Math.PI * 2;
      const dist = Math.min(220, 70 + dependencies.length * 8);
      const cx = dimensions.width / 2 + Math.cos(angle) * dist;
      const cy = dimensions.height / 2 + Math.sin(angle) * dist;

      nodes.push({
        id: `pkg:${pkg.name}`,
        name: pkg.name,
        type: "package",
        count: pkg.imports.length,
        radius: Math.min(26, Math.max(16, 14 + Math.sqrt(pkg.imports.length) * 3)),
        color: "#06b6d4", // Cyan
        x: cx,
        y: cy,
      });

      // File nodes
      pkg.imports.forEach((f) => {
        const fileId = `file:${f}`;
        if (!fileSet.has(fileId)) {
          fileSet.add(fileId);
          nodes.push({
            id: fileId,
            name: getBasename(f),
            fullPath: f,
            type: "file",
            count: 1,
            radius: 12,
            color: "#94a3b8", // Slate
            x: cx + (Math.random() - 0.5) * 100,
            y: cy + (Math.random() - 0.5) * 100,
          });
        }

        // Link from importing file -> external package
        links.push({
          id: `${fileId}->pkg:${pkg.name}`,
          source: fileId,
          target: `pkg:${pkg.name}`,
        });
      });
    });

    return { initialNodes: nodes, initialLinks: links };
  }, [dependencies, dimensions.width, dimensions.height]);

  const nodesRef = useRef<ExternalGraphNode[]>([]);
  const linksRef = useRef<ExternalGraphLink[]>([]);
  const simRef = useRef<Simulation<ExternalGraphNode, ExternalGraphLink> | null>(null);

  useEffect(() => {
    if (initialNodes.length === 0) return;
    const nodes = initialNodes.map((n) => ({ ...n }));
    const links = initialLinks.map((l) => ({ ...l }));
    nodesRef.current = nodes;
    linksRef.current = links;

    const sim = forceSimulation<ExternalGraphNode, ExternalGraphLink>(nodes)
      .force(
        "link",
        forceLink<ExternalGraphNode, ExternalGraphLink>(links)
          .id((d) => d.id)
          .distance(85)
          .strength(0.55),
      )
      .force("charge", forceManyBody().strength(-200))
      .force(
        "collide",
        forceCollide<ExternalGraphNode>((d) => d.radius + 15),
      )
      .force("center", forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.08))
      .force("x", forceX(dimensions.width / 2).strength(0.03))
      .force("y", forceY(dimensions.height / 2).strength(0.03))
      .velocityDecay(0.65)
      .alphaDecay(0.024);

    sim.on("tick", () => setTick((t) => t + 1));
    simRef.current = sim;

    return () => {
      sim.stop();
    };
  }, [initialNodes, initialLinks, dimensions.width, dimensions.height]);

  const fitView = useCallback(() => {
    const nodes = nodesRef.current;
    if (nodes.length === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const n of nodes) {
      if (n.x == null || n.y == null) continue;
      minX = Math.min(minX, n.x - n.radius - 20);
      maxX = Math.max(maxX, n.x + n.radius + 20);
      minY = Math.min(minY, n.y - n.radius - 20);
      maxY = Math.max(maxY, n.y + n.radius + 20);
    }

    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    const k = Math.min(1.8, Math.max(0.3, Math.min((dimensions.width - 60) / w, (dimensions.height - 60) / h)));
    const x = dimensions.width / 2 - ((minX + maxX) / 2) * k;
    const y = dimensions.height / 2 - ((minY + maxY) / 2) * k;
    setTransform({ x, y, k });
  }, [dimensions.width, dimensions.height]);

  useEffect(() => {
    const t = setTimeout(fitView, 260);
    return () => clearTimeout(t);
  }, [fitView]);

  // Calibrated smooth zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomIntensity = 0.0012;
    const factor = Math.exp(-e.deltaY * zoomIntensity);
    const clampedFactor = Math.min(1.06, Math.max(0.94, factor));

    setTransform((prev) => {
      const newK = Math.min(3.5, Math.max(0.2, prev.k * clampedFactor));
      const newX = mouseX - (mouseX - prev.x) * (newK / prev.k);
      const newY = mouseY - (mouseY - prev.y) * (newK / prev.k);
      return { x: newX, y: newY, k: newK };
    });
  };

  const handleZoom = (dir: "in" | "out") => {
    setTransform((prev) => {
      const factor = dir === "in" ? 1.25 : 0.8;
      const newK = Math.min(3.5, Math.max(0.2, prev.k * factor));
      const cx = dimensions.width / 2;
      const cy = dimensions.height / 2;
      return {
        x: cx - (cx - prev.x) * (newK / prev.k),
        y: cy - (cy - prev.y) * (newK / prev.k),
        k: newK,
      };
    });
  };

  const handleReset = () => {
    fitView();
    if (simRef.current) {
      simRef.current.alpha(0.3).restart();
    }
  };

  // Connected nodes & edges calculation for active hover or selected package
  const activeFocusId = selectedPkg ? `pkg:${selectedPkg}` : hoveredNodeId;

  const { connectedNodeIds, connectedEdgeIds } = useMemo(() => {
    if (!activeFocusId) {
      return {
        connectedNodeIds: new Set<string>(),
        connectedEdgeIds: new Set<string>(),
      };
    }

    const connected = new Set<string>([activeFocusId]);
    const edges = new Set<string>();

    for (const link of linksRef.current) {
      const srcId = typeof link.source === "object" ? link.source.id : link.source;
      const tgtId = typeof link.target === "object" ? link.target.id : link.target;

      if (srcId === activeFocusId) {
        connected.add(tgtId);
        edges.add(link.id);
      }
      if (tgtId === activeFocusId) {
        connected.add(srcId);
        edges.add(link.id);
      }
    }

    return { connectedNodeIds: connected, connectedEdgeIds: edges };
  }, [activeFocusId]);

  const selectedPkgData = useMemo(() => {
    if (!selectedPkg) return null;
    return dependencies.find((d) => d.name === selectedPkg) ?? null;
  }, [selectedPkg, dependencies]);

  // Search filter
  const matchingNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const set = new Set<string>();
    for (const n of nodesRef.current) {
      if (n.name.toLowerCase().includes(q) || (n.fullPath && n.fullPath.toLowerCase().includes(q))) {
        set.add(n.id);
      }
    }
    return set;
  }, [searchQuery]);

  const nodes = nodesRef.current;
  const links = linksRef.current;

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col rounded-sm border border-border bg-surface select-none overflow-hidden ${className}`}
      style={{ height }}
      onWheel={handleWheel}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === "svg") {
          setIsPanning(true);
          panStartRef.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
        }
      }}
      onMouseMove={(e) => {
        if (isPanning) {
          setTransform((prev) => ({
            ...prev,
            x: panStartRef.current.tx + (e.clientX - panStartRef.current.x),
            y: panStartRef.current.ty + (e.clientY - panStartRef.current.y),
          }));
        } else if (draggingNodeRef.current && simRef.current) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;
          draggingNodeRef.current.fx = (e.clientX - rect.left - transform.x) / transform.k;
          draggingNodeRef.current.fy = (e.clientY - rect.top - transform.y) / transform.k;
          simRef.current.alpha(0.2).restart();
        }
      }}
      onMouseUp={() => {
        setIsPanning(false);
        if (draggingNodeRef.current) {
          draggingNodeRef.current.fx = null;
          draggingNodeRef.current.fy = null;
          draggingNodeRef.current = null;
        }
      }}
      onMouseLeave={() => {
        setIsPanning(false);
        setHoveredNodeId(null);
        setHoveredEdgeId(null);
        setTooltip(null);
      }}
    >
      {/* Legend Header */}
      <div className="z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 py-2.5 text-xs text-muted backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <Package className="h-3.5 w-3.5 text-cyan-400" />
            External Packages ({dependencies.length})
          </span>
          <span className="text-muted">·</span>
          <span>Hover or touch any module to reveal directional import arrows</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span>Library Package</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            <span>Project Source File</span>
          </span>
          <span className="flex items-center gap-1.5">
            <ArrowRight className="h-3 w-3 text-cyan-400" />
            <span>Imports</span>
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        className={`w-full flex-1 block ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        <defs>
          {/* Default Edge Arrow Marker */}
          <marker
            id="ext-arrow-default"
            viewBox="0 -5 10 10"
            refX="8"
            refY="0"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0,-4L8,0L0,4" fill="var(--color-border)" />
          </marker>

          {/* Highlighted Arrow Marker (Cyan) */}
          <marker
            id="ext-arrow-highlight"
            viewBox="0 -5 10 10"
            refX="8"
            refY="0"
            markerWidth="5.5"
            markerHeight="5.5"
            orient="auto"
          >
            <path d="M0,-4L8,0L0,4" fill="#06b6d4" />
          </marker>

          {/* Amber Marker for File -> Pkg */}
          <marker
            id="ext-arrow-amber"
            viewBox="0 -5 10 10"
            refX="8"
            refY="0"
            markerWidth="5.5"
            markerHeight="5.5"
            orient="auto"
          >
            <path d="M0,-4L8,0L0,4" fill="#f59e0b" />
          </marker>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {/* Directed Links */}
          {links.map((link) => {
            const src = typeof link.source === "object" ? link.source : null;
            const tgt = typeof link.target === "object" ? link.target : null;
            if (!src || !tgt || src.x == null || src.y == null || tgt.x == null || tgt.y == null) {
              return null;
            }

            const isHighlighted = connectedEdgeIds.has(link.id);
            const isHoveredEdge = hoveredEdgeId === link.id;

            let isDimmed = false;
            if (activeFocusId) {
              isDimmed = !isHighlighted;
            } else if (matchingNodeIds) {
              isDimmed = !matchingNodeIds.has(src.id) && !matchingNodeIds.has(tgt.id);
            }

            // Calculate precise start and end coordinates at node boundaries for clean arrowheads
            const dx = tgt.x - src.x;
            const dy = tgt.y - src.y;
            const dist = Math.hypot(dx, dy) || 1;

            const startX = src.x + (dx / dist) * (src.radius + 2);
            const startY = src.y + (dy / dist) * (src.radius + 2);
            const endX = tgt.x - (dx / dist) * (tgt.radius + 5);
            const endY = tgt.y - (dy / dist) * (tgt.radius + 5);

            const strokeColor = isHighlighted || isHoveredEdge ? "#06b6d4" : "var(--color-border)";
            const strokeWidth = isHighlighted || isHoveredEdge ? 2.2 : 1.15;
            const markerId = isHighlighted || isHoveredEdge ? "url(#ext-arrow-highlight)" : "url(#ext-arrow-default)";

            return (
              <g key={link.id}>
                {/* Thick hover target */}
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="transparent"
                  strokeWidth={14}
                  className="cursor-pointer"
                  onMouseEnter={(e) => {
                    setHoveredEdgeId(link.id);
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    setTooltip({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top - 12,
                      content: (
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-mono">
                          <span className="truncate max-w-[140px]">{src.name}</span>
                          <ArrowRight className="h-3 w-3 shrink-0 text-cyan-400" />
                          <span className="truncate max-w-[140px] font-bold text-cyan-400">{tgt.name}</span>
                        </div>
                      ),
                    });
                  }}
                  onMouseLeave={() => {
                    setHoveredEdgeId(null);
                    setTooltip(null);
                  }}
                />
                {/* Visible line with arrowhead */}
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeOpacity={isDimmed ? 0.08 : isHighlighted ? 0.95 : 0.65}
                  markerEnd={isDimmed ? undefined : markerId}
                  className="transition-[stroke-opacity,stroke-width] duration-150 pointer-events-none"
                />
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            if (node.x == null || node.y == null) return null;
            const isPkg = node.type === "package";
            const isSelected = selectedPkg === node.name;
            const isHovered = hoveredNodeId === node.id;
            const isConnected = connectedNodeIds.has(node.id);

            let isDimmed = false;
            if (activeFocusId) {
              isDimmed = node.id !== activeFocusId && !isConnected;
            } else if (matchingNodeIds) {
              isDimmed = !matchingNodeIds.has(node.id);
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x.toFixed(1)}, ${node.y.toFixed(1)})`}
                className="cursor-pointer"
                opacity={isDimmed ? 0.15 : 1}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  draggingNodeRef.current = node;
                  node.fx = node.x;
                  node.fy = node.y;
                  simRef.current?.alphaTarget(0.2).restart();
                }}
                onClick={() => {
                  if (isPkg) {
                    setSelectedPkg((prev) => (prev === node.name ? null : node.name));
                  }
                }}
                onMouseEnter={(e) => {
                  setHoveredNodeId(node.id);
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setTooltip({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top - 12,
                    content: (
                      <div className="flex flex-col gap-0.5 min-w-[140px]">
                        <div className="flex items-center gap-1.5">
                          {isPkg ? (
                            <Package className="h-3.5 w-3.5 text-cyan-400" />
                          ) : (
                            <FileCode className="h-3.5 w-3.5 text-muted" />
                          )}
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {node.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted">
                          {isPkg ? `Imported by ${node.count} file(s)` : node.fullPath}
                        </span>
                      </div>
                    ),
                  });
                }}
                onMouseLeave={() => {
                  setHoveredNodeId(null);
                  setTooltip(null);
                }}
              >
                {/* Glowing ring when hovered or selected */}
                {(isSelected || isHovered) && (
                  <circle
                    r={node.radius + 6}
                    fill="none"
                    stroke={isPkg ? "#06b6d4" : "#94a3b8"}
                    strokeWidth={isSelected ? 2.5 : 2}
                    className="animate-pulse"
                  />
                )}

                {/* Outer halo */}
                <circle
                  r={node.radius}
                  fill={isPkg ? "rgba(6, 182, 212, 0.16)" : "rgba(148, 163, 184, 0.16)"}
                  stroke={isPkg ? "#06b6d4" : "#64748b"}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.25}
                />

                {/* Inner center dot */}
                <circle
                  r={Math.max(2.5, node.radius * 0.28)}
                  fill={isPkg ? "#06b6d4" : "#94a3b8"}
                />

                {/* Badge for package import count */}
                {isPkg && node.count > 1 && (
                  <g transform={`translate(${node.radius - 2}, ${-node.radius + 2})`}>
                    <circle r={7} fill="var(--color-surface)" stroke="#06b6d4" strokeWidth={1} />
                    <text
                      y={3}
                      textAnchor="middle"
                      className="font-mono font-bold"
                      style={{ fontSize: 8, fill: "#06b6d4" }}
                    >
                      {node.count}
                    </text>
                  </g>
                )}

                {/* Text Label */}
                <text
                  y={node.radius + 12}
                  textAnchor="middle"
                  className="font-mono pointer-events-none transition-all"
                  style={{
                    fontSize: isPkg ? 11 : 9.5,
                    fontWeight: isPkg ? 600 : isHovered ? 500 : 400,
                    fill: isPkg
                      ? isSelected || isHovered
                        ? "var(--color-foreground)"
                        : "#06b6d4"
                      : isHovered
                        ? "var(--color-foreground)"
                        : "var(--color-secondary)",
                  }}
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Controls */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 rounded-sm border border-border bg-surface/90 p-1 backdrop-blur-sm shadow-sm">
        <button
          type="button"
          onClick={() => handleZoom("in")}
          className="cursor-pointer rounded-sm p-1.5 text-secondary hover:bg-raised hover:text-foreground active:scale-95 transition-colors"
          aria-label="Zoom in"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom("out")}
          className="cursor-pointer rounded-sm p-1.5 text-secondary hover:bg-raised hover:text-foreground active:scale-95 transition-colors"
          aria-label="Zoom out"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={fitView}
          className="cursor-pointer rounded-sm p-1.5 text-secondary hover:bg-raised hover:text-foreground active:scale-95 transition-colors"
          aria-label="Fit view"
          title="Fit view"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="cursor-pointer rounded-sm p-1.5 text-secondary hover:bg-raised hover:text-foreground active:scale-95 transition-colors"
          aria-label="Reset layout"
          title="Reset layout"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-sm border border-border bg-raised px-3 py-2 shadow-md backdrop-blur-sm"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.content}
        </div>
      )}

      {/* Selected Package Details Drawer */}
      {selectedPkgData && (
        <div className="animate-fade-in absolute top-10 right-0 bottom-0 z-20 w-80 max-w-full border-l border-border bg-surface/95 p-4 backdrop-blur-md overflow-y-auto shadow-lg flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="flex items-center gap-1.5 font-mono text-sm font-bold text-foreground">
              <Package className="h-4 w-4 text-cyan-400" />
              {selectedPkgData.name}
            </span>
            <button
              type="button"
              onClick={() => setSelectedPkg(null)}
              className="cursor-pointer text-muted hover:text-foreground p-1 rounded-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-secondary">
            Imported by {selectedPkgData.imports.length} file(s) across the project:
          </p>
          <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
            {selectedPkgData.imports.map((file) => (
              <div
                key={file}
                className="flex items-center gap-2 rounded-sm border border-border bg-raised/50 p-2 text-xs font-mono"
              >
                <FileCode className="h-3.5 w-3.5 text-muted shrink-0" />
                <span className="text-foreground truncate">{file}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
