# Synaptra Studio - Product Requirements Document

## Project Context
Production-grade Multimodal Agent Operations Hub for MSc application to Imperial College London's Computing (AI & ML) programme. Built to withstand academic scrutiny and professional engineering evaluation.

## Original Problem Statement
Create Synaptra Studio as an enterprise-quality Multimodal Agent Operations Hub for AI task execution, automation, memory inspection, and research-grade evaluation with a cinematic yet serious mission-critical operating console aesthetic.

## Architecture
- **Frontend**: React with React Router, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI with async MongoDB (Motor)
- **AI Engine**: OpenAI GPT-4o via OpenAI API
- **Database**: MongoDB for task persistence

## Design System - "Deep Obsidian Void" (Jan 18, 2026)

### Color Palette
- **Void Background**: #030303 (near-black)
- **Surface**: #0a0a0a, #0f0f0f, #141414 (subtle elevation)
- **Primary Accent**: #3b82f6 (Precision Blue)
- **Active/Running**: #f59e0b (Industrial Amber)
- **Success**: #10b981 (green)
- **Error**: #ef4444 (red)
- **Text**: #fafafa (primary), #a1a1aa (secondary), #71717a (tertiary)

### Typography
- **Headings**: Inter, -0.02em tracking
- **Data/Labels**: JetBrains Mono, uppercase, 0.12em letter-spacing
- **Body**: Inter, 400 weight

### Design Principles
1. **Cinematic through scale and pacing**, not visual effects
2. **Motion only on meaningful state changes** (task selection, execution progress, result reveals)
3. **Professional glassmorphism**: low-opacity dark surfaces, subtle blur, precise borders
4. **Strict layout discipline**: no overlapping elements, clean vertical reflow
5. **System-oriented language**: "Operational", "Execute", "Pipeline", not casual terms
6. **No decorative elements**: no emojis, no GitHub links, no developer-facing UI

## Implemented Features (Jan 18, 2026)

### Navigation & Layout
- ✅ Sidebar with branded "SYNAPTRA - CONTROL CONSOLE" header
- ✅ Organized nav sections: Operations, System, Audit
- ✅ System Status footer showing Core and AI Engine status
- ✅ Header with GPT-4o indicator, Operational status, time

### Dashboard
- ✅ Hero section with "SYNAPTRA STUDIO - Multimodal Agent Operations Hub"
- ✅ Stats grid: Total Runs, Completed, Avg Score, AI Engine
- ✅ Quick Actions: Run Task, Evaluation Suite, Inspect Memory, Automations
- ✅ Recent Executions panel with score-colored items

### Task Runner
- ✅ Three-column layout (Task Queue | Workspace | Metrics)
- ✅ Task input with image upload support
- ✅ Execution Pipeline with 5 stages:
  - Input Reception, Preprocessing, AI Analysis, Evaluation, Output Generation
- ✅ Step timing display (50ms, 50ms, 5928ms, etc.)
- ✅ Output panel with rich formatted content
- ✅ Metrics panel with progress bars:
  - Quality Score, Relevance Score, Efficiency Score, Plan Adherence
- ✅ Overall Score highlight card with "Heuristic composite • Weighted average" label
- ✅ Performance card: Execution Time
- ✅ Run Metadata: Task ID, Created, Model, Modality

### Synaptra Eval Module
- ✅ Three-column layout (Suites | Details | Run History)
- ✅ Create/delete evaluation suites
- ✅ Suite details with stats (Tasks, Run Count, Last Run)
- ✅ Suite Tasks list with type badges
- ✅ Run Evaluation button with loading state
- ✅ Aggregate metrics display:
  - Quality, Relevance, Efficiency, Plan Adherence
- ✅ Weighted Fidelity Score with confidence indicator
- ✅ Run History with color-coded scores

### Other Pages (Basic Implementation)
- ⏳ Automations - placeholder for workflow designer
- ⏳ Memory - memory inspection interface
- ⏳ Tools - tool registry
- ⏳ History - audit ledger
- ⏳ Settings - configuration panel

### Backend (100% Functional)
- ✅ Full task execution pipeline with GPT-4o
- ✅ Evaluation engine (quality, relevance, efficiency, plan_adherence, output_coherence)
- ✅ Task persistence in MongoDB
- ✅ Memory service CRUD
- ✅ Eval suites CRUD
- ✅ Eval runs execution with aggregate scoring
- ✅ Settings persistence
- ✅ Task and eval run export

## API Endpoints
- `GET /api/status` - System status
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create and execute task
- `GET /api/tasks/{id}` - Get single task
- `DELETE /api/tasks/{id}` - Delete task
- `GET /api/memory` - List memory items
- `GET /api/memory/stats` - Memory statistics
- `DELETE /api/memory/{id}` - Delete memory item
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings
- `GET /api/eval/suites` - List eval suites
- `POST /api/eval/suites` - Create eval suite
- `GET /api/eval/suites/{id}` - Get single suite
- `DELETE /api/eval/suites/{id}` - Delete suite
- `POST /api/eval/run/{suite_id}` - Run evaluation
- `GET /api/eval/runs` - List eval runs
- `GET /api/eval/runs/{id}` - Get single run

## Test Results (Jan 18, 2026)
- Backend: 17/17 API tests passed (100%)
- Frontend: 100% (all design features working)
- Test files: `/app/tests/test_synaptra_api.py`, `/app/test_reports/iteration_5.json`

## Next Steps (Priority Order)
1. **P2 - Complete Functional Pages**
   - Automations: Build v1 workflow designer
   - Memory: Full timeline view, item inspection with task links
   - History: Robust filtering (date, type, status, score), JSON/report export
   - Tools: Tool registry with enable/disable and usage logging
   - Settings: Make controls functional (model selection affects API calls)

2. **P3 - Enhance Synaptra Eval**
   - Add benchmark types (single-step, multi-step planning, tool-augmented, memory-dependent, cross-modal)
   - Add trajectory fidelity metric
   - Add memory correctness metric
   - Build run comparison view
   - Add confidence/reliability indicators

3. **P3 - Memory Subsystem Enhancement**
   - Implement queryable memory object model
   - Add memory type taxonomy (fact, artifact, intermediate result, tool output)
   - Add visibility scope (run-local vs global)
   - Add optional embeddings for retrieval

## Resolved Issues
1. ~~TaskRunner: Clicking on tasks in sidebar doesn't populate panels~~ - **RESOLVED** (false positive - wrong test selector)
2. ~~Missing Eval.jsx file causing app crash~~ - **RESOLVED** (created)
3. ~~UI felt unprofessional/overlapping~~ - **RESOLVED** (complete redesign with Deep Obsidian Void theme)
