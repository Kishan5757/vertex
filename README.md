# Vertex — Codebase Intelligence Platform

> **"See your system as it really is."**  
> Vertex maps software architecture, dependency graphs, technical debt, and git evolution from **real evidence** — never placeholders or fabricated relationships.

---

## Table of Contents
- [1. Executive Summary](#1-executive-summary)
- [2. Core Philosophy](#2-core-philosophy)
- [3. Application Architecture & Views](#3-application-architecture--views)
  - [3.1 Landing Page](#31-landing-page)
  - [3.2 Repository Onboarding & Analysis Pipeline](#32-repository-onboarding--analysis-pipeline)
  - [3.3 Workspace Shell](#33-workspace-shell)
- [4. Complete Screen-by-Screen Breakdown](#4-complete-screen-by-screen-breakdown)
  - [4.1 Overview Screen](#41-overview-screen)
  - [4.2 Architecture Screen](#42-architecture-screen)
  - [4.3 Dependencies Screen](#43-dependencies-screen)
  - [4.4 Tech Debt Screen](#44-tech-debt-screen)
  - [4.5 History Screen](#45-history-screen)
  - [4.6 Onboarding Guide Screen](#46-onboarding-guide-screen)
- [5. Analysis Engine & Heuristics](#5-analysis-engine--heuristics)
  - [5.1 Multi-Language Import Parsing](#51-multi-language-import-parsing)
  - [5.2 Structural Complexity Estimation](#52-structural-complexity-estimation)
  - [5.3 Risk Scoring & Weights Formula](#53-risk-scoring--weights-formula)
  - [5.4 Co-Change Detection & Jaccard Metric](#54-co-change-detection--jaccard-metric)
  - [5.5 Honest Analysis Coverage](#55-honest-analysis-coverage)
- [6. Technology Stack](#6-technology-stack)
- [7. Getting Started](#7-getting-started)

---

## 1. Executive Summary

**Vertex** is a client-side codebase intelligence platform designed for software architects, engineering leads, and developers. It transforms complex code repositories into intuitive, evidence-based visual maps.

Unlike traditional static analysis tools that spit out raw linter lists or AI tools that hallucinate structure, Vertex strictly extracts facts directly from:
1. **Source code file hierarchy and import/include statements** (JavaScript, TypeScript, Python, C/C++, Java).
2. **Git commit history, file-level churn, author contributions, and co-change frequency**.
3. **Explicit code indicators** (TODO, FIXME, HACK markers, structural branch density, and fan-in/fan-out coupling).

---

## 2. Core Philosophy

Vertex operates under a strict design contract:

$$\text{ACCURACY} > \text{HONESTY} > \text{PERFORMANCE} > \text{FEATURES} > \text{UI POLISH}$$

- **Zero Fabricated Relationships**: If an edge cannot be proved via an import/include statement or commit co-change, it is not drawn.
- **Honest Coverage**: Every metric explicitly displays its confidence level and data coverage (Files Analyzed vs Total, Commit History Depth, Deep Source Dependency Status). If data is unavailable, it is marked as `Unavailable` rather than guessing.
- **Privacy & Local Execution**: Runs entirely in the client browser. Local repositories are analyzed via HTML5 directory selection without uploading code to any server. GitHub repositories use authenticated or public GitHub REST endpoints.

---

## 3. Application Architecture & Views

The application transitions through three primary user flows:

```
[ Landing Page ]  ──(Open Workspace)──>  [ Repository Onboarding ]
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 ▼                                                                 ▼
      [ Local Folder Upload ]                                           [ GitHub Public URL ]
                 │                                                                 │
                 └────────────────────────┬────────────────────────────────────────┘
                                          ▼
                             [ Analysis Progress Screen ]
                               (4-Stage Real-Time Pipeline)
                                          │
                                          ▼
                                [ Workspace Shell ]
    ┌──────────────┬──────────────────┬───────────────┬─────────────┬───────────┬───────────┐
    ▼              ▼                  ▼               ▼             ▼           ▼           ▼
[Overview]   [Architecture]    [Dependencies]    [Tech Debt]    [History]    [Guide]   [Theme]
```

---

### 3.1 Landing Page
*Location:* `src/landing/LandingPage.tsx`

The landing page introduces the platform, explains its value proposition, and offers a live interactive preview of the visual engine:
- **Sticky Top Navigation**: Features Vertex brand mark, smooth-scroll links to product anchors (`#features`, `#workspace`, `#history`), dark/light theme switch, and quick "Open workspace" button.
- **Hero Section**:
  - Highlights core value: *"See your system as it really is."*
  - Live preview widget embedding the **ArchitectureGraph** running on `vertex/control-plane` demo data with smooth D3 force-directed physics.
- **Positioning Strip**: Reinforces product thesis: *"The history of your system, made visible."*
- **Feature Spotlights**: Alternating zig-zag feature showcases explaining the core screens (Overview, Architecture, Dependencies, Tech Debt).
- **Workspace Callout**: Interactive banner prompting users to test the workspace with sample data or custom codebases.
- **Living History Showcase**: Live card carousel derived from real commit metadata showing hashes, commit messages, and touched files.
- **Call-to-Action Footer**: Quick access to workspace and project metadata.

---

### 3.2 Repository Onboarding & Analysis Pipeline
*Locations:* `src/workspace/RepositoryOnboarding.tsx`, `src/workspace/AnalysisProgress.tsx`

Before entering the dashboard, users choose their codebase source:
1. **Analyze Local Repository**: Uses browser `webkitdirectory` file selection. Allows developers to analyze local code securely without any backend network transmission.
2. **Analyze GitHub Repository**: Accepts public repository URLs (e.g. `https://github.com/facebook/react` or `owner/repo`). Parses trees, blobs, and commit logs via GitHub REST API.
3. **Try with Demo Data**: Instantly loads pre-computed telemetry for `vertex/control-plane` to explore capabilities without waiting.

#### The 4-Stage Analysis Pipeline
While analyzing, `AnalysisProgress.tsx` provides a live visual status bar tracking four distinct phases:
1. **Scanning repository structure**: Classifies every file (source, header, build, config, doc, test, asset) and builds directory hierarchy.
2. **Reading Git history**: Retrieves commit history, author identities, churn rates, and timestamp logs.
3. **Building dependency graph**: Parses AST/regex import statements (`import`, `require`, `#include`) to map file and module linkages.
4. **Generating insights**: Computes complexity heuristics, calculates risk scores, identifies circular cycles, and builds the developer onboarding guide.

---

### 3.3 Workspace Shell
*Location:* `src/workspace/WorkspaceShell.tsx`

The shell wraps all analysis results in `AnalysisContext.Provider`:
- **Top Header Bar**: Displays repository name badge, active commit hash / commit count, "Analyze another repo" trigger, and theme toggle.
- **Left Navigation Rail**: Quick switching between the 6 workspace screens (Overview, Architecture, Dependencies, Tech Debt, History, Guide).
- **Active Content Area**: Smooth screen transitions with isolated state retention.

---

## 4. Complete Screen-by-Screen Breakdown

---

### 4.1 Overview Screen
*Location:* `src/workspace/screens/OverviewScreen.tsx`

The **Overview Screen** serves as the executive cockpit, delivering a bird’s-eye snapshot of repository health, size, and risk.

#### What it does:
1. **Key Metric Stat Cards**:
   - **Source files**: Total count of active source files and computed thousand lines of code (kLOC).
   - **Modules**: Total top-level modules identified and average lines of code per file (~LOC/file).
   - **Commits**: Total commit volume and latest commit hash.
   - **Debt score**: Overall technical debt score based on detected TODO/FIXME/HACK markers and risk indicators.
2. **Honest Coverage Status Bar**:
   - Displays real confidence rating (**High**, **Medium**, or **Low**).
   - Shows file analysis coverage (`Analyzed / Total Files`).
   - Deep source dependency parsing progress (`Deep analysis: X / Y`).
   - Git history completeness status badge.
3. **Framework & File Classification**:
   - Detects underlying framework (e.g. React, Next.js, Django, FastAPI) and build system (Vite, Webpack, CMake, Cargo).
   - File classification pills categorizing files into **source**, **test**, **config**, and **documentation**.
4. **Highest Risk Modules**:
   - Ranks top modules exceeding risk threshold score (> 30/100).
   - Badges potential **"God Modules"** (monolithic files/folders that concentrate excessive logic, lines of code, and coupling).
   - Lists LOC, file count, estimated structural complexity, commit churn, and dependent counts.
5. **Language Composition Bar**:
   - Color-coded proportion bar visualizing linguistic breakdown (TypeScript, Python, C++, Go, etc.) with exact percentage distribution.
6. **Telemetry Sparklines**:
   - **Commit Activity Sparkline**: Visualizes commit frequency trends over the captured git timeline.
   - **Debt Trend Sparkline**: Tracks historical accumulation or reduction of debt markers.
7. **Recent Commits Log**:
   - Displays recent commits with author name, message, and SHA hash.
8. **Evidence Insights Cards**:
   - Evidence-grounded architectural takeaways with source attribution (e.g. `Static Analysis`, `Git History`) and bulleted factual findings.

---

### 4.2 Architecture Screen
*Location:* `src/workspace/screens/ArchitectureScreen.tsx`, `src/components/ArchitectureGraph.tsx`

The **Architecture Screen** renders the physical service mesh and module structure of the codebase.

#### What it does:
1. **Interactive D3 Force-Directed Architecture Graph**:
   - Nodes represent architectural modules or services.
   - Directed edges indicate active import/include relationships.
   - **Semantic Color Coding**:
     - 🟢 **Emerald (Healthy)**: Low risk score, balanced dependencies, normal churn.
     - 🟡 **Amber (Evolving)**: Moderate risk, active changes, or growing fan-in/fan-out.
     - 🔴 **Rust (At Risk)**: High structural complexity, heavy churn, high coupling, or God Module characteristics.
   - Physics simulation features collision prevention, link tension, center attraction, and damping for smooth settling.
2. **Architectural Coupling Metrics**:
   - **Most Depended-Upon Modules (High Fan-In)**: Identifies foundational modules that many other modules rely upon. High fan-in modules pose systemic risk because changes to them propagate broadly.
   - **Highest Fan-Out Modules**: Highlights modules with many outbound dependencies, indicating high orchestration or potential over-reliance on other components.
   - **Dependency Hubs**: Highlights critical junction modules exhibiting both high fan-in AND high fan-out.
3. **Module Catalog & Inspectable Sidebar Drawer**:
   - Clicking any module opens a detailed sidebar panel showing:
     - Total file count and lines of code.
     - Structural complexity score across analyzed files.
     - Fan-in (dependents) and Fan-out (dependencies) counts.
     - Heuristic risk score (`X/100`) with weight contributions (+points for complexity, churn, coupling, size, bus factor).
     - Concrete evidence explanations.
     - Complete list of files belonging to the module.
     - Explicit list of upstream dependencies (`→ target`) and downstream dependents (`← source`).

---

### 4.3 Dependencies Screen
*Location:* `src/workspace/screens/DependenciesScreen.tsx`

The **Dependencies Screen** exposes the microscopic import graph across internal files, external packages, and dangerous circular cycles.

#### What it does:
1. **Live Search & Filter**:
   - Instantly filters dependencies across all tabs by file path or package name.
2. **Three Dedicated View Tabs**:
   - **Internal Dependencies Tab**:
     - Surfaces exact file-to-file imports (`fileA.ts → fileB.ts`).
     - Displays the **concrete code evidence string** extracted from the source file (e.g. `import { Brand } from "../components/Brand"`).
   - **External Dependencies Tab**:
     - Discovers all third-party libraries imported across the project (e.g. `react`, `d3-force`, `lucide-react`, `torch`, `boost`).
     - Shows how many files import each library and provides file tags indicating where they are consumed.
   - **Circular Dependencies Tab**:
     - Evaluates the dependency graph using cycle detection.
     - Identifies dangerous loops (e.g. `Cycle 1: serviceA.ts ↔ serviceB.ts ↔ serviceC.ts ↔ serviceA.ts`).
     - Flags circular imports that cause runtime initialization bugs, memory leaks, and compilation coupling.

---

### 4.4 Tech Debt Screen
*Location:* `src/workspace/screens/TechDebtScreen.tsx`

The **Tech Debt Screen** translates code smells and structural fragility into an objective, ranked engineering backlog that helps leaders justify refactoring.

#### What it does:
1. **Ranked Hotspots List**:
   - Lists debt items ordered by calculated risk severity.
   - Features a color-coded severity meter:
     - 🔴 **Rust**: High risk score ($\ge 70$)
     - 🟡 **Amber**: Moderate risk ($40 \text{--} 69$)
     - ⚪ **Muted**: Low risk ($< 40$)
2. **Dynamic Sorting**:
   - **Sort by Risk**: Highlights the most structurally dangerous areas first.
   - **Sort by Age**: Surfaces long-standing unresolved debt markers based on git history.
   - **Sort by Name**: Alphabetical directory sorting.
3. **Exclusion of Non-Source Code**:
   - Strictly evaluates source code. Ignores configuration files, documentation, package locks, and auto-generated code to prevent false positives.
4. **Expandable Evidence Drawers**:
   - Clicking an item expands a detailed breakdown grid showing individual metrics:
     - Complexity heuristic score.
     - Commit churn rate and frequency.
     - Dependent coupling count.
     - Physical file size and LOC.
     - Historical risk duration in days.

---

### 4.5 History Screen
*Location:* `src/workspace/screens/HistoryScreen.tsx`

The **History Screen** reconstructs the evolutionary timeline of the software system from git commit logs.

#### What it does:
1. **Contributor Knowledge Summary**:
   - Summarizes active contributors, total commits authored, and overall percentage contribution.
2. **Co-Change Coupling Analysis ("Files that change together")**:
   - Analyzes commit sets to identify file pairs that consistently change in the same commit.
   - Evaluates coupling using the **Jaccard Similarity Coefficient** ($J$).
   - Alerts engineers to hidden logical coupling where changing one file requires changing another, even when no direct import exists between them.
3. **High-Churn Files**:
   - Identifies the most volatile files across repository history (highest commit counts and recent edits).
   - Volatile files with high structural complexity represent the highest statistical probability for regressions.
4. **Chronological Git Timeline**:
   - Interactive stream showing commit SHA, author name, relative date, commit message, and tags for every file modified in that commit.

---

### 4.6 Onboarding Guide Screen
*Location:* `src/workspace/screens/OnboardingGuideScreen.tsx`

The **Onboarding Guide Screen** generates a deterministic, evidence-based exploration roadmap tailored for new engineers joining the project.

#### What it does:
1. **High-Level Project Metadata**:
   - Identifies project type (e.g. Single-Page Application, Node CLI, Python Service, Fullstack Web App).
   - Total detected entry points, major modules, and risky modules.
2. **Step 1: Entry Points**:
   - Detects and lists the natural roots of execution (e.g. `main.tsx`, `index.html`, `server.ts`, `app.py`). Directs new engineers where code execution starts.
3. **Step 2: Recommended Exploration Path**:
   - Provides a sequenced, step-by-step reading roadmap.
   - Orders modules by foundational low-risk dependencies first, allowing engineers to grasp core concepts before facing high-complexity modules.
4. **Step 3: Major Modules Overview**:
   - Lists primary functional subsystems, brief descriptions, and file quantities.
5. **Step 4: Modules to Approach Carefully**:
   - Flags modules carrying elevated risk scores, extensive churn, or high coupling, advising new developers to write tests and consult teammates before refactoring.
6. **Step 5: "Who Knows What" (Codebase Ownership Map)**:
   - Matches each module with the engineers who have historically committed the most lines and changes to it.
   - Tells newcomers exactly who to tag for PR reviews or architecture clarification.

---

## 5. Analysis Engine & Heuristics

The underlying engine in `src/analysis/` implements algorithms that compute factual metrics without sending code to an LLM:

### 5.1 Multi-Language Import Parsing (`imports.ts`)
Parses real imports across multiple programming languages:
- **TypeScript / JavaScript**: ES6 `import ... from '...'`, dynamic `import('...')`, CommonJS `require('...')`, and `export ... from '...'`.
- **Python**: `import module`, `from module import name`, and relative imports (`from .package import ...`).
- **C / C++**: Preprocessor `#include "file.h"` (internal) and `#include <library>` (external).
- **Java**: `import package.name.Class;` and static imports.
- Resolves relative path targets and normalizes extensions (`.ts`, `.tsx`, `.js`, `.py`, `.h`, `.cpp`).

### 5.2 Structural Complexity Estimation (`metrics.ts`)
Computes structural complexity through lexical analysis:
1. Strips all inline comments (`//`, `#`), block comments (`/* ... */`), and Python docstrings (`"""`, `'''`) so words inside comments are not counted.
2. Analyzes branching and control flow density:
   - Conditional branches: `if`
   - Loop constructs: `for`, `while`
   - Selection blocks: `switch`, `case`
   - Exception handling: `catch`
   - Logical operators: `&&`, `||`, and Python `and` / `or`
3. Returns an objective structural complexity score.

### 5.3 Risk Scoring & Weights Formula (`types.ts`, `metrics.ts`)
Vertex calculates module and hotspot risk scores out of 100 based on the centralized `RISK_WEIGHTS` model:

| Risk Factor | Weight Contribution | Evidence Evaluated |
| :--- | :---: | :--- |
| **Structural Complexity** | **30%** | Average branching keyword density across source files |
| **Commit Churn** | **25%** | Historical edit frequency and lines added/deleted |
| **Coupling (Fan-In)** | **25%** | Number of other modules dependent on this module |
| **Module Size (LOC)** | **10%** | Total lines of code and file density |
| **Bus Factor / Concentration** | **10%** | Single-contributor dominance ($> 80\%$ commits by one author) |

**Total Risk Score Formula:**
$$\text{RiskScore} = \min\left(100, \sum (\text{normalized\_metric}_i \times \text{weight}_i)\right)$$

### 5.4 Co-Change Detection & Jaccard Metric (`metrics.ts`)
Identifies architectural coupling between files $A$ and $B$ that change together across commits using the Jaccard similarity coefficient:

$$J(A, B) = \frac{|\text{Commits}(A) \cap \text{Commits}(B)|}{|\text{Commits}(A) \cup \text{Commits}(B)|}$$

- Only file pairs sharing 2 or more co-changes are evaluated.
- Insufficient commit history is flagged honestly with `Insufficient evidence`.

### 5.5 Honest Analysis Coverage (`types.ts`, `metrics.ts`)
Each analysis tracks granular status indicators (`complete`, `partial`, `unavailable`, `failed`) across:
- **Files**: Total files discovered vs files parsed.
- **Dependencies**: Source files eligible vs source files parsed.
- **History**: Total commits available vs commits downloaded and date span in days.
- **Confidence Rating**: Derived from the harmony of available signals.

---

## 6. Technology Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 7](https://vite.dev/) with `@vitejs/plugin-react` and `vite-plugin-svgr`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with CSS custom property design tokens
- **Graph Simulation**: [d3-force](https://github.com/d3/d3-force) for interactive physics
- **Icons**: [Lucide React](https://lucide.dev/) and [React Icons](https://react-icons.github.io/react-icons/)
- **Typography**: [Inter](https://fontsource.org/fonts/inter), [Space Grotesk](https://fontsource.org/fonts/space-grotesk), and [JetBrains Mono](https://fontsource.org/fonts/jetbrains-mono) via Fontsource

---

## 7. Getting Started

### Prerequisites
- Node.js (version 18 or newer)
- npm or pnpm

### Installation & Development
1. Clone the repository or navigate to the directory:
   ```bash
   cd vertex-main
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the local development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.
5. Click **"Open workspace"** and pick a local project folder, enter a GitHub URL, or select **"Try with demo data"**.

### Production Build
```bash
npm run build
npm run preview
```
