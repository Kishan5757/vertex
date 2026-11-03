import { useState, useMemo } from "react";
import {
  Search,
  ArrowLeftRight,
  ExternalLink,
  FileCode,
  Network,
  List,
} from "lucide-react";
import { useAnalysis } from "../../analysis/AnalysisContext";
import { EmptyState } from "../EmptyState";
import { FileDependencyGraph } from "../../components/FileDependencyGraph";
import { ExternalDependencyGraph } from "../../components/ExternalDependencyGraph";
import { CircularDependencyGraph } from "../../components/CircularDependencyGraph";

type Tab = "internal" | "external" | "circular";
type ViewMode = "graph" | "list";

export function DependenciesScreen() {
  const analysis = useAnalysis();
  const {
    internalDependencies,
    externalDependencies,
    circularDependencies,
  } = analysis;
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("internal");
  const [viewMode, setViewMode] = useState<ViewMode>("graph");

  const filteredInternal = useMemo(() => {
    if (!query.trim()) return internalDependencies;
    const q = query.toLowerCase();
    return internalDependencies.filter(
      (d) => d.from.toLowerCase().includes(q) || d.to.toLowerCase().includes(q),
    );
  }, [query, internalDependencies]);

  const filteredExternal = useMemo(() => {
    if (!query.trim()) return externalDependencies;
    const q = query.toLowerCase();
    return externalDependencies.filter((d) => d.name.toLowerCase().includes(q));
  }, [query, externalDependencies]);

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs + View Mode Toggle + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex gap-1 rounded-sm border border-border bg-surface p-0.5">
          {(["internal", "external", "circular"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`cursor-pointer rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t
                  ? "bg-raised text-foreground font-semibold shadow-xs"
                  : "text-muted hover:text-secondary"
              }`}
            >
              {t === "internal"
                ? `Internal (${internalDependencies.length})`
                : t === "external"
                  ? `External (${externalDependencies.length})`
                  : `Circular (${circularDependencies.length})`}
            </button>
          ))}
        </div>

        {/* View Switcher & Search Bar */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Graph vs List View Toggle */}
          <div className="flex items-center gap-1 rounded-sm border border-border bg-surface p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("graph")}
              title="Interactive Visual Graph View"
              className={`flex cursor-pointer items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "graph"
                  ? "bg-raised text-foreground font-semibold shadow-xs"
                  : "text-muted hover:text-secondary"
              }`}
            >
              <Network className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Graph</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="Detailed List View"
              className={`flex cursor-pointer items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-raised text-foreground font-semibold shadow-xs"
                  : "text-muted hover:text-secondary"
              }`}
            >
              <List className="h-3.5 w-3.5" aria-hidden="true" />
              <span>List</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-56 sm:w-64">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Search dependencies…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-sm border border-border bg-surface py-1.5 pl-8 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-secondary focus-visible:outline-offset-0 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Tab content */}
      {tab === "internal" && (
        <InternalTab
          deps={filteredInternal}
          allDeps={internalDependencies}
          total={internalDependencies.length}
          query={query}
          viewMode={viewMode}
          onSwitchView={setViewMode}
        />
      )}
      {tab === "external" && (
        <ExternalTab
          deps={filteredExternal}
          total={externalDependencies.length}
          query={query}
          viewMode={viewMode}
        />
      )}
      {tab === "circular" && (
        <CircularTab
          deps={circularDependencies}
          viewMode={viewMode}
        />
      )}
    </div>
  );
}

function InternalTab({
  deps,
  allDeps,
  total,
  query,
  viewMode,
  onSwitchView,
}: {
  deps: { from: string; to: string; evidence: string }[];
  allDeps: { from: string; to: string; evidence: string }[];
  total: number;
  query: string;
  viewMode: ViewMode;
  onSwitchView: (v: ViewMode) => void;
}) {
  if (total === 0) {
    return (
      <EmptyState
        title="No internal dependencies detected"
        body="Internal dependencies are derived from actual import/include statements in source files. Repositories without supported source languages may show no results."
      />
    );
  }

  const filtered = deps;

  if (filtered.length === 0) {
    return (
      <EmptyState
        title="No matching dependencies"
        body={`No dependencies match "${query}". Try a different file or component name.`}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Subheader info */}
      <div className="flex items-center justify-between text-xs text-muted">
        <p>
          Showing {filtered.length} of {total} internal dependency relationships
          {query && <span className="text-secondary ml-1">matching &quot;{query}&quot;</span>}
        </p>
        <span className="hidden sm:inline-block">
          {viewMode === "graph"
            ? "Drag nodes to rearrange · Hover edges for import evidence · Click node to inspect"
            : "Switch to Graph view for interactive node-link visualization"}
        </span>
      </div>

      {/* Visual Graphical Mode */}
      {viewMode === "graph" ? (
        <FileDependencyGraph
          dependencies={filtered}
          searchQuery={query}
          height={600}
        />
      ) : (
        /* Detailed List Mode */
        <div className="flex flex-col gap-1.5">
          {filtered.slice(0, 100).map((dep, i) => (
            <div
              key={`int-${i}`}
              className="group flex items-start gap-3 rounded-sm border border-border bg-surface px-3 py-2.5 text-sm transition-colors hover:border-foreground/20 hover:bg-raised/40"
            >
              <FileCode className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted group-hover:text-foreground transition-colors" aria-hidden="true" />
              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-medium text-foreground truncate max-w-full">
                    {dep.from}
                  </span>
                  <ArrowLeftRight className="h-3 w-3 text-muted shrink-0" aria-hidden="true" />
                  <span className="font-mono text-xs font-medium text-secondary truncate max-w-full">
                    {dep.to}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-muted/80 break-all bg-raised/40 px-1.5 py-0.5 rounded-sm mt-0.5">
                  Evidence: {dep.evidence}
                </span>
              </div>
            </div>
          ))}
          {filtered.length > 100 && (
            <p className="text-xs text-muted text-center py-2">
              Showing 100 of {filtered.length} results.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ExternalTab({
  deps,
  total,
  query,
  viewMode,
}: {
  deps: { name: string; imports: string[] }[];
  total: number;
  query: string;
  viewMode: ViewMode;
}) {
  if (total === 0) {
    return (
      <EmptyState
        title="No external dependencies detected"
        body="External dependencies are derived from import/include statements that reference libraries rather than internal files."
      />
    );
  }

  if (deps.length === 0) {
    return (
      <EmptyState
        title="No matching dependencies"
        body={`No external libraries match "${query}".`}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">
        {total} external libraries detected across the project
      </p>

      {viewMode === "graph" ? (
        <ExternalDependencyGraph
          dependencies={deps}
          searchQuery={query}
          height={580}
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          {deps.map((dep) => (
            <div
              key={dep.name}
              className="flex items-start gap-3 rounded-sm border border-border bg-surface px-3 py-2.5 text-sm"
            >
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="font-mono text-xs font-medium text-foreground">{dep.name}</span>
                <span className="text-xs text-secondary">
                  Imported by {dep.imports.length} file(s)
                </span>
                {dep.imports.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dep.imports.slice(0, 10).map((f) => (
                      <span
                        key={f}
                        className="rounded-sm bg-raised px-1.5 py-0.5 font-mono text-[10px] text-muted"
                      >
                        {f.split("/").pop()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CircularTab({
  deps,
  viewMode,
}: {
  deps: { cycle: string[] }[];
  viewMode: ViewMode;
}) {
  if (deps.length === 0) {
    return (
      <EmptyState
        title="No circular dependencies detected"
        body="Circular dependencies occur when file A imports B and B imports A (directly or transitively). No cycles were found in the analyzed files."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {viewMode === "graph" ? (
        <CircularDependencyGraph cycles={deps} />
      ) : (
        /* Cycle Cards List */
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted">
            {deps.length} circular dependenc{deps.length === 1 ? "y" : "ies"} detected
          </p>
          {deps.map((dep, i) => (
            <div
              key={i}
              className="rounded-sm border border-border bg-surface px-3 py-2.5 text-sm"
            >
              <span className="text-xs font-medium text-rust">Cycle {i + 1}</span>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-foreground">
                {dep.cycle.map((node, ni) => (
                  <span key={ni} className="flex items-center gap-1">
                    {ni > 0 && <ArrowLeftRight className="h-3 w-3 text-rust/60" aria-hidden="true" />}
                    <span className="font-mono">{node.split("/").pop()}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
