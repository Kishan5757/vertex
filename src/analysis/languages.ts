/**
 * Language detection and color resolution.
 * Provides canonical colors for languages and file extensions.
 */

export interface LangInfo {
  name: string;
  color: string;
}

export const EXT_MAP: Record<string, { name: string; color: string }> = {
  ts: { name: "TypeScript", color: "#3178c6" },
  tsx: { name: "TypeScript React", color: "#3178c6" },
  js: { name: "JavaScript", color: "#f7df1e" },
  jsx: { name: "JavaScript React", color: "#f7df1e" },
  mjs: { name: "JavaScript", color: "#f7df1e" },
  cjs: { name: "JavaScript", color: "#f7df1e" },
  py: { name: "Python", color: "#3572a5" },
  go: { name: "Go", color: "#00add8" },
  rs: { name: "Rust", color: "#dea584" },
  java: { name: "Java", color: "#b07219" },
  rb: { name: "Ruby", color: "#701516" },
  php: { name: "PHP", color: "#4f5d95" },
  c: { name: "C", color: "#555555" },
  cpp: { name: "C++", color: "#f34b7d" },
  h: { name: "C++ Header", color: "#f34b7d" },
  hpp: { name: "C++ Header", color: "#f34b7d" },
  cs: { name: "C#", color: "#178600" },
  swift: { name: "Swift", color: "#f05138" },
  kt: { name: "Kotlin", color: "#a97bff" },
  scala: { name: "Scala", color: "#c22d40" },
  html: { name: "HTML", color: "#e34c26" },
  css: { name: "CSS", color: "#563d7c" },
  scss: { name: "SCSS", color: "#c6538c" },
  less: { name: "Less", color: "#1d365d" },
  vue: { name: "Vue", color: "#41b883" },
  svelte: { name: "Svelte", color: "#ff3e00" },
  astro: { name: "Astro", color: "#ff5a03" },
  md: { name: "Markdown", color: "#083fa1" },
  json: { name: "JSON", color: "#292929" },
  yaml: { name: "YAML", color: "#cb171e" },
  yml: { name: "YAML", color: "#cb171e" },
  toml: { name: "TOML", color: "#9c4221" },
  sh: { name: "Shell", color: "#89e051" },
  bash: { name: "Shell", color: "#89e051" },
  zsh: { name: "Shell", color: "#89e051" },
  dockerfile: { name: "Dockerfile", color: "#384d54" },
  sql: { name: "SQL", color: "#e38c00" },
  dart: { name: "Dart", color: "#00b4ab" },
  ex: { name: "Elixir", color: "#6e4a7e" },
  exs: { name: "Elixir", color: "#6e4a7e" },
  clj: { name: "Clojure", color: "#db5855" },
  hs: { name: "Haskell", color: "#5e5086" },
  lua: { name: "Lua", color: "#000080" },
  zig: { name: "Zig", color: "#ec915c" },
};

/** Canonical language names mapped to linguist colors */
export const LANGUAGE_NAME_COLORS: Record<string, string> = {
  typescript: "#3178c6",
  "typescript react": "#3178c6",
  javascript: "#f7df1e",
  "javascript react": "#f7df1e",
  python: "#3572a5",
  go: "#00add8",
  rust: "#dea584",
  java: "#b07219",
  ruby: "#701516",
  php: "#4f5d95",
  c: "#555555",
  "c++": "#f34b7d",
  cpp: "#f34b7d",
  "c#": "#178600",
  csharp: "#178600",
  swift: "#f05138",
  kotlin: "#a97bff",
  scala: "#c22d40",
  html: "#e34c26",
  css: "#563d7c",
  scss: "#c6538c",
  less: "#1d365d",
  vue: "#41b883",
  svelte: "#ff3e00",
  astro: "#ff5a03",
  markdown: "#083fa1",
  json: "#292929",
  yaml: "#cb171e",
  toml: "#9c4221",
  shell: "#89e051",
  bash: "#89e051",
  zsh: "#89e051",
  dockerfile: "#384d54",
  sql: "#e38c00",
  dart: "#00b4ab",
  elixir: "#6e4a7e",
  clojure: "#db5855",
  haskell: "#5e5086",
  lua: "#000080",
  zig: "#ec915c",
};

/** Distinct vibrant palette so fallbacks are never identical dull gray */
export const DISTINCT_FALLBACK_PALETTE = [
  "#3178c6", // Blue
  "#f7df1e", // Yellow
  "#3572a5", // Medium Blue
  "#00add8", // Cyan
  "#10b981", // Emerald
  "#f43f5e", // Rose
  "#8b5cf6", // Violet
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#6366f1", // Indigo
  "#a855f7", // Purple
  "#e11d48", // Crimson
  "#06b6d4", // Sky
  "#84cc16", // Lime
];

/**
 * Get the color for a language by name or extension with a guaranteed
 * distinct vibrant color.
 */
export function getLanguageColor(nameOrExt?: string | null, fallbackIndex = 0): string {
  if (!nameOrExt) {
    return DISTINCT_FALLBACK_PALETTE[fallbackIndex % DISTINCT_FALLBACK_PALETTE.length];
  }

  const cleaned = nameOrExt.trim().toLowerCase();

  // 1. Exact match on language name
  if (LANGUAGE_NAME_COLORS[cleaned]) {
    return LANGUAGE_NAME_COLORS[cleaned];
  }

  // 2. Extension check
  const ext = cleaned.includes(".") ? cleaned.slice(cleaned.lastIndexOf(".") + 1) : cleaned;
  if (EXT_MAP[ext]) {
    return EXT_MAP[ext].color;
  }

  // 3. Prefix / substring match (e.g. "typescript (react)" -> "typescript")
  for (const [key, color] of Object.entries(LANGUAGE_NAME_COLORS)) {
    if (cleaned.startsWith(key) || key.startsWith(cleaned)) {
      return color;
    }
  }

  // 4. Stable deterministic color from string hash so the same language always gets the same color
  let hash = 0;
  for (let i = 0; i < cleaned.length; i++) {
    hash = (hash << 5) - hash + cleaned.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash + fallbackIndex) % DISTINCT_FALLBACK_PALETTE.length;
  return DISTINCT_FALLBACK_PALETTE[idx];
}

export function detectLanguage(nameOrFilename: string): LangInfo | null {
  if (!nameOrFilename) return null;
  const dotIdx = nameOrFilename.lastIndexOf(".");
  const key = (dotIdx === -1 ? nameOrFilename : nameOrFilename.slice(dotIdx + 1)).toLowerCase();

  if (EXT_MAP[key]) return EXT_MAP[key];
  if (LANGUAGE_NAME_COLORS[key]) {
    return { name: nameOrFilename, color: LANGUAGE_NAME_COLORS[key] };
  }
  return null;
}

export function buildLanguages(
  extLines: Record<string, number>,
): { name: string; percentage: number; color: string }[] {
  const groups = new Map<string, { name: string; color: string; lines: number }>();
  let idx = 0;

  for (const [ext, lines] of Object.entries(extLines)) {
    const info = detectLanguage(ext);
    const key = info?.name ?? ext.toUpperCase();
    const existing = groups.get(key);
    if (existing) {
      existing.lines += lines;
    } else {
      groups.set(key, {
        name: key,
        color: info?.color ?? getLanguageColor(key, idx),
        lines,
      });
      idx++;
    }
  }

  const total = [...groups.values()].reduce((s, g) => s + g.lines, 0);
  if (total === 0) return [];

  return [...groups.entries()]
    .map(([, g], i) => ({
      name: g.name,
      percentage: Math.round((g.lines / total) * 1000) / 10,
      color: g.color || getLanguageColor(g.name, i),
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

/**
 * Resolve language name from file path.
 */
export function resolveLanguageFromPath(path: string): string | null {
  const info = detectLanguage(path);
  return info?.name ?? null;
}
