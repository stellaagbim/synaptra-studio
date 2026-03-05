from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
import uuid
import asyncio
import uvicorn
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
from openai import AsyncOpenAI
import litellm
litellm.suppress_debug_info = True
import numpy as np
import math
import re
import json as json_module
import ast
import statistics

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = "mongodb+srv://stella:Stellaisgreat1@cluster0.k7ff8ye.mongodb.net/?appName=Cluster0"
if not mongo_url:
    raise ValueError("MONGO_URL environment variable is required")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'synaptra_studio')]

# Create the main app
app = FastAPI(title="Synaptra Studio API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ ENUMS ============
class TaskType(str, Enum):
    TEXT_SUMMARIZATION = "text_summarization"
    CODE_ANALYSIS = "code_analysis"
    DOCUMENT_PROCESSING = "document_processing"
    IMAGE_ANALYSIS = "image_analysis"
    GENERAL_ANALYSIS = "general_analysis"

class TaskStatus(str, Enum):
    PENDING = "pending"
    INPUT_RECEIVED = "input_received"
    PREPROCESSING = "preprocessing"
    ANALYZING = "analyzing"
    EVALUATING = "evaluating"
    COMPLETED = "completed"
    FAILED = "failed"

class MemoryType(str, Enum):
    CONTEXT = "context"
    ARTIFACT = "artifact"
    SUMMARY = "summary"
    REFERENCE = "reference"

# ============ MODELS ============
class ToolCall(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tool_name: str
    tool_id: str = ""
    arguments: Dict[str, Any] = {}
    result: Optional[str] = None
    status: str = "pending"  # pending, running, completed, failed
    duration_ms: Optional[int] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ReasoningTrace(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    phase: str  # e.g. "preprocessing", "memory_retrieval", "analysis", "evaluation"
    action: str  # short label: "task_type_detection", "rag_query", "model_selection"
    reasoning: str  # human-readable explanation of the decision
    inputs: Dict[str, Any] = {}  # what data informed the decision
    outputs: Dict[str, Any] = {}  # what the decision produced
    confidence: Optional[float] = None  # 0-1 confidence in the decision
    duration_ms: Optional[int] = None

class ExecutionStep(BaseModel):
    step_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    status: str = "pending"
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_ms: Optional[int] = None
    details: Optional[str] = None

class EvaluationMetrics(BaseModel):
    quality_score: float = 0.0
    relevance_score: float = 0.0
    efficiency_score: float = 0.0
    plan_adherence: float = 0.0
    output_coherence: float = 0.0
    overall_score: float = 0.0

class TaskMetadata(BaseModel):
    model_used: str = "gpt-4o"
    provider: str = "openai"
    input_modality: str = "text"
    tokens_used: Optional[int] = None
    processing_time_ms: Optional[int] = None
    pipeline_steps_count: int = 0
    memory_items_created: int = 0
    retrieved_memory_ids: List[str] = []

class MemoryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    memory_type: MemoryType
    key: str
    content: str
    source: str = "system"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    retention_policy: str = "persistent"
    embedding: Optional[List[float]] = None

class MemorySearchRequest(BaseModel):
    query: str
    limit: int = 10
    threshold: float = 0.7

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_type: TaskType = TaskType.GENERAL_ANALYSIS
    status: TaskStatus = TaskStatus.PENDING
    input_text: str = ""
    input_image_base64: Optional[str] = None
    output: Optional[str] = None
    execution_steps: List[ExecutionStep] = []
    evaluation: EvaluationMetrics = Field(default_factory=EvaluationMetrics)
    metadata: TaskMetadata = Field(default_factory=TaskMetadata)
    memory_items: List[str] = []  # Memory item IDs
    artifacts: List[Dict[str, Any]] = []
    reasoning_traces: List[ReasoningTrace] = []
    tool_calls: List[ToolCall] = []
    error_message: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None
    is_eval_run: bool = False
    eval_suite_id: Optional[str] = None

class TaskCreateRequest(BaseModel):
    input_text: str
    task_type: Optional[TaskType] = None
    input_image_base64: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    task_type: TaskType
    status: TaskStatus
    input_text: str
    input_image_base64: Optional[str] = None
    output: Optional[str] = None
    execution_steps: List[ExecutionStep] = []
    evaluation: EvaluationMetrics
    metadata: TaskMetadata
    memory_items: List[str] = []
    artifacts: List[Dict[str, Any]] = []
    reasoning_traces: List[ReasoningTrace] = []
    tool_calls: List[ToolCall] = []
    error_message: Optional[str] = None
    created_at: str
    updated_at: str
    completed_at: Optional[str] = None
    is_eval_run: bool = False
    eval_suite_id: Optional[str] = None

class SystemStatus(BaseModel):
    status: str = "operational"
    ai_engine: str = "ready"
    database: str = "connected"
    memory_service: str = "active"
    eval_service: str = "active"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    version: str = "1.0.0"

# ============ EVALUATION MODELS ============
class EvalTask(BaseModel):
    input_text: str
    expected_behavior: Optional[str] = None
    task_type: TaskType = TaskType.GENERAL_ANALYSIS
    weight: float = 1.0

class EvalSuite(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    tasks: List[EvalTask] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    last_run_at: Optional[str] = None
    run_count: int = 0

class EvalRun(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    suite_id: str
    suite_name: str
    task_results: List[str] = []  # Task IDs
    aggregate_scores: EvaluationMetrics = Field(default_factory=EvaluationMetrics)
    started_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None
    status: str = "running"
    model_used: str = "gpt-4o"
    provider_used: str = "openai"
    total_tasks: int = 0
    completed_tasks: int = 0

class BenchmarkRunRequest(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None

# ============ SETTINGS MODEL ============
class SystemSettings(BaseModel):
    id: str = "system_settings"
    default_provider: str = "openai"
    default_model: str = "gpt-4o"
    enable_persistence: bool = True
    enable_memory: bool = True
    enable_artifacts: bool = True
    max_input_size: int = 50000
    theme: str = "dark"
    reduced_motion: bool = False
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============ MODEL REGISTRY ============
MODEL_REGISTRY = {
    "openai": {
        "display_name": "OpenAI",
        "models": [
            {"id": "gpt-4o", "name": "GPT-4o", "supports_vision": True},
            {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "supports_vision": True},
        ],
        "env_key": "OPENAI_API_KEY",
    },
    "gemini": {
        "display_name": "Google Gemini",
        "models": [
            {"id": "gemini/gemini-2.0-flash", "name": "Gemini 2.0 Flash", "supports_vision": True},
            {"id": "gemini/gemini-1.5-pro", "name": "Gemini 1.5 Pro", "supports_vision": True},
        ],
        "env_key": "GEMINI_API_KEY",
    },
    "anthropic": {
        "display_name": "Anthropic",
        "models": [
            {"id": "claude-sonnet-4-5-20250929", "name": "Claude Sonnet 4.5", "supports_vision": True},
            {"id": "claude-haiku-4-5-20251001", "name": "Claude Haiku 4.5", "supports_vision": True},
        ],
        "env_key": "ANTHROPIC_API_KEY",
    },
}

def get_available_providers() -> List[dict]:
    """Return providers that have valid API keys configured."""
    available = []
    for provider_id, config in MODEL_REGISTRY.items():
        has_key = bool(os.environ.get(config["env_key"]))
        available.append({
            "id": provider_id,
            "name": config["display_name"],
            "available": has_key,
            "models": config["models"],
        })
    return available

def resolve_litellm_model(provider: str, model_id: str) -> str:
    """Resolve a provider + model_id into a litellm-compatible model string."""
    # If the model_id already has a provider prefix (e.g. 'gemini/...'), use as-is
    if "/" in model_id:
        return model_id
    # OpenAI models don't need a prefix in litellm
    if provider == "openai":
        return model_id
    # Anthropic models don't need a prefix in litellm
    if provider == "anthropic":
        return model_id
    return f"{provider}/{model_id}"

# ============ AI ENGINE ============
class AIAnalysisEngine:
    def __init__(self):
        self.openai_key = os.environ.get('OPENAI_API_KEY')
        if not self.openai_key:
            logger.warning("OPENAI_API_KEY not found in environment")

    def _get_system_prompt(self, task_type: TaskType) -> str:
        prompts = {
            TaskType.TEXT_SUMMARIZATION: """You are an expert text analysis AI. Provide comprehensive text summarization and extraction.
            Structure your response with:
            1. Executive Summary (2-3 sentences)
            2. Key Points (bullet list)
            3. Main Themes
            4. Actionable Insights (if applicable)""",

            TaskType.CODE_ANALYSIS: """You are an expert code analysis AI. Analyze code thoroughly.
            Structure your response with:
            1. Code Overview & Purpose
            2. Language/Framework Detection
            3. Quality Assessment (readability, maintainability, efficiency)
            4. Potential Issues & Bugs
            5. Security Considerations
            6. Improvement Recommendations""",

            TaskType.DOCUMENT_PROCESSING: """You are an expert document processing AI.
            Structure your response with:
            1. Document Classification
            2. Structure Analysis
            3. Key Information Extraction
            4. Entities & Data Points
            5. Content Summary""",

            TaskType.IMAGE_ANALYSIS: """You are an expert image analysis AI.
            Structure your response with:
            1. Scene Description
            2. Objects & Entities Detected
            3. Text Extraction (if present)
            4. Composition Analysis
            5. Contextual Interpretation""",

            TaskType.GENERAL_ANALYSIS: """You are Synaptra, an intelligent AI analysis assistant.
            Structure your response with:
            1. Input Classification
            2. Detailed Analysis
            3. Key Insights
            4. Recommendations (if applicable)"""
        }
        return prompts.get(task_type, prompts[TaskType.GENERAL_ANALYSIS])

    async def analyze(self, task: Task, settings: SystemSettings, rag_context: str = "",
                      override_provider: str = None, override_model: str = None) -> tuple[str, dict]:
        provider = override_provider or settings.default_provider or "openai"
        model_id = override_model or settings.default_model or "gpt-4o"

        # Validate that we have the API key for the chosen provider
        provider_config = MODEL_REGISTRY.get(provider)
        if provider_config:
            env_key = provider_config["env_key"]
            if not os.environ.get(env_key):
                raise ValueError(f"{env_key} not configured for provider '{provider}'")

        system_prompt = self._get_system_prompt(task.task_type)

        if rag_context:
            system_prompt += (
                "\n\n## Relevant Context from Previous Tasks\n"
                "Use the following information from past analyses if relevant to the current task. "
                "Do not mention that you are using past context unless it directly helps the user.\n\n"
                + rag_context
            )

        litellm_model = resolve_litellm_model(provider, model_id)

        # Build messages
        messages = [{"role": "system", "content": system_prompt}]

        if task.input_image_base64:
            content = [
                {"type": "text", "text": task.input_text or "Please analyze this image."},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{task.input_image_base64}"
                    }
                }
            ]
            messages.append({"role": "user", "content": content})
        else:
            messages.append({"role": "user", "content": task.input_text})

        start_time = datetime.now(timezone.utc)

        response = await litellm.acompletion(
            model=litellm_model,
            messages=messages,
            max_tokens=4096
        )

        end_time = datetime.now(timezone.utc)
        processing_time = int((end_time - start_time).total_seconds() * 1000)

        output_text = response.choices[0].message.content

        return output_text, {
            "processing_time_ms": processing_time,
            "model": model_id,
            "provider": provider,
        }

# ============ EVALUATION ENGINE ============
class EvaluationEngine:
    STOPWORDS = frozenset({
        'the','a','an','is','are','was','were','be','been','being',
        'have','has','had','do','does','did','will','would','could',
        'should','may','might','shall','can','need','dare','ought',
        'used','to','of','in','for','on','with','at','by','from',
        'as','into','through','during','before','after','above',
        'below','between','out','off','over','under','again',
        'further','then','once','and','but','or','nor','not','so',
        'very','just','that','this','it','i','we','you','they',
        'he','she','me','him','her','us','them','my','your','its',
        'our','their','what','which','who','whom','where','when',
        'how','all','each','every','both','few','more','most','some',
        'any','no','than','too','also','here','there','if','about'
    })

    def __init__(self, embedding_service=None):
        self.embedding_service = embedding_service

    async def evaluate(self, task: Task, output: str) -> EvaluationMetrics:
        # Launch embedding-dependent metrics concurrently
        relevance_coro = self._compute_relevance(task.input_text, output)
        coherence_coro = self._compute_coherence(output)

        # Compute synchronous metrics
        quality_score = self._compute_quality(output, task.input_text)
        efficiency_score = self._compute_efficiency(task.metadata.processing_time_ms or 5000)

        completed_steps = sum(1 for s in task.execution_steps if s.status == 'completed')
        total_steps = len(task.execution_steps) or 1
        plan_adherence = (completed_steps / total_steps) * 100

        # Await embedding metrics
        relevance_score, output_coherence = await asyncio.gather(relevance_coro, coherence_coro)

        overall_score = (
            quality_score * 0.30 +
            relevance_score * 0.25 +
            efficiency_score * 0.15 +
            plan_adherence * 0.15 +
            output_coherence * 0.15
        )

        return EvaluationMetrics(
            quality_score=round(quality_score, 1),
            relevance_score=round(relevance_score, 1),
            efficiency_score=round(efficiency_score, 1),
            plan_adherence=round(plan_adherence, 1),
            output_coherence=round(output_coherence, 1),
            overall_score=round(overall_score, 1)
        )

    # ---- Relevance: Embedding-based semantic similarity ----
    async def _compute_relevance(self, input_text: str, output: str) -> float:
        if not input_text or not input_text.strip():
            return 75.0

        if self.embedding_service:
            try:
                input_emb, output_emb = await asyncio.gather(
                    self.embedding_service.generate_embedding(input_text),
                    self.embedding_service.generate_embedding(output)
                )
                if input_emb is not None and output_emb is not None:
                    raw_sim = EmbeddingService.cosine_similarity(input_emb, output_emb)
                    scaled = max(0, (raw_sim - 0.3) / 0.65) * 100
                    return min(round(scaled, 1), 100.0)
            except Exception as e:
                logger.error(f"Embedding relevance failed, using fallback: {e}")

        return self._relevance_fallback(input_text, output)

    @staticmethod
    def _relevance_fallback(input_text: str, output: str) -> float:
        input_words = set(input_text.lower().split())
        output_words = set(output.lower().split())
        overlap = len(input_words & output_words)
        return min((overlap / max(len(input_words), 1)) * 100, 100.0)

    # ---- Quality: Multi-factor computational analysis ----
    @staticmethod
    def _compute_quality(output: str, input_text: str) -> float:
        if not output or not output.strip():
            return 0.0

        words = output.split()
        word_count = len(words)
        if word_count == 0:
            return 0.0

        # 1. Vocabulary richness (TTR over first 200 words)
        sample = words[:200]
        unique_ratio = len(set(w.lower() for w in sample)) / len(sample)
        ttr_score = min(unique_ratio / 0.7, 1.0) * 25

        # 2. Structural completeness
        has_headings = any(m in output for m in ['# ', '## ', '### ', '**'])
        has_lists = any(m in output for m in ['- ', '* ', '1. ', '2. '])
        has_paragraphs = output.count('\n\n') >= 2
        has_code_blocks = '```' in output
        structure_score = (
            (7 if has_headings else 0) +
            (6 if has_lists else 0) +
            (6 if has_paragraphs else 0) +
            (6 if has_code_blocks else 0)
        )

        # 3. Information density (non-stopword ratio)
        content_words = [w for w in words if w.lower() not in EvaluationEngine.STOPWORDS and len(w) > 2]
        density = len(content_words) / word_count
        density_score = min(density / 0.55, 1.0) * 25

        # 4. Output depth relative to input
        input_words_count = len(input_text.split()) if input_text else 1
        depth_ratio = word_count / max(input_words_count, 1)
        if depth_ratio < 1:
            depth_score = depth_ratio * 10
        elif depth_ratio < 3:
            depth_score = 10 + (depth_ratio - 1) * 7.5
        elif depth_ratio <= 20:
            depth_score = 25
        else:
            depth_score = max(25 - (depth_ratio - 20) * 0.5, 15)

        total = ttr_score + structure_score + density_score + depth_score
        return min(total, 100.0)

    # ---- Coherence: Embedding-based paragraph flow ----
    async def _compute_coherence(self, output: str) -> float:
        paragraphs = [p.strip() for p in output.split('\n\n') if p.strip() and len(p.strip()) > 20]

        if len(paragraphs) < 2:
            return self._coherence_fallback(output)

        chunks = paragraphs[:8]

        if self.embedding_service:
            try:
                embedding_tasks = [self.embedding_service.generate_embedding(chunk) for chunk in chunks]
                embeddings = await asyncio.gather(*embedding_tasks)

                valid_pairs = []
                for i in range(len(embeddings) - 1):
                    if embeddings[i] is not None and embeddings[i + 1] is not None:
                        sim = EmbeddingService.cosine_similarity(embeddings[i], embeddings[i + 1])
                        valid_pairs.append(sim)

                if valid_pairs:
                    avg_sim = sum(valid_pairs) / len(valid_pairs)
                    embedding_coherence = max(0, (avg_sim - 0.4) / 0.5) * 70
                    structure_component = self._sentence_variance_score(output)
                    return min(round(embedding_coherence + structure_component, 1), 100.0)
            except Exception as e:
                logger.error(f"Embedding coherence failed, using fallback: {e}")

        return self._coherence_fallback(output)

    @staticmethod
    def _sentence_variance_score(output: str) -> float:
        sentences = [s.strip() for s in output.replace('!', '.').replace('?', '.').split('.') if s.strip()]
        if len(sentences) < 2:
            return 15.0
        lengths = [len(s.split()) for s in sentences]
        avg_len = sum(lengths) / len(lengths)
        variance = sum((l - avg_len) ** 2 for l in lengths) / len(lengths)
        std_dev = variance ** 0.5
        if 3 <= std_dev <= 10:
            return 30.0
        elif std_dev < 3:
            return std_dev * 10
        else:
            return max(30 - (std_dev - 10) * 2, 10)

    @staticmethod
    def _coherence_fallback(output: str) -> float:
        sentences = [s.strip() for s in output.split('.') if s.strip()]
        if not sentences:
            return 50.0
        avg_len = sum(len(s.split()) for s in sentences) / len(sentences)
        if 5 < avg_len < 30:
            return min(100, 50 + (avg_len * 2))
        return 60.0

    # ---- Efficiency: Smooth logarithmic curve ----
    @staticmethod
    def _compute_efficiency(processing_time_ms: int) -> float:
        if processing_time_ms <= 0:
            return 95.0
        score = 100 - 15 * math.log2(max(processing_time_ms, 500) / 500)
        return max(min(round(score, 1), 100.0), 20.0)

# ============ TOOL EXECUTOR ============
class ToolExecutor:
    """Executes registered tools based on heuristic routing.

    Implements a ReAct-inspired pattern: the orchestrator decides which tools
    to invoke based on input analysis, executes them, and injects results
    into the LLM prompt for augmented generation.
    """

    BUILTIN_TOOLS = {
        "calculator": {
            "name": "Calculator",
            "description": "Evaluates mathematical expressions and statistical operations",
            "category": "utility",
        },
        "code_analyzer": {
            "name": "Code Analyzer",
            "description": "Performs static analysis on code: complexity, structure, metrics",
            "category": "code",
        },
        "text_stats": {
            "name": "Text Statistics",
            "description": "Computes readability scores, word frequency, and text metrics",
            "category": "data",
        },
        "datetime_tool": {
            "name": "DateTime Tool",
            "description": "Provides current date/time, timezone conversions, and date arithmetic",
            "category": "utility",
        },
        "json_validator": {
            "name": "JSON Validator",
            "description": "Validates and formats JSON data, extracts schema information",
            "category": "data",
        },
    }

    def route_tools(self, task: Task) -> List[str]:
        """Heuristic router: determines which tools should run based on input analysis.
        Returns a list of tool keys to execute. No LLM calls — pure pattern matching."""
        selected = []
        text = task.input_text.lower()

        # Calculator: detect mathematical expressions or computation requests
        math_patterns = [
            r'\d+\s*[\+\-\*\/\%\^]\s*\d+',  # 5 + 3, 10 * 2
            r'\b(calculate|compute|solve|evaluate|math|sum|average|mean|median|sqrt)\b',
            r'\b(factorial|fibonacci|prime|gcd|lcm)\b',
        ]
        if any(re.search(p, text) for p in math_patterns):
            selected.append("calculator")

        # Code Analyzer: detect code snippets
        code_signals = ['def ', 'function ', 'class ', 'import ', 'const ', 'let ',
                        'var ', '=>', 'return ', 'if (', 'for (', 'while (', 'try:',
                        'except:', 'catch(', 'async ', '#!/']
        code_hits = sum(1 for s in code_signals if s in task.input_text)
        if code_hits >= 2:
            selected.append("code_analyzer")

        # Text Stats: detect text analysis requests or long-form text
        text_analysis_keywords = ['readability', 'word count', 'word frequency',
                                  'text analysis', 'flesch', 'lexical', 'vocabulary',
                                  'sentiment', 'statistics']
        word_count = len(task.input_text.split())
        if any(k in text for k in text_analysis_keywords) or word_count > 200:
            selected.append("text_stats")

        # DateTime: detect time/date references
        datetime_patterns = [
            r'\b(today|tomorrow|yesterday|now|current time|current date)\b',
            r'\b(timezone|utc|gmt|est|pst|cst)\b',
            r'\b(days? (from|until|since|between|ago))\b',
            r'\b(date|time|schedule|deadline|duration)\b',
        ]
        if any(re.search(p, text) for p in datetime_patterns):
            selected.append("datetime_tool")

        # JSON Validator: detect JSON content
        if '{' in task.input_text and '}' in task.input_text:
            try:
                # Check if input contains parseable JSON
                json_start = task.input_text.index('{')
                json_end = task.input_text.rindex('}') + 1
                candidate = task.input_text[json_start:json_end]
                json_module.loads(candidate)
                selected.append("json_validator")
            except (ValueError, json_module.JSONDecodeError):
                pass

        return selected

    async def execute_tool(self, tool_key: str, task: Task) -> ToolCall:
        """Execute a single tool and return a ToolCall record."""
        tool_info = self.BUILTIN_TOOLS.get(tool_key, {})
        tool_call = ToolCall(
            tool_name=tool_info.get("name", tool_key),
            tool_id=tool_key,
            arguments={"input_text": task.input_text[:500]},
            status="running"
        )

        start = datetime.now(timezone.utc)
        try:
            if tool_key == "calculator":
                result = self._run_calculator(task.input_text)
            elif tool_key == "code_analyzer":
                result = self._run_code_analyzer(task.input_text)
            elif tool_key == "text_stats":
                result = self._run_text_stats(task.input_text)
            elif tool_key == "datetime_tool":
                result = self._run_datetime_tool(task.input_text)
            elif tool_key == "json_validator":
                result = self._run_json_validator(task.input_text)
            else:
                result = f"Unknown tool: {tool_key}"

            tool_call.result = result
            tool_call.status = "completed"
        except Exception as e:
            tool_call.result = f"Tool error: {str(e)[:300]}"
            tool_call.status = "failed"

        elapsed = int((datetime.now(timezone.utc) - start).total_seconds() * 1000)
        tool_call.duration_ms = elapsed

        # Increment invocation count in DB (fire-and-forget)
        try:
            await db.tools.update_one(
                {"name": tool_info.get("name", tool_key)},
                {"$inc": {"invocation_count": 1}}
            )
        except Exception:
            pass

        return tool_call

    async def execute_tools(self, tool_keys: List[str], task: Task) -> List[ToolCall]:
        """Execute multiple tools concurrently."""
        if not tool_keys:
            return []
        coros = [self.execute_tool(key, task) for key in tool_keys]
        return await asyncio.gather(*coros)

    @staticmethod
    def format_tool_context(tool_calls: List[ToolCall]) -> str:
        """Format completed tool results into a prompt context block."""
        completed = [tc for tc in tool_calls if tc.status == "completed" and tc.result]
        if not completed:
            return ""

        parts = ["## Tool Execution Results",
                  "The following tools were executed on the input. Use these results to augment your analysis.\n"]
        for tc in completed:
            parts.append(f"### {tc.tool_name} ({tc.duration_ms}ms)")
            parts.append(tc.result)
            parts.append("")
        return "\n".join(parts)

    # ---- Built-in Tool Implementations ----

    @staticmethod
    def _run_calculator(text: str) -> str:
        """Extract and evaluate mathematical expressions from the input."""
        results = []

        # Find and evaluate mathematical expressions
        expr_patterns = re.findall(r'(\d+(?:\.\d+)?(?:\s*[\+\-\*\/\%\*\*]\s*\d+(?:\.\d+)?)+)', text)
        for expr in expr_patterns[:5]:  # Limit to 5 expressions
            try:
                # Sanitize: only allow digits, operators, whitespace, decimal points
                clean = re.sub(r'[^\d\+\-\*\/\%\.\(\)\s]', '', expr)
                if clean.strip():
                    val = eval(clean, {"__builtins__": {}}, {})  # nosec - sandboxed eval
                    results.append(f"  {clean.strip()} = {val}")
            except Exception:
                pass

        # Check for statistical operations
        numbers = [float(x) for x in re.findall(r'-?\d+\.?\d*', text)]
        if len(numbers) >= 3:
            results.append(f"\nDetected {len(numbers)} numeric values:")
            results.append(f"  Sum: {sum(numbers):.4g}")
            results.append(f"  Mean: {statistics.mean(numbers):.4g}")
            results.append(f"  Median: {statistics.median(numbers):.4g}")
            if len(numbers) >= 2:
                results.append(f"  Std Dev: {statistics.stdev(numbers):.4g}")
            results.append(f"  Min: {min(numbers):.4g}, Max: {max(numbers):.4g}")

        if not results:
            return "No evaluable mathematical expressions found in the input."
        return "Mathematical analysis:\n" + "\n".join(results)

    @staticmethod
    def _run_code_analyzer(text: str) -> str:
        """Static analysis on code: line count, complexity heuristics, structure."""
        lines = text.split('\n')
        total_lines = len(lines)
        code_lines = [l for l in lines if l.strip() and not l.strip().startswith('#') and not l.strip().startswith('//')]
        blank_lines = [l for l in lines if not l.strip()]
        comment_lines = [l for l in lines if l.strip().startswith('#') or l.strip().startswith('//')]

        # Function/class detection
        functions = re.findall(r'\b(?:def|function|const\s+\w+\s*=\s*(?:\([^)]*\)|[^=])*=>)\s+(\w+)', text)
        classes = re.findall(r'\bclass\s+(\w+)', text)
        imports = re.findall(r'(?:import|from|require)\s+([^\n;]+)', text)

        # Cyclomatic complexity estimate (branches)
        branches = sum(1 for l in lines for kw in ['if ', 'elif ', 'else:', 'for ', 'while ',
                                                     'catch', 'case ', 'except:', '? ']
                       if kw in l)
        nesting_max = max((len(l) - len(l.lstrip())) // 4 for l in code_lines) if code_lines else 0

        result_parts = [
            "Code Structure Analysis:",
            f"  Total lines: {total_lines} (code: {len(code_lines)}, blank: {len(blank_lines)}, comments: {len(comment_lines)})",
            f"  Functions found: {len(functions)}" + (f" — {', '.join(functions[:8])}" if functions else ""),
            f"  Classes found: {len(classes)}" + (f" — {', '.join(classes[:5])}" if classes else ""),
            f"  Import statements: {len(imports)}",
            f"  Branch points: {branches} (estimated cyclomatic complexity: {branches + 1})",
            f"  Max nesting depth: {nesting_max} levels",
        ]

        # Detect language
        lang = "unknown"
        if 'def ' in text and ':' in text:
            lang = "Python"
        elif 'function ' in text or '=>' in text:
            lang = "JavaScript/TypeScript"
        elif 'public class' in text or 'void ' in text:
            lang = "Java/C#"
        elif '#include' in text:
            lang = "C/C++"
        elif 'fn ' in text and '->' in text:
            lang = "Rust"
        result_parts.insert(1, f"  Detected language: {lang}")

        return "\n".join(result_parts)

    @staticmethod
    def _run_text_stats(text: str) -> str:
        """Compute readability scores and text statistics."""
        words = text.split()
        word_count = len(words)
        char_count = len(text)
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
        sentence_count = max(len(sentences), 1)
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]

        # Syllable estimation (rough)
        def count_syllables(word):
            word = word.lower().rstrip('e')
            count = len(re.findall(r'[aeiouy]+', word))
            return max(count, 1)

        total_syllables = sum(count_syllables(w) for w in words) if words else 0
        avg_syllables = total_syllables / max(word_count, 1)

        # Flesch Reading Ease
        asl = word_count / sentence_count  # average sentence length
        asw = total_syllables / max(word_count, 1)  # average syllables per word
        flesch = 206.835 - (1.015 * asl) - (84.6 * asw)
        flesch = max(0, min(100, flesch))

        # Flesch-Kincaid Grade Level
        fk_grade = (0.39 * asl) + (11.8 * asw) - 15.59

        # Vocabulary richness
        unique_words = len(set(w.lower() for w in words))
        ttr = unique_words / max(word_count, 1)

        # Word frequency (top 10)
        stopwords = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
                     'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
                     'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
                     'and', 'but', 'or', 'not', 'it', 'i', 'we', 'you', 'they',
                     'that', 'this', 'he', 'she', 'as', 'if', 'so', 'my', 'your'}
        content_words = [w.lower().strip('.,!?;:()[]{}"\'-') for w in words
                         if w.lower().strip('.,!?;:()[]{}"\'-') not in stopwords and len(w) > 2]
        freq = {}
        for w in content_words:
            freq[w] = freq.get(w, 0) + 1
        top_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:10]

        result_parts = [
            "Text Statistics:",
            f"  Words: {word_count} | Characters: {char_count} | Sentences: {sentence_count} | Paragraphs: {len(paragraphs)}",
            f"  Avg sentence length: {asl:.1f} words | Avg syllables/word: {avg_syllables:.2f}",
            f"  Flesch Reading Ease: {flesch:.1f}/100 ({'Very Easy' if flesch > 80 else 'Easy' if flesch > 60 else 'Standard' if flesch > 40 else 'Difficult' if flesch > 20 else 'Very Difficult'})",
            f"  Flesch-Kincaid Grade: {fk_grade:.1f}",
            f"  Vocabulary richness (TTR): {ttr:.3f} ({unique_words} unique / {word_count} total)",
        ]
        if top_words:
            freq_str = ", ".join(f"{w}({c})" for w, c in top_words)
            result_parts.append(f"  Top content words: {freq_str}")

        return "\n".join(result_parts)

    @staticmethod
    def _run_datetime_tool(text: str) -> str:
        """Provide current date/time information and basic date analysis."""
        now = datetime.now(timezone.utc)
        parts = [
            "DateTime Information:",
            f"  Current UTC: {now.strftime('%Y-%m-%d %H:%M:%S %Z')}",
            f"  ISO 8601: {now.isoformat()}",
            f"  Unix timestamp: {int(now.timestamp())}",
            f"  Day of week: {now.strftime('%A')}",
            f"  Week number: {now.isocalendar()[1]}",
        ]

        # Try to find dates in text and compute diffs
        date_patterns = re.findall(r'\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b', text)
        for dp in date_patterns[:3]:
            try:
                parsed = datetime.strptime(dp.replace('/', '-'), '%Y-%m-%d').replace(tzinfo=timezone.utc)
                delta = now - parsed
                direction = "ago" if delta.days >= 0 else "from now"
                parts.append(f"  Date '{dp}': {abs(delta.days)} days {direction}")
            except ValueError:
                pass

        return "\n".join(parts)

    @staticmethod
    def _run_json_validator(text: str) -> str:
        """Validate JSON content and extract schema information."""
        # Find JSON in the input
        try:
            json_start = text.index('{')
            json_end = text.rindex('}') + 1
            candidate = text[json_start:json_end]
            parsed = json_module.loads(candidate)
        except (ValueError, json_module.JSONDecodeError) as e:
            # Try array
            try:
                json_start = text.index('[')
                json_end = text.rindex(']') + 1
                candidate = text[json_start:json_end]
                parsed = json_module.loads(candidate)
            except (ValueError, json_module.JSONDecodeError):
                return f"JSON Validation: Invalid JSON detected. Error: {str(e)[:200]}"

        def describe_schema(obj, depth=0):
            if depth > 4:
                return "..."
            if isinstance(obj, dict):
                fields = []
                for k, v in list(obj.items())[:20]:
                    fields.append(f"    {'  ' * depth}{k}: {describe_schema(v, depth + 1)}")
                return "object {\n" + "\n".join(fields) + "\n" + "  " * depth + "  }"
            elif isinstance(obj, list):
                if obj:
                    return f"array[{len(obj)}] of {describe_schema(obj[0], depth + 1)}"
                return "array[0]"
            else:
                return type(obj).__name__

        schema = describe_schema(parsed)
        key_count = len(parsed) if isinstance(parsed, dict) else len(parsed) if isinstance(parsed, list) else 1

        parts = [
            "JSON Validation: Valid",
            f"  Type: {'object' if isinstance(parsed, dict) else 'array' if isinstance(parsed, list) else type(parsed).__name__}",
            f"  Top-level elements: {key_count}",
            f"  Size: {len(candidate)} characters",
            f"  Schema:\n{schema}",
        ]
        return "\n".join(parts)


# ============ MEMORY SERVICE ============
class MemoryService:
    embedding_service = None

    @classmethod
    def _get_embedding_service(cls):
        if cls.embedding_service is None:
            cls.embedding_service = EmbeddingService()
        return cls.embedding_service

    @staticmethod
    async def create_memory_item(task_id: str, memory_type: MemoryType, key: str, content: str, source: str = "system") -> MemoryItem:
        embedding = None
        try:
            svc = MemoryService._get_embedding_service()
            embedding = await svc.generate_embedding(content)
        except Exception as e:
            logger.error(f"Embedding generation failed during memory creation: {e}")

        item = MemoryItem(
            task_id=task_id,
            memory_type=memory_type,
            key=key,
            content=content,
            source=source,
            embedding=embedding
        )
        await db.memory.insert_one(item.model_dump())
        return item

    @staticmethod
    async def get_memory_items(task_id: Optional[str] = None, memory_type: Optional[MemoryType] = None, limit: int = 100) -> List[dict]:
        query = {}
        if task_id:
            query["task_id"] = task_id
        if memory_type:
            query["memory_type"] = memory_type.value

        items = await db.memory.find(query, {"_id": 0, "embedding": 0}).sort("created_at", -1).limit(limit).to_list(limit)
        return items
    
    @staticmethod
    async def delete_memory_item(item_id: str) -> bool:
        result = await db.memory.delete_one({"id": item_id})
        return result.deleted_count > 0

# ============ EMBEDDING SERVICE ============
class EmbeddingService:
    def __init__(self):
        self.api_key = os.environ.get('OPENAI_API_KEY')
        self.model = "text-embedding-3-small"

    async def generate_embedding(self, text: str) -> Optional[List[float]]:
        if not self.api_key:
            logger.warning("OPENAI_API_KEY not set, skipping embedding generation")
            return None
        try:
            client = AsyncOpenAI(api_key=self.api_key)
            truncated = text[:32000]
            response = await client.embeddings.create(
                model=self.model,
                input=truncated
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            return None

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        a = np.array(vec_a)
        b = np.array(vec_b)
        dot = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(dot / (norm_a * norm_b))

    async def semantic_search(self, query: str, limit: int = 10, threshold: float = 0.7) -> List[dict]:
        query_embedding = await self.generate_embedding(query)
        if query_embedding is None:
            return []

        items = await db.memory.find(
            {"embedding": {"$exists": True, "$ne": None}},
            {"_id": 0}
        ).to_list(1000)

        results = []
        for item in items:
            item_embedding = item.get("embedding")
            if not item_embedding:
                continue
            similarity = self.cosine_similarity(query_embedding, item_embedding)
            if similarity >= threshold:
                item_copy = {k: v for k, v in item.items() if k != "embedding"}
                results.append({"item": item_copy, "similarity": round(similarity, 4)})

        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:limit]

# ============ TASK ORCHESTRATOR ============
class TaskOrchestrator:
    def __init__(self):
        self.ai_engine = AIAnalysisEngine()
        self.evaluation_engine = EvaluationEngine(MemoryService._get_embedding_service())
        self.memory_service = MemoryService()

    def _create_execution_steps(self) -> List[ExecutionStep]:
        return [
            ExecutionStep(name="Input Reception", status="pending"),
            ExecutionStep(name="Preprocessing", status="pending"),
            ExecutionStep(name="Memory Retrieval", status="pending"),
            ExecutionStep(name="AI Analysis", status="pending"),
            ExecutionStep(name="Evaluation", status="pending"),
            ExecutionStep(name="Output Generation", status="pending")
        ]

    def _trace(self, task: Task, phase: str, action: str, reasoning: str,
               inputs: Dict[str, Any] = None, outputs: Dict[str, Any] = None,
               confidence: float = None, duration_ms: int = None):
        """Append a reasoning trace entry to the task's trace log."""
        trace = ReasoningTrace(
            phase=phase,
            action=action,
            reasoning=reasoning,
            inputs=inputs or {},
            outputs=outputs or {},
            confidence=confidence,
            duration_ms=duration_ms
        )
        task.reasoning_traces.append(trace)

    async def _update_step(self, task: Task, step_index: int, status: str, details: str = None) -> Task:
        now = datetime.now(timezone.utc).isoformat()
        step = task.execution_steps[step_index]

        if status == "running" and step.started_at is None:
            step.started_at = now
        elif status == "completed":
            step.completed_at = now
            if step.started_at:
                start = datetime.fromisoformat(step.started_at)
                end = datetime.fromisoformat(now)
                step.duration_ms = int((end - start).total_seconds() * 1000)

        step.status = status
        if details:
            step.details = details

        task.updated_at = now
        await self._persist_task(task)
        return task

    async def _persist_task(self, task: Task):
        doc = task.model_dump()
        await db.tasks.update_one(
            {"id": task.id},
            {"$set": doc},
            upsert=True
        )

    def _detect_task_type(self, input_text: str, has_image: bool) -> tuple:
        """Returns (TaskType, reasoning_str, matched_indicators, confidence)."""
        if has_image:
            return (TaskType.IMAGE_ANALYSIS, "Image attachment detected — routing to vision pipeline",
                    ["image_present"], 0.98)

        text_lower = input_text.lower()

        code_indicators = ['def ', 'function ', 'class ', 'import ', 'const ', 'let ', 'var ', '{', '}', '();', '=>', 'return ']
        code_matches = [i.strip() for i in code_indicators if i in input_text]
        if len(code_matches) >= 2:
            return (TaskType.CODE_ANALYSIS,
                    f"Detected {len(code_matches)} code syntax indicators — classifying as code analysis",
                    code_matches, min(0.6 + len(code_matches) * 0.08, 0.98))

        summarize_indicators = ['summarize', 'summary', 'brief', 'overview', 'key points', 'main idea', 'tldr']
        summ_matches = [i for i in summarize_indicators if i in text_lower]
        if summ_matches:
            return (TaskType.TEXT_SUMMARIZATION,
                    f"Matched summarization keywords: {', '.join(summ_matches)}",
                    summ_matches, 0.85)

        doc_indicators = ['document', 'report', 'extract', 'parse', 'data', 'table', 'form']
        doc_matches = [i for i in doc_indicators if i in text_lower]
        if doc_matches:
            return (TaskType.DOCUMENT_PROCESSING,
                    f"Matched document processing keywords: {', '.join(doc_matches)}",
                    doc_matches, 0.80)

        return (TaskType.GENERAL_ANALYSIS,
                "No domain-specific indicators detected — defaulting to general analysis",
                [], 0.50)

    async def _get_settings(self) -> SystemSettings:
        settings_doc = await db.settings.find_one({"id": "system_settings"}, {"_id": 0})
        if settings_doc:
            return SystemSettings(**settings_doc)
        return SystemSettings()

    async def execute(self, task: Task, override_provider: str = None, override_model: str = None) -> Task:
        try:
            settings = await self._get_settings()

            # Initialize
            task.execution_steps = self._create_execution_steps()
            task.reasoning_traces = []
            task.status = TaskStatus.INPUT_RECEIVED
            task.metadata.pipeline_steps_count = len(task.execution_steps)

            # Step 1: Input Reception
            task = await self._update_step(task, 0, "running", "Receiving and validating input")
            await asyncio.sleep(0.05)
            input_size = len(task.input_text) + (len(task.input_image_base64 or "") // 1000)
            has_image = task.input_image_base64 is not None
            word_count = len(task.input_text.split())

            self._trace(task, "input_reception", "input_validation",
                        f"Received input with {word_count} words ({input_size} units). "
                        f"Image attached: {'yes' if has_image else 'no'}.",
                        inputs={"text_length": len(task.input_text), "has_image": has_image, "word_count": word_count},
                        outputs={"input_size_units": input_size, "modality": "multimodal" if has_image else "text"},
                        confidence=1.0)

            task = await self._update_step(task, 0, "completed", f"Input validated: {input_size} units")

            # Step 2: Preprocessing — Task Type Detection
            task.status = TaskStatus.PREPROCESSING
            task = await self._update_step(task, 1, "running", "Preprocessing input data")

            original_type = task.task_type.value
            if task.task_type == TaskType.GENERAL_ANALYSIS:
                detected_type, detection_reasoning, matched, detection_confidence = self._detect_task_type(
                    task.input_text, has_image
                )
                task.task_type = detected_type

                self._trace(task, "preprocessing", "task_type_detection",
                            detection_reasoning,
                            inputs={"original_type": original_type, "input_preview": task.input_text[:150]},
                            outputs={"detected_type": detected_type.value, "matched_indicators": matched},
                            confidence=detection_confidence)
            else:
                self._trace(task, "preprocessing", "task_type_detection",
                            f"Task type explicitly set to '{original_type}' — skipping auto-detection.",
                            inputs={"original_type": original_type},
                            outputs={"detected_type": original_type},
                            confidence=1.0)

            task.metadata.input_modality = "multimodal" if has_image else "text"

            self._trace(task, "preprocessing", "modality_classification",
                        f"Input classified as {'multimodal (text + image)' if has_image else 'text-only'}.",
                        inputs={"has_image": has_image},
                        outputs={"modality": task.metadata.input_modality},
                        confidence=1.0)

            await asyncio.sleep(0.05)
            task = await self._update_step(task, 1, "completed", f"Task type: {task.task_type.value}")

            # Step 3: Memory Retrieval (RAG)
            rag_context = ""
            if settings.enable_memory:
                task = await self._update_step(task, 2, "running", "Searching semantic memory")
                try:
                    retrieval_start = datetime.now(timezone.utc)
                    embedding_svc = MemoryService._get_embedding_service()
                    results = await embedding_svc.semantic_search(
                        query=task.input_text, limit=5, threshold=0.7
                    )
                    retrieval_ms = int((datetime.now(timezone.utc) - retrieval_start).total_seconds() * 1000)

                    if results:
                        retrieved_ids = [r["item"]["id"] for r in results]
                        task.metadata.retrieved_memory_ids = retrieved_ids
                        similarities = [r["similarity"] for r in results]

                        context_parts = []
                        for r in results:
                            context_parts.append(
                                f"[Memory {r['item']['memory_type']} | similarity: {r['similarity']}]\n{r['item']['content']}"
                            )
                        rag_context = "\n\n---\n\n".join(context_parts)

                        self._trace(task, "memory_retrieval", "rag_search",
                                    f"Semantic search returned {len(results)} memories above threshold 0.7. "
                                    f"Similarity range: [{min(similarities):.4f}, {max(similarities):.4f}]. "
                                    f"Injecting {len(rag_context)} characters of context into system prompt.",
                                    inputs={"query_preview": task.input_text[:100], "threshold": 0.7, "limit": 5},
                                    outputs={"retrieved_count": len(results), "memory_ids": retrieved_ids,
                                             "similarity_range": [min(similarities), max(similarities)],
                                             "context_length": len(rag_context)},
                                    confidence=max(similarities),
                                    duration_ms=retrieval_ms)

                        task = await self._update_step(
                            task, 2, "completed",
                            f"Retrieved {len(results)} relevant memories (best: {results[0]['similarity']})"
                        )
                    else:
                        self._trace(task, "memory_retrieval", "rag_search",
                                    "No memories exceeded the similarity threshold of 0.7. "
                                    "Proceeding without RAG context augmentation.",
                                    inputs={"query_preview": task.input_text[:100], "threshold": 0.7},
                                    outputs={"retrieved_count": 0},
                                    confidence=0.0,
                                    duration_ms=retrieval_ms)
                        task = await self._update_step(task, 2, "completed", "No relevant memories found")
                except Exception as e:
                    logger.error(f"Memory retrieval failed: {e}")
                    self._trace(task, "memory_retrieval", "rag_search_error",
                                f"Memory retrieval failed: {str(e)[:200]}. Continuing without RAG context.",
                                inputs={"error": str(e)[:200]},
                                outputs={"retrieved_count": 0},
                                confidence=0.0)
                    task = await self._update_step(task, 2, "completed", f"Memory retrieval skipped: {str(e)[:100]}")
            else:
                self._trace(task, "memory_retrieval", "rag_disabled",
                            "Memory/RAG is disabled in system settings. Skipping retrieval.",
                            inputs={"enable_memory": False},
                            outputs={"retrieved_count": 0})
                task = await self._update_step(task, 2, "completed", "Memory disabled in settings")

            # Step 4: AI Analysis — Model Selection & Execution
            active_model = override_model or settings.default_model
            active_provider = override_provider or settings.default_provider
            litellm_model = resolve_litellm_model(active_provider, active_model)

            self._trace(task, "analysis", "model_selection",
                        f"Selected {active_model} from {active_provider} "
                        f"(litellm identifier: '{litellm_model}'). "
                        f"{'Override specified by eval run.' if override_model else 'Using system default from settings.'}",
                        inputs={"settings_provider": settings.default_provider,
                                "settings_model": settings.default_model,
                                "override_provider": override_provider,
                                "override_model": override_model},
                        outputs={"active_provider": active_provider, "active_model": active_model,
                                 "litellm_model": litellm_model,
                                 "has_rag_context": bool(rag_context)},
                        confidence=1.0)

            task.status = TaskStatus.ANALYZING
            task = await self._update_step(task, 3, "running", f"Executing {active_model} ({active_provider}) analysis")

            output, metrics = await self.ai_engine.analyze(
                task, settings, rag_context=rag_context,
                override_provider=override_provider, override_model=override_model
            )
            task.output = output
            task.metadata.processing_time_ms = metrics.get("processing_time_ms")
            task.metadata.model_used = metrics.get("model", "gpt-4o")
            task.metadata.provider = metrics.get("provider", "openai")

            output_words = len(output.split())
            self._trace(task, "analysis", "llm_completion",
                        f"LLM returned {output_words} words in {task.metadata.processing_time_ms}ms. "
                        f"Response-to-input ratio: {output_words / max(word_count, 1):.1f}x.",
                        inputs={"model": active_model, "provider": active_provider,
                                "input_words": word_count, "rag_context_length": len(rag_context)},
                        outputs={"output_words": output_words, "processing_time_ms": task.metadata.processing_time_ms,
                                 "expansion_ratio": round(output_words / max(word_count, 1), 2)},
                        duration_ms=task.metadata.processing_time_ms)

            task = await self._update_step(task, 3, "completed", f"Analysis completed in {task.metadata.processing_time_ms}ms")

            # Step 5: Evaluation
            task.status = TaskStatus.EVALUATING
            task = await self._update_step(task, 4, "running", "Computing evaluation metrics")

            eval_start = datetime.now(timezone.utc)
            task.evaluation = await self.evaluation_engine.evaluate(task, output)
            eval_ms = int((datetime.now(timezone.utc) - eval_start).total_seconds() * 1000)

            e = task.evaluation
            self._trace(task, "evaluation", "metric_computation",
                        f"Computed 5 evaluation dimensions. Overall score: {e.overall_score}. "
                        f"Strongest: {max([(e.quality_score, 'quality'), (e.relevance_score, 'relevance'), (e.efficiency_score, 'efficiency'), (e.plan_adherence, 'plan_adherence'), (e.output_coherence, 'coherence')], key=lambda x: x[0])[1]} "
                        f"({max(e.quality_score, e.relevance_score, e.efficiency_score, e.plan_adherence, e.output_coherence):.1f}). "
                        f"Weakest: {min([(e.quality_score, 'quality'), (e.relevance_score, 'relevance'), (e.efficiency_score, 'efficiency'), (e.plan_adherence, 'plan_adherence'), (e.output_coherence, 'coherence')], key=lambda x: x[0])[1]} "
                        f"({min(e.quality_score, e.relevance_score, e.efficiency_score, e.plan_adherence, e.output_coherence):.1f}).",
                        inputs={"output_words": output_words, "processing_time_ms": task.metadata.processing_time_ms},
                        outputs={"quality": e.quality_score, "relevance": e.relevance_score,
                                 "efficiency": e.efficiency_score, "plan_adherence": e.plan_adherence,
                                 "coherence": e.output_coherence, "overall": e.overall_score,
                                 "weights": "Q30 R25 E15 P15 C15"},
                        confidence=e.overall_score / 100,
                        duration_ms=eval_ms)

            await asyncio.sleep(0.05)
            task = await self._update_step(task, 4, "completed", f"Overall score: {task.evaluation.overall_score}")

            # Step 6: Output Generation & Memory Storage
            task = await self._update_step(task, 5, "running", "Generating output and storing memory")

            if settings.enable_memory:
                summary_item = await self.memory_service.create_memory_item(
                    task_id=task.id,
                    memory_type=MemoryType.SUMMARY,
                    key=f"task_{task.id[:8]}_summary",
                    content=output,
                    source="ai_analysis"
                )
                task.memory_items.append(summary_item.id)

                context_item = await self.memory_service.create_memory_item(
                    task_id=task.id,
                    memory_type=MemoryType.CONTEXT,
                    key=f"task_{task.id[:8]}_input",
                    content=task.input_text,
                    source="user_input"
                )
                task.memory_items.append(context_item.id)
                task.metadata.memory_items_created = 2

                self._trace(task, "output_generation", "memory_storage",
                            f"Stored 2 memory items: 1 summary (from AI output) and 1 context (from user input). "
                            f"Both items embedded for future semantic retrieval.",
                            inputs={"enable_memory": True},
                            outputs={"items_created": 2, "summary_id": summary_item.id, "context_id": context_item.id})
            else:
                self._trace(task, "output_generation", "memory_storage",
                            "Memory storage skipped — disabled in settings.",
                            inputs={"enable_memory": False},
                            outputs={"items_created": 0})

            await asyncio.sleep(0.05)
            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.now(timezone.utc).isoformat()

            self._trace(task, "output_generation", "task_completion",
                        f"Task completed successfully with {len(task.reasoning_traces)} reasoning traces logged. "
                        f"Final score: {task.evaluation.overall_score}.",
                        outputs={"total_traces": len(task.reasoning_traces) + 1,
                                 "final_status": "completed", "overall_score": task.evaluation.overall_score})

            task = await self._update_step(task, 5, "completed", f"Task completed, {task.metadata.memory_items_created} memory items created")

            return task

        except Exception as e:
            logger.error(f"Task execution failed: {str(e)}")
            task.status = TaskStatus.FAILED
            task.error_message = str(e)
            task.updated_at = datetime.now(timezone.utc).isoformat()

            self._trace(task, "error", "execution_failure",
                        f"Pipeline failed: {str(e)[:300]}",
                        inputs={"error_type": type(e).__name__},
                        outputs={"error_message": str(e)[:300]},
                        confidence=0.0)

            for step in task.execution_steps:
                if step.status == "running":
                    step.status = "failed"
                    step.details = str(e)
                    step.completed_at = datetime.now(timezone.utc).isoformat()
                    break

            await self._persist_task(task)
            return task

# Initialize orchestrator
orchestrator = TaskOrchestrator()

# ============ API ROUTES ============
@api_router.get("/")
async def root():
    return {"message": "Synaptra Studio API", "version": "1.0.0"}

@api_router.get("/status", response_model=SystemStatus)
async def get_system_status():
    try:
        await db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    
    ai_status = "ready" if os.environ.get('OPENAI_API_KEY') else "not_configured"
    
    return SystemStatus(
        status="operational" if db_status == "connected" and ai_status == "ready" else "degraded",
        ai_engine=ai_status,
        database=db_status,
        memory_service="active" if db_status == "connected" else "unavailable",
        eval_service="active"
    )

@api_router.get("/tests")
async def get_available_tests():
    """
    Scans the tests directory and returns available test files.
    """
    # Go up one level from backend/ to find the tests/ folder
    test_dir = ROOT_DIR.parent / "tests"
    
    # If not found there, check if it's inside backend/ (fallback)
    if not test_dir.exists():
        test_dir = ROOT_DIR / "tests"
    
    if not test_dir.exists():
        return []

    available_tests = []
    try:
        # Scan the directory
        for filename in os.listdir(test_dir):
            if filename.startswith("test_") and filename.endswith(".py"):
                available_tests.append({
                    "id": filename,
                    "name": filename.replace("test_", "").replace(".py", "").replace("_", " ").title(),
                    "filename": filename,
                    "path": str(test_dir / filename)
                })
    except Exception as e:
        logger.error(f"Error scanning tests directory: {e}")
        return []
        
    return available_tests

@api_router.get("/tests/results")
async def get_test_results():
    """
    Returns the latest test results from the database.
    """
    try:
        # Fetch the document with _id="latest"
        result = await db.test_results.find_one({"_id": "latest"})
        
        if not result:
            return {"tests": [], "summary": {"total": 0, "passed": 0}}
        
        # Convert the special _id field to a string so it can be sent as JSON
        if "_id" in result:
            result["_id"] = str(result["_id"])
            
        return result
    except Exception as e:
        logger.error(f"Error fetching test results: {e}")
        return {"tests": [], "summary": {"total": 0, "passed": 0}, "error": str(e)}

# Tasks
@api_router.post("/tasks", response_model=TaskResponse)
async def create_task(request: TaskCreateRequest):
    task = Task(
        input_text=request.input_text,
        task_type=request.task_type or TaskType.GENERAL_ANALYSIS,
        input_image_base64=request.input_image_base64
    )
    executed_task = await orchestrator.execute(task)
    return TaskResponse(**executed_task.model_dump())

@api_router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(limit: int = 50, skip: int = 0, is_eval: Optional[bool] = None):
    query = {}
    if is_eval is not None:
        query["is_eval_run"] = is_eval

    raw_tasks = await db.tasks.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    results = []
    for task_doc in raw_tasks:
        try:
            results.append(TaskResponse(**task_doc))
        except Exception as e:
            logger.error(f"Skipping task {task_doc.get('id', '?')}: {e}")
    return results

@api_router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse(**task)

@api_router.get("/tasks/{task_id}/traces")
async def get_task_traces(task_id: str):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0, "reasoning_traces": 1})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task.get("reasoning_traces", [])

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    # Also delete associated memory items
    await db.memory.delete_many({"task_id": task_id})
    return {"message": "Task deleted", "id": task_id}

@api_router.delete("/tasks/cleanup/corrupted")
async def cleanup_corrupted_tasks():
    raw_tasks = await db.tasks.find({}, {"_id": 0, "id": 1}).to_list(None)
    deleted_ids = []
    for doc in raw_tasks:
        full_doc = await db.tasks.find_one({"id": doc.get("id")}, {"_id": 0})
        if not full_doc:
            continue
        try:
            TaskResponse(**full_doc)
        except Exception:
            task_id = full_doc.get("id", "unknown")
            await db.tasks.delete_one({"id": task_id})
            await db.memory.delete_many({"task_id": task_id})
            deleted_ids.append(task_id)
            logger.info(f"Deleted corrupted task: {task_id}")
    return {"deleted_count": len(deleted_ids), "deleted_ids": deleted_ids}

# ============ AUTOMATIONS ============
class AutomationTrigger(str, Enum):
    MANUAL = "manual"
    SCHEDULED = "scheduled"

class Automation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    input_text: str
    task_type: TaskType = TaskType.GENERAL_ANALYSIS
    trigger_type: AutomationTrigger = AutomationTrigger.MANUAL
    schedule: Optional[str] = None  # e.g. "daily", "hourly", cron expression
    enabled: bool = True
    run_count: int = 0
    last_run_at: Optional[str] = None
    last_run_score: Optional[float] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AutomationCreateRequest(BaseModel):
    name: str
    description: str = ""
    input_text: str
    task_type: TaskType = TaskType.GENERAL_ANALYSIS
    trigger_type: AutomationTrigger = AutomationTrigger.MANUAL
    schedule: Optional[str] = None

class AutomationUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    input_text: Optional[str] = None
    task_type: Optional[TaskType] = None
    trigger_type: Optional[AutomationTrigger] = None
    schedule: Optional[str] = None
    enabled: Optional[bool] = None

@api_router.post("/automations", response_model=Automation)
async def create_automation(request: AutomationCreateRequest):
    automation = Automation(**request.model_dump())
    await db.automations.insert_one(automation.model_dump())
    return automation

@api_router.get("/automations", response_model=List[Automation])
async def get_automations():
    docs = await db.automations.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    results = []
    for doc in docs:
        try:
            results.append(Automation(**doc))
        except Exception as e:
            logger.error(f"Skipping automation {doc.get('id', '?')}: {e}")
    return results

@api_router.get("/automations/{automation_id}", response_model=Automation)
async def get_automation(automation_id: str):
    doc = await db.automations.find_one({"id": automation_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Automation not found")
    return Automation(**doc)

@api_router.put("/automations/{automation_id}", response_model=Automation)
async def update_automation(automation_id: str, request: AutomationUpdateRequest):
    doc = await db.automations.find_one({"id": automation_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Automation not found")
    updates = {k: v for k, v in request.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.automations.update_one({"id": automation_id}, {"$set": updates})
    updated = await db.automations.find_one({"id": automation_id}, {"_id": 0})
    return Automation(**updated)

@api_router.delete("/automations/{automation_id}")
async def delete_automation(automation_id: str):
    result = await db.automations.delete_one({"id": automation_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Automation not found")
    return {"message": "Automation deleted", "id": automation_id}

@api_router.post("/automations/{automation_id}/run", response_model=TaskResponse)
async def run_automation(automation_id: str):
    doc = await db.automations.find_one({"id": automation_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Automation not found")
    automation = Automation(**doc)
    if not automation.enabled:
        raise HTTPException(status_code=400, detail="Automation is disabled")

    task = Task(input_text=automation.input_text, task_type=automation.task_type)
    executed_task = await orchestrator.execute(task)

    # Update automation run stats
    now = datetime.now(timezone.utc).isoformat()
    await db.automations.update_one({"id": automation_id}, {"$set": {
        "run_count": automation.run_count + 1,
        "last_run_at": now,
        "last_run_score": executed_task.evaluation.overall_score,
        "updated_at": now
    }})

    return TaskResponse(**executed_task.model_dump())

# Tools Registry
class ToolDefinition(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    enabled: bool = True
    category: str = "utility"  # utility, search, code, data
    invocation_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

DEFAULT_TOOLS = [
    {"id": "tool_code_exec", "name": "Code Executor", "description": "Execute code snippets in a sandboxed runtime", "enabled": True, "category": "code"},
    {"id": "tool_web_search", "name": "Web Search", "description": "Search the web for real-time information", "enabled": False, "category": "search"},
    {"id": "tool_file_reader", "name": "File Reader", "description": "Read and parse file contents", "enabled": True, "category": "data"},
    {"id": "tool_calculator", "name": "Calculator", "description": "Perform mathematical and statistical operations", "enabled": True, "category": "utility"},
]

@api_router.get("/tools")
async def get_tools():
    tools = await db.tools.find({}, {"_id": 0}).sort("created_at", 1).to_list(100)
    if not tools:
        # Seed defaults on first access
        for t in DEFAULT_TOOLS:
            t["created_at"] = datetime.now(timezone.utc).isoformat()
            t["invocation_count"] = 0
            await db.tools.insert_one(t)
        tools = await db.tools.find({}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return tools

@api_router.post("/tools")
async def register_tool(tool: ToolDefinition):
    existing = await db.tools.find_one({"name": tool.name}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="A tool with this name already exists")
    await db.tools.insert_one(tool.model_dump())
    return tool

@api_router.put("/tools/{tool_id}")
async def update_tool(tool_id: str, updates: Dict[str, Any]):
    result = await db.tools.update_one({"id": tool_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tool not found")
    tool = await db.tools.find_one({"id": tool_id}, {"_id": 0})
    return tool

@api_router.delete("/tools/{tool_id}")
async def delete_tool(tool_id: str):
    result = await db.tools.delete_one({"id": tool_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tool not found")
    return {"message": "Tool deleted", "id": tool_id}

# Memory
@api_router.get("/memory")
async def get_memory_items(task_id: Optional[str] = None, memory_type: Optional[str] = None, limit: int = 100):
    query = {}
    if task_id:
        query["task_id"] = task_id
    if memory_type:
        query["memory_type"] = memory_type

    items = await db.memory.find(query, {"_id": 0, "embedding": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return items

@api_router.get("/memory/stats")
async def get_memory_stats():
    total = await db.memory.count_documents({})
    by_type = {}
    for mt in MemoryType:
        count = await db.memory.count_documents({"memory_type": mt.value})
        by_type[mt.value] = count

    total_with_embeddings = await db.memory.count_documents(
        {"embedding": {"$exists": True, "$ne": None}}
    )

    by_source = {}
    pipeline = [{"$group": {"_id": "$source", "count": {"$sum": 1}}}]
    async for doc in db.memory.aggregate(pipeline):
        by_source[doc["_id"]] = doc["count"]

    return {
        "total_items": total,
        "by_type": by_type,
        "total_with_embeddings": total_with_embeddings,
        "by_source": by_source
    }

@api_router.post("/memory/search")
async def search_memory(request: MemorySearchRequest):
    svc = MemoryService._get_embedding_service()
    results = await svc.semantic_search(
        query=request.query,
        limit=request.limit,
        threshold=request.threshold
    )
    return results

@api_router.delete("/memory/{item_id}")
async def delete_memory_item(item_id: str):
    result = await db.memory.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Memory item not found")
    return {"message": "Memory item deleted", "id": item_id}

# Settings
@api_router.get("/settings")
async def get_settings():
    settings = await db.settings.find_one({"id": "system_settings"}, {"_id": 0})
    if not settings:
        default = SystemSettings()
        await db.settings.insert_one(default.model_dump())
        return default.model_dump()
    return settings

@api_router.put("/settings")
async def update_settings(settings: SystemSettings):
    settings.updated_at = datetime.now(timezone.utc).isoformat()
    await db.settings.update_one(
        {"id": "system_settings"},
        {"$set": settings.model_dump()},
        upsert=True
    )
    return settings

# Eval Suites
@api_router.post("/eval/suites")
async def create_eval_suite(suite: EvalSuite):
    await db.eval_suites.insert_one(suite.model_dump())
    return suite

@api_router.get("/eval/suites")
async def get_eval_suites():
    suites = await db.eval_suites.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return suites

@api_router.get("/eval/suites/{suite_id}")
async def get_eval_suite(suite_id: str):
    suite = await db.eval_suites.find_one({"id": suite_id}, {"_id": 0})
    if not suite:
        raise HTTPException(status_code=404, detail="Suite not found")
    return suite

@api_router.delete("/eval/suites/{suite_id}")
async def delete_eval_suite(suite_id: str):
    result = await db.eval_suites.delete_one({"id": suite_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Suite not found")
    return {"message": "Suite deleted"}

# Providers
@api_router.get("/providers")
async def get_providers():
    return get_available_providers()

# Eval Runs
@api_router.post("/eval/run/{suite_id}")
async def run_eval_suite(suite_id: str, request: BenchmarkRunRequest = None):
    suite = await db.eval_suites.find_one({"id": suite_id}, {"_id": 0})
    if not suite:
        raise HTTPException(status_code=404, detail="Suite not found")

    # Resolve provider/model from request or settings
    settings = await db.settings.find_one({"id": "system_settings"}, {"_id": 0})
    run_provider = (request.provider if request else None) or (settings or {}).get("default_provider", "openai")
    run_model = (request.model if request else None) or (settings or {}).get("default_model", "gpt-4o")

    eval_run = EvalRun(
        suite_id=suite_id,
        suite_name=suite["name"],
        total_tasks=len(suite.get("tasks", [])),
        model_used=run_model,
        provider_used=run_provider
    )
    await db.eval_runs.insert_one(eval_run.model_dump())

    # Execute each task in the suite
    task_results = []
    scores = []

    for eval_task in suite.get("tasks", []):
        task = Task(
            input_text=eval_task.get("input_text", ""),
            task_type=TaskType(eval_task.get("task_type", "general_analysis")),
            is_eval_run=True,
            eval_suite_id=suite_id
        )
        executed = await orchestrator.execute(task, override_provider=run_provider, override_model=run_model)
        task_results.append(executed.id)
        scores.append(executed.evaluation)
        eval_run.completed_tasks += 1

    # Aggregate scores
    if scores:
        eval_run.aggregate_scores = EvaluationMetrics(
            quality_score=round(sum(s.quality_score for s in scores) / len(scores), 1),
            relevance_score=round(sum(s.relevance_score for s in scores) / len(scores), 1),
            efficiency_score=round(sum(s.efficiency_score for s in scores) / len(scores), 1),
            plan_adherence=round(sum(s.plan_adherence for s in scores) / len(scores), 1),
            output_coherence=round(sum(s.output_coherence for s in scores) / len(scores), 1),
            overall_score=round(sum(s.overall_score for s in scores) / len(scores), 1)
        )

    eval_run.task_results = task_results
    eval_run.status = "completed"
    eval_run.completed_at = datetime.now(timezone.utc).isoformat()

    await db.eval_runs.update_one({"id": eval_run.id}, {"$set": eval_run.model_dump()})

    # Update suite
    await db.eval_suites.update_one(
        {"id": suite_id},
        {"$set": {"last_run_at": eval_run.completed_at}, "$inc": {"run_count": 1}}
    )

    return eval_run

@api_router.get("/eval/compare/{suite_id}")
async def compare_eval_runs(suite_id: str):
    """Return all runs for a suite, grouped by model, for cross-model comparison."""
    runs = await db.eval_runs.find(
        {"suite_id": suite_id}, {"_id": 0}
    ).sort("started_at", -1).to_list(100)

    # Group by model
    by_model = {}
    for run in runs:
        key = f"{run.get('provider_used', 'openai')}:{run.get('model_used', 'gpt-4o')}"
        if key not in by_model:
            by_model[key] = {
                "provider": run.get("provider_used", "openai"),
                "model": run.get("model_used", "gpt-4o"),
                "runs": [],
                "best_overall": 0.0,
                "avg_overall": 0.0,
            }
        by_model[key]["runs"].append(run)

    # Compute stats per model
    for key, group in by_model.items():
        scores = [r.get("aggregate_scores", {}).get("overall_score", 0) for r in group["runs"]]
        group["best_overall"] = round(max(scores), 1) if scores else 0.0
        group["avg_overall"] = round(sum(scores) / len(scores), 1) if scores else 0.0
        group["run_count"] = len(group["runs"])
        # Keep only the latest 5 runs per model in the response
        group["runs"] = group["runs"][:5]

    return {
        "suite_id": suite_id,
        "models": list(by_model.values()),
        "total_runs": len(runs),
    }

@api_router.get("/eval/runs")
async def get_eval_runs(suite_id: Optional[str] = None):
    query = {}
    if suite_id:
        query["suite_id"] = suite_id
    runs = await db.eval_runs.find(query, {"_id": 0}).sort("started_at", -1).to_list(100)
    return runs

@api_router.get("/eval/runs/{run_id}")
async def get_eval_run(run_id: str):
    run = await db.eval_runs.find_one({"id": run_id}, {"_id": 0})
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run

# Export
@api_router.get("/export/task/{task_id}")
async def export_task(task_id: str):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    memory = await db.memory.find({"task_id": task_id}, {"_id": 0}).to_list(100)
    
    return {
        "export_type": "task",
        "export_timestamp": datetime.now(timezone.utc).isoformat(),
        "task": task,
        "memory_items": memory
    }

@api_router.get("/export/eval/{run_id}")
async def export_eval_run(run_id: str):
    run = await db.eval_runs.find_one({"id": run_id}, {"_id": 0})
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    tasks = []
    for task_id in run.get("task_results", []):
        task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
        if task:
            tasks.append(task)
    
    return {
        "export_type": "eval_run",
        "export_timestamp": datetime.now(timezone.utc).isoformat(),
        "run": run,
        "tasks": tasks
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)