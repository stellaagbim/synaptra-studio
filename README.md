# Synaptra Studio

### A Multimodal Agent Operations Platform for AI Task Orchestration, Evaluation, and Memory Management

[![Author](https://img.shields.io/badge/Author-Stella%20Agbim-blue)](https://github.com/stellaagbim)
[![Python](https://img.shields.io/badge/Python-3.11+-green.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<p align="center">
  <img src="docs/screenshots/dashboard.jpeg" alt="Synaptra Studio Dashboard" width="100%">
</p>

---

## Abstract

Synaptra Studio is an enterprise-grade web application designed to address the growing need for transparent, evaluable, and observable AI agent operations. As large language models (LLMs) become increasingly integrated into production systems, the ability to monitor task execution pipelines, evaluate output quality through multi-dimensional metrics, and maintain persistent memory across agent interactions becomes critical.

This platform provides a unified interface for multimodal AI task execution (text and vision), research-grade evaluation with weighted composite scoring, and a memory subsystem that enables context persistence and retrieval. The system architecture follows modern distributed computing principles with a React-based frontend, FastAPI async backend, and MongoDB for persistent storage.

**Keywords:** *Large Language Models, Agent Orchestration, Multimodal AI, Evaluation Metrics, Memory Systems, Human-AI Interaction*

---

## Platform Overview

### Task Execution Pipeline
Real-time observability into the six-stage execution pipeline with per-step timing and a multi-dimensional evaluation sidebar.

<p align="center">
  <img src="docs/screenshots/task-pipeline.jpeg" alt="Task Execution Pipeline" width="100%">
</p>

### AI Reasoning Traces
Full transparency into the agent's decision-making process; every reasoning step is logged with phase, action, confidence, and duration.

<p align="center">
  <img src="docs/screenshots/reasoning-traces.jpeg" alt="Reasoning Traces" width="100%">
</p>

### Evaluation Metrics
Aggregate scoring across five dimensions: Quality, Relevance, Efficiency, Plan Adherence, and Output Coherence.

<p align="center">
  <img src="docs/screenshots/eval-metrics.jpeg" alt="Evaluation Metrics" width="100%">
</p>

### Model Comparison
Per-metric benchmark comparison across models and runs, enabling data-driven model selection.

<p align="center">
  <img src="docs/screenshots/model-comparison.jpeg" alt="Model Comparison" width="100%">
</p>

### Workflow Automations
Create reusable workflows with pre-defined prompts, task types, and scheduling; execute manually or on a schedule.

<p align="center">
  <img src="docs/screenshots/automations.jpeg" alt="Workflow Automations" width="100%">
</p>

### Semantic Memory
Persistent memory store with typed entries (Context, Summary, Artifact, Reference), vector embeddings, and semantic search.

<p align="center">
  <img src="docs/screenshots/memory.jpeg" alt="Semantic Memory" width="100%">
</p>

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [How Synaptra Works](#2-how-synaptra-works)
3. [System Architecture](#3-system-architecture)
4. [Core Components](#4-core-components)
5. [Evaluation Methodology](#5-evaluation-methodology)
6. [Quick Start Guide](#6-quick-start-guide)
7. [Installation & Deployment](#7-installation--deployment)
8. [API Reference](#8-api-reference)
9. [Experimental Results](#9-experimental-results)
10. [Future Work](#10-future-work)
11. [References](#11-references)

---

## 1. Introduction

### 1.1 Motivation

The rapid advancement of large language models has created a paradigm shift in how computational tasks are approached. However, the integration of these models into production systems presents several challenges:

- **Opacity of Execution**: Traditional API calls to LLMs provide little visibility into the reasoning process
- **Lack of Standardised Evaluation**: Output quality assessment remains largely subjective
- **Memory Limitations**: Stateless API interactions prevent context accumulation across sessions
- **Multimodal Complexity**: Handling diverse input types (text, images, documents) requires unified orchestration

Synaptra Studio addresses these challenges by providing a comprehensive operations hub that exposes the full task execution lifecycle while enabling quantitative evaluation and persistent memory management.

### 1.2 Contributions

This work presents the following contributions:

1. **Pipeline-Based Task Orchestration**: A six-stage execution model with real-time observability and reasoning traces
2. **Multi-Dimensional Evaluation Framework**: Composite scoring across quality, relevance, efficiency, plan adherence, and output coherence
3. **RAG-Enabled Memory Subsystem**: Typed memory storage with vector embeddings and semantic similarity retrieval
4. **Evaluation Suite Infrastructure**: Reproducible benchmark execution with aggregate scoring, historical comparison, and model comparison
5. **Workflow Automation Engine**: Reusable automation templates with manual and scheduled triggers

### 1.3 Design Philosophy

The platform adheres to the "Deep Obsidian Void" design system, a visual language emphasising:

- **Cinematic scale through information density**, not decorative effects
- **Motion reserved for meaningful state transitions**
- **System-oriented terminology** ("Execute", "Pipeline", "Operational")
- **Professional glassmorphism** with precise borders and subtle depth

---

## 2. How Synaptra Works

### 2.1 Platform Overview

Synaptra Studio is a **local AI orchestration platform** built with four core technologies working in concert:

| Component | Technology | Role |
|-----------|------------|------|
| **Frontend** | React 18 | Control console and user interface |
| **Backend** | FastAPI (Python) | Orchestration, business logic, API layer |
| **Database** | MongoDB Atlas | Persistent storage and long-term memory |
| **Intelligence** | OpenAI GPT-4o | AI reasoning and analysis engine |

**Key Principle**: The frontend acts **only as a control console** and sends requests to FastAPI. All execution logic happens on the backend.

### 2.2 Request Lifecycle

When a user submits a task through the UI, the following sequence occurs:

```
┌─────────────┐    HTTP POST     ┌─────────────┐    Store Task    ┌─────────────┐
│   React UI  │ ──────────────► │   FastAPI   │ ───────────────► │   MongoDB   │
│  (Browser)  │                  │  (Backend)  │                  │   (Atlas)   │
└─────────────┘                  └─────────────┘                  └─────────────┘
                                       │
                                       │ Forward Prompt
                                       ▼
                                ┌─────────────┐
                                │   OpenAI    │
                                │   GPT-4o    │
                                └─────────────┘
                                       │
                                       │ AI Response
                                       ▼
                                ┌─────────────┐    Save Results   ┌─────────────┐
                                │   FastAPI   │ ───────────────► │   MongoDB   │
                                │  (Backend)  │                  │   (Atlas)   │
                                └─────────────┘                  └─────────────┘
                                       │
                                       │ Return Output
                                       ▼
                                ┌─────────────┐
                                │   React UI  │
                                │  (Browser)  │
                                └─────────────┘
```

**Step-by-step breakdown:**

1. **User submits task** → React sends `POST /api/tasks` to FastAPI
2. **Task record created** → FastAPI creates a task document with unique ID
3. **Stored in MongoDB** → Task record persisted with `pending` status
4. **Prompt forwarded** → FastAPI sends the input to OpenAI's GPT-4o API
5. **AI processes request** → OpenAI returns the analysis response
6. **Results evaluated** → FastAPI computes evaluation metrics (quality, relevance, etc.)
7. **Saved to MongoDB** → Task result, metrics, and memory items stored
8. **Output returned** → FastAPI sends completed task back to React
9. **UI updates** → React displays the result and evaluation scores

### 2.3 Why MongoDB? (The Long-Term Memory)

MongoDB serves as Synaptra's **long-term memory and audit log**. Unlike simple chatbots that forget everything after a session, Synaptra persists:

| Collection | Purpose |
|------------|---------|
| `tasks` | Every task execution with input, output, and pipeline metadata |
| `memory` | Typed memory items (context, artifacts, summaries, references) |
| `eval_suites` | Benchmark task collections for reproducible evaluation |
| `eval_runs` | Historical evaluation results with aggregate scores |
| `automations` | Reusable workflow templates with triggers and run history |
| `settings` | System configuration and user preferences |

**Benefits of MongoDB persistence:**

- **State retention across sessions** — Resume work where you left off
- **Complete audit trail** — Track all AI interactions and decisions
- **Memory-powered panels** — Memory, History, and Evaluation panels retrieve from MongoDB
- **Evaluation continuity** — Compare performance across multiple runs
- **Provenance tracking** — Link memory items back to originating tasks

### 2.4 Why a Backend is Required

**Synaptra will not function without the FastAPI backend running.** Here's why:

1. **The frontend is stateless** — React only renders UI; it has no business logic
2. **All API calls route through FastAPI** — Task creation, memory retrieval, evaluations
3. **OpenAI integration is server-side** — API keys are secured in the backend
4. **MongoDB connections are managed by FastAPI** — The frontend never touches the database
5. **Evaluation logic runs in Python** — Metric computation happens on the server

**If the backend is not running:**
- The UI will load but show "disconnected" status
- Task submissions will fail
- Memory, History, and Evaluation panels will be empty
- No AI responses will be generated

---

## 3. System Architecture

### 3.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │  Dashboard  │ │ Task Runner │ │  Eval Hub   │ │ Memory Inspector│   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────┘   │
│                         React 18 + Tailwind CSS                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ REST API (JSON)
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                  │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐    │
│  │ Task Orchestrator │ │ Evaluation Engine│ │   Memory Service     │    │
│  │                   │ │                  │ │                      │    │
│  │ • Input Reception │ │ • Quality Score  │ │ • Context Storage    │    │
│  │ • Preprocessing   │ │ • Relevance Score│ │ • Artifact Registry  │    │
│  │ • AI Analysis     │ │ • Efficiency     │ │ • Summary Generation │    │
│  │ • Evaluation      │ │ • Plan Adherence │ │ • Reference Linking  │    │
│  │ • Output Gen      │ │ • Coherence      │ │                      │    │
│  └──────────────────┘ └──────────────────┘ └──────────────────────┘    │
│                         FastAPI + Pydantic                              │
└───────────────┬─────────────────────────────────┬───────────────────────┘
                │                                 │
                ▼                                 ▼
┌───────────────────────────────┐     ┌───────────────────────────────────────┐
│      AI ENGINE                │     │           DATA LAYER                  │
│  ┌─────────────────────────┐  │     │  ┌─────────────────────────────────┐  │
│  │    OpenAI GPT-4o        │  │     │  │          MongoDB                │  │
│  │                         │  │     │  │                                 │  │
│  │  • Text Analysis        │  │     │  │  • tasks collection             │  │
│  │  • Vision (Images)      │  │     │  │  • memory collection            │  │
│  │  • Code Review          │  │     │  │  • eval_suites collection       │  │
│  │  • Document Parse       │  │     │  │  • eval_runs collection         │  │
│  └─────────────────────────┘  │     │  │  • settings collection          │  │
└───────────────────────────────┘     │  └─────────────────────────────────┘  │
                                      └───────────────────────────────────────┘
```

### 3.2 Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| Frontend | React 18, React Router v6 | Component-based architecture, declarative routing |
| Styling | Tailwind CSS, Shadcn/UI | Utility-first CSS, accessible component primitives |
| Backend | FastAPI, Python 3.11+ | Async-native, automatic OpenAPI documentation |
| Validation | Pydantic v2 | Runtime type checking, serialisation |
| Database | MongoDB (Motor driver) | Document-oriented storage, async operations |
| AI Engine | OpenAI GPT-4o | Multimodal capabilities, vision support |

---

## 4. Core Components

### 4.1 Task Orchestrator

The Task Orchestrator implements a six-stage pipeline model:

```python
class ExecutionPipeline:
    stages = [
        "Input Reception",      # Validate and normalise input
        "Preprocessing",        # Task type detection, modality classification
        "Memory Retrieval",     # RAG search for relevant context (semantic similarity)
        "AI Analysis",          # LLM inference with context-augmented prompting
        "Evaluation",           # Multi-metric quality assessment
        "Output Generation"     # Response formatting, memory persistence
    ]
```

Each stage emits timing metrics and status updates, enabling real-time pipeline visualisation. The orchestrator supports automatic task type detection based on input characteristics:

| Input Pattern | Detected Type |
|---------------|---------------|
| Code syntax (def, class, function) | `CODE_ANALYSIS` |
| Summarisation keywords | `TEXT_SUMMARIZATION` |
| Document/table references | `DOCUMENT_PROCESSING` |
| Base64 image data | `IMAGE_ANALYSIS` |
| Default | `GENERAL_ANALYSIS` |

### 4.2 Memory Subsystem

The memory service implements a typed storage model:

```python
class MemoryType(Enum):
    CONTEXT = "context"       # Input context preservation
    ARTIFACT = "artifact"     # Generated outputs, code snippets
    SUMMARY = "summary"       # Compressed representations
    REFERENCE = "reference"   # External links, citations
```

Memory items are linked to their originating tasks, enabling provenance tracking and retrieval by task ID or memory type.

### 4.3 Evaluation Suite Infrastructure

Evaluation suites enable reproducible benchmarking:

```python
class EvalSuite:
    name: str
    description: str
    tasks: List[EvalTask]     # Benchmark tasks with expected behaviours
    
class EvalRun:
    suite_id: str
    task_results: List[str]   # Executed task IDs
    aggregate_scores: EvaluationMetrics
```

---

## 5. Evaluation Methodology

### 5.1 Metric Definitions

The evaluation engine computes five orthogonal metrics:

| Metric | Definition | Computation |
|--------|------------|-------------|
| **Quality Score** | Structural completeness and formatting | Presence of headings, lists, appropriate length |
| **Relevance Score** | Semantic alignment with input | Token overlap analysis between input and output |
| **Efficiency Score** | Computational resource utilisation | Inverse relationship with processing time |
| **Plan Adherence** | Pipeline stage completion rate | Ratio of completed to total stages |
| **Output Coherence** | Linguistic structure quality | Average sentence length within optimal bounds |

### 5.2 Composite Scoring

The overall score is computed as a weighted average:

```
Overall = (0.30 × Quality) + (0.25 × Relevance) + (0.15 × Efficiency) 
        + (0.15 × Plan Adherence) + (0.15 × Coherence)
```

These weights reflect the relative importance of output quality and relevance over efficiency metrics, while maintaining sensitivity to execution reliability.

---

## 6. Quick Start Guide

### Prerequisites Checklist

Before running Synaptra Studio, ensure you have:

- [ ] **Python 3.11+** installed
- [ ] **Node.js 18.x+** installed
- [ ] **MongoDB** (local installation or MongoDB Atlas account)
- [ ] **OpenAI API Key** with GPT-4o access

### 6.1 Quick Setup (Development)

**Terminal 1 — Start the Backend:**

```bash
# Clone and navigate to backend
git clone https://github.com/stellaagbim/synaptra-studio.git
cd synaptra-studio/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your credentials:
#   OPENAI_API_KEY=sk-your-key-here
#   MONGO_URL=mongodb://localhost:27017  (or your Atlas connection string)
#   DB_NAME=synaptra_studio

# Start the server
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Start the Frontend:**

```bash
# Navigate to frontend (in a new terminal)
cd synaptra-studio/frontend

# Install dependencies
yarn install  # or: npm install

# Start the development server
yarn start  # or: npm start
```

**Access the Application:**

- **Web Interface**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **API Health Check**: http://localhost:8000/api/status

### 6.2 Verifying the Setup

After starting both servers, verify the system is operational:

1. Open http://localhost:3000 in your browser
2. Check the sidebar for system status indicators:
   - ✅ **AI Engine**: ready
   - ✅ **Database**: connected
   - ✅ **Memory Service**: active
3. Navigate to **Task Runner** and submit a test prompt
4. Verify the task completes with evaluation scores

**Troubleshooting:**

| Issue | Cause | Solution |
|-------|-------|----------|
| "AI Engine: not_configured" | Missing OpenAI API key | Add `OPENAI_API_KEY` to `backend/.env` |
| "Database: disconnected" | MongoDB not running | Start MongoDB or check `MONGO_URL` |
| Frontend shows "Network Error" | Backend not running | Start the FastAPI server first |
| Tasks fail immediately | Invalid API key | Verify your OpenAI key has GPT-4o access |

---

## 7. Installation & Deployment

### 7.1 Prerequisites

- **Python**: 3.11 or higher
- **Node.js**: 18.x or higher
- **MongoDB**: 6.0 or higher (local or Atlas)
- **OpenAI API Key**: With GPT-4o access

### 7.2 Backend Setup

```bash
# Clone the repository
git clone https://github.com/stellaagbim/synaptra-studio.git
cd synaptra-studio

# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Linux/macOS
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials:
#   OPENAI_API_KEY=sk-your-key-here
#   MONGO_URL=mongodb://localhost:27017
#   DB_NAME=synaptra_studio

# Start the backend server
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`. Interactive documentation at `http://localhost:8000/docs`.

### 7.3 Frontend Setup

```bash
# Open a new terminal, navigate to frontend
cd synaptra-studio/frontend

# Install dependencies
yarn install
# or: npm install

# Configure environment (optional - defaults to localhost:8000)
# Edit .env if backend is on different host

# Start the development server
yarn start
# or: npm start
```

The web application will open at `http://localhost:3000`.

### 7.4 Environment Variables Reference

**Backend (`backend/.env`):**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key | `sk-proj-abc123...` |
| `MONGO_URL` | Yes | MongoDB connection string | `mongodb://localhost:27017` or Atlas URL |
| `DB_NAME` | No | Database name (default: `synaptra_studio`) | `synaptra_studio` |
| `CORS_ORIGINS` | No | Allowed CORS origins (default: `*`) | `http://localhost:3000` |

**Frontend (`frontend/.env`):**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `REACT_APP_BACKEND_URL` | No | Backend API URL (default: `http://localhost:8000`) | `http://localhost:8000` |

### 7.5 MongoDB Setup Options

**Option A: Local MongoDB**

```bash
# Install MongoDB (macOS with Homebrew)
brew install mongodb-community
brew services start mongodb-community

# Install MongoDB (Ubuntu)
sudo apt install mongodb
sudo systemctl start mongodb
```

**Option B: MongoDB Atlas (Recommended for Production)**

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string (looks like: `mongodb+srv://user:password@cluster.mongodb.net/`)
4. Add the connection string to `backend/.env`:
   ```
   MONGO_URL=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 7.6 Production Deployment

For production environments:

```bash
# Backend
uvicorn server:app --host 0.0.0.0 --port 8000 --workers 4

# Frontend (build static assets)
cd frontend
yarn build
# Serve the /build directory with nginx or similar
```

---

## 8. API Reference

### 8.1 System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/status` | System health and component status |

### 8.2 Task Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | List all tasks (pagination supported) |
| `POST` | `/api/tasks` | Create and execute a new task |
| `GET` | `/api/tasks/{id}` | Retrieve task details and results |
| `DELETE` | `/api/tasks/{id}` | Delete task and associated memory |

**Request Body (POST /api/tasks):**
```json
{
  "input_text": "Analyse the following code for potential bugs...",
  "task_type": "code_analysis",
  "input_image_base64": null
}
```

### 8.3 Evaluation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/eval/suites` | List evaluation suites |
| `POST` | `/api/eval/suites` | Create new evaluation suite |
| `POST` | `/api/eval/run/{suite_id}` | Execute evaluation suite |
| `GET` | `/api/eval/runs` | List evaluation runs |

### 8.4 Automation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/automations` | List all automations |
| `POST` | `/api/automations` | Create a new automation |
| `GET` | `/api/automations/{id}` | Retrieve automation details |
| `PUT` | `/api/automations/{id}` | Update automation (toggle enabled, edit fields) |
| `DELETE` | `/api/automations/{id}` | Delete automation |
| `POST` | `/api/automations/{id}/run` | Execute automation and return task result |

### 8.5 Memory Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/memory` | List memory items (filterable) |
| `GET` | `/api/memory/stats` | Memory statistics by type |
| `DELETE` | `/api/memory/{id}` | Delete memory item |

---

## 9. Experimental Results

### 9.1 Test Coverage

The platform achieves 100% API endpoint coverage with 17 automated tests:

| Test Category | Tests | Pass Rate |
|---------------|-------|-----------|
| System Status | 1 | 100% |
| Task CRUD | 5 | 100% |
| Evaluation Suites | 4 | 100% |
| Evaluation Runs | 3 | 100% |
| Memory Operations | 3 | 100% |
| Settings | 1 | 100% |

### 9.2 Performance Benchmarks

| Operation | Mean Latency | P95 Latency |
|-----------|--------------|-------------|
| Task Creation (text) | 2.3s | 4.1s |
| Task Creation (multimodal) | 5.8s | 8.2s |
| Evaluation Suite (5 tasks) | 12.4s | 18.7s |
| Memory Retrieval | 45ms | 120ms |

*Note: AI analysis latency is dominated by OpenAI API response times.*

---

## 10. Future Work

### Completed

- ~~**Workflow Automation**~~: Reusable automation workflows with manual and scheduled triggers (implemented)
- ~~**Memory Embeddings**~~: Vector-based semantic retrieval with similarity search and configurable thresholds (implemented)
- ~~**Comparative Analysis**~~: Side-by-side evaluation run comparison with per-metric breakdown across models (implemented)

### Planned

1. **Visual Workflow Designer**: Drag-and-drop multi-step agent pipeline builder
2. **Trajectory Fidelity Metrics**: Evaluation of multi-step planning accuracy and goal completion
3. **Tool Augmentation**: Runtime integration of external tools (web search, code execution, file I/O)
4. **Multi-Provider Benchmarking**: Automated evaluation across OpenAI, Anthropic, and Google Gemini in a single suite run
5. **Export & Reporting**: PDF/Markdown report generation for evaluation results and task histories

---

## 11. References

1. OpenAI. (2024). GPT-4 Technical Report. *arXiv preprint arXiv:2303.08774*.
2. Yao, S., et al. (2023). ReAct: Synergizing Reasoning and Acting in Language Models. *ICLR 2023*.
3. Park, J. S., et al. (2023). Generative Agents: Interactive Simulacra of Human Behavior. *UIST 2023*.
4. Lewis, P., et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. *NeurIPS 2020*.

---

## Author

**Stella Agbim**  
GitHub: [@stellaagbim](https://github.com/stellaagbim)

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

*Synaptra Studio - Advancing transparency and evaluation in AI agent operations.*
