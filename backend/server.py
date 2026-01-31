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

class MemoryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    memory_type: MemoryType
    key: str
    content: str
    source: str = "system"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    retention_policy: str = "persistent"

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
    total_tasks: int = 0
    completed_tasks: int = 0

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

# ============ AI ENGINE ============
class AIAnalysisEngine:
    def __init__(self):
        self.api_key = os.environ.get('OPENAI_API_KEY')
        if not self.api_key:
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
    
    async def analyze(self, task: Task, settings: SystemSettings) -> tuple[str, dict]:
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not configured")
        
        system_prompt = self._get_system_prompt(task.task_type)
        
        model = settings.default_model if settings else "gpt-4o"
        
        # Initialize OpenAI client
        client = AsyncOpenAI(api_key=self.api_key)
        
        # Build messages
        messages = [{"role": "system", "content": system_prompt}]
        
        if task.input_image_base64:
            # Multimodal message with image
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
        
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=4096
        )
        
        end_time = datetime.now(timezone.utc)
        processing_time = int((end_time - start_time).total_seconds() * 1000)
        
        output_text = response.choices[0].message.content
        
        return output_text, {"processing_time_ms": processing_time, "model": model, "provider": "openai"}

# ============ EVALUATION ENGINE ============
class EvaluationEngine:
    @staticmethod
    def evaluate(task: Task, output: str) -> EvaluationMetrics:
        output_length = len(output)
        has_headings = any(marker in output for marker in ['#', '**', '1.', '2.'])
        has_structure = output.count('\n') > 3
        has_lists = any(marker in output for marker in ['- ', '• ', '* '])
        
        # Quality: structure, depth, formatting
        quality_base = min(output_length / 500, 1.0) * 50
        quality_bonus = (15 if has_headings else 0) + (15 if has_structure else 0) + (10 if has_lists else 0) + (10 if output_length > 200 else 0)
        quality_score = min((quality_base + quality_bonus), 100)
        
        # Relevance: input coverage
        input_words = set(task.input_text.lower().split()) if task.input_text else set()
        output_words = set(output.lower().split())
        overlap = len(input_words & output_words)
        relevance_score = min((overlap / max(len(input_words), 1)) * 100, 100) if input_words else 75
        
        # Efficiency: processing time
        processing_time = task.metadata.processing_time_ms or 5000
        if processing_time < 2000:
            efficiency_score = 95
        elif processing_time < 5000:
            efficiency_score = 85
        elif processing_time < 10000:
            efficiency_score = 70
        else:
            efficiency_score = 50
        
        # Plan adherence: all steps completed
        completed_steps = sum(1 for s in task.execution_steps if s.status == 'completed')
        total_steps = len(task.execution_steps) or 1
        plan_adherence = (completed_steps / total_steps) * 100
        
        # Output coherence: sentence structure
        sentences = output.split('.')
        avg_sentence_len = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
        output_coherence = min(100, 50 + (avg_sentence_len * 2)) if 5 < avg_sentence_len < 30 else 60
        
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

# ============ MEMORY SERVICE ============
class MemoryService:
    @staticmethod
    async def create_memory_item(task_id: str, memory_type: MemoryType, key: str, content: str, source: str = "system") -> MemoryItem:
        item = MemoryItem(
            task_id=task_id,
            memory_type=memory_type,
            key=key,
            content=content,
            source=source
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
        
        items = await db.memory.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
        return items
    
    @staticmethod
    async def delete_memory_item(item_id: str) -> bool:
        result = await db.memory.delete_one({"id": item_id})
        return result.deleted_count > 0

# ============ TASK ORCHESTRATOR ============
class TaskOrchestrator:
    def __init__(self):
        self.ai_engine = AIAnalysisEngine()
        self.evaluation_engine = EvaluationEngine()
        self.memory_service = MemoryService()
    
    def _create_execution_steps(self) -> List[ExecutionStep]:
        return [
            ExecutionStep(name="Input Reception", status="pending"),
            ExecutionStep(name="Preprocessing", status="pending"),
            ExecutionStep(name="AI Analysis", status="pending"),
            ExecutionStep(name="Evaluation", status="pending"),
            ExecutionStep(name="Output Generation", status="pending")
        ]
    
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
    
    def _detect_task_type(self, input_text: str, has_image: bool) -> TaskType:
        if has_image:
            return TaskType.IMAGE_ANALYSIS
        
        text_lower = input_text.lower()
        
        code_indicators = ['def ', 'function ', 'class ', 'import ', 'const ', 'let ', 'var ', '{', '}', '();', '=>', 'return ']
        if sum(1 for i in code_indicators if i in input_text) >= 2:
            return TaskType.CODE_ANALYSIS
        
        summarize_indicators = ['summarize', 'summary', 'brief', 'overview', 'key points', 'main idea', 'tldr']
        if any(indicator in text_lower for indicator in summarize_indicators):
            return TaskType.TEXT_SUMMARIZATION
        
        doc_indicators = ['document', 'report', 'extract', 'parse', 'data', 'table', 'form']
        if any(indicator in text_lower for indicator in doc_indicators):
            return TaskType.DOCUMENT_PROCESSING
        
        return TaskType.GENERAL_ANALYSIS
    
    async def _get_settings(self) -> SystemSettings:
        settings_doc = await db.settings.find_one({"id": "system_settings"}, {"_id": 0})
        if settings_doc:
            return SystemSettings(**settings_doc)
        return SystemSettings()
    
    async def execute(self, task: Task) -> Task:
        try:
            settings = await self._get_settings()
            
            # Initialize
            task.execution_steps = self._create_execution_steps()
            task.status = TaskStatus.INPUT_RECEIVED
            task.metadata.pipeline_steps_count = len(task.execution_steps)
            
            # Step 1: Input Reception
            task = await self._update_step(task, 0, "running", "Receiving and validating input")
            await asyncio.sleep(0.05)
            input_size = len(task.input_text) + (len(task.input_image_base64 or "") // 1000)
            task = await self._update_step(task, 0, "completed", f"Input validated: {input_size} units")
            
            # Step 2: Preprocessing
            task.status = TaskStatus.PREPROCESSING
            task = await self._update_step(task, 1, "running", "Preprocessing input data")
            
            if task.task_type == TaskType.GENERAL_ANALYSIS:
                detected_type = self._detect_task_type(task.input_text, task.input_image_base64 is not None)
                task.task_type = detected_type
            
            task.metadata.input_modality = "multimodal" if task.input_image_base64 else "text"
            await asyncio.sleep(0.05)
            task = await self._update_step(task, 1, "completed", f"Task type: {task.task_type.value}")
            
            # Step 3: AI Analysis
            task.status = TaskStatus.ANALYZING
            task = await self._update_step(task, 2, "running", f"Executing {settings.default_model} analysis")
            
            output, metrics = await self.ai_engine.analyze(task, settings)
            task.output = output
            task.metadata.processing_time_ms = metrics.get("processing_time_ms")
            task.metadata.model_used = metrics.get("model", "gpt-4o")
            task.metadata.provider = metrics.get("provider", "openai")
            
            task = await self._update_step(task, 2, "completed", f"Analysis completed in {task.metadata.processing_time_ms}ms")
            
            # Step 4: Evaluation
            task.status = TaskStatus.EVALUATING
            task = await self._update_step(task, 3, "running", "Computing evaluation metrics")
            
            task.evaluation = self.evaluation_engine.evaluate(task, output)
            await asyncio.sleep(0.05)
            task = await self._update_step(task, 3, "completed", f"Overall score: {task.evaluation.overall_score}")
            
            # Step 5: Output Generation & Memory
            task = await self._update_step(task, 4, "running", "Generating output and storing memory")
            
            # Create memory items if enabled
            if settings.enable_memory:
                # Store summary
                summary_item = await self.memory_service.create_memory_item(
                    task_id=task.id,
                    memory_type=MemoryType.SUMMARY,
                    key=f"task_{task.id[:8]}_summary",
                    content=output[:500] + "..." if len(output) > 500 else output,
                    source="ai_analysis"
                )
                task.memory_items.append(summary_item.id)
                
                # Store context
                context_item = await self.memory_service.create_memory_item(
                    task_id=task.id,
                    memory_type=MemoryType.CONTEXT,
                    key=f"task_{task.id[:8]}_input",
                    content=task.input_text[:300],
                    source="user_input"
                )
                task.memory_items.append(context_item.id)
                task.metadata.memory_items_created = 2
            
            await asyncio.sleep(0.05)
            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.now(timezone.utc).isoformat()
            task = await self._update_step(task, 4, "completed", f"Task completed, {task.metadata.memory_items_created} memory items created")
            
            return task
            
        except Exception as e:
            logger.error(f"Task execution failed: {str(e)}")
            task.status = TaskStatus.FAILED
            task.error_message = str(e)
            task.updated_at = datetime.now(timezone.utc).isoformat()
            
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
    
    tasks = await db.tasks.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [TaskResponse(**task) for task in tasks]

@api_router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse(**task)

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    # Also delete associated memory items
    await db.memory.delete_many({"task_id": task_id})
    return {"message": "Task deleted", "id": task_id}

# Memory
@api_router.get("/memory")
async def get_memory_items(task_id: Optional[str] = None, memory_type: Optional[str] = None, limit: int = 100):
    query = {}
    if task_id:
        query["task_id"] = task_id
    if memory_type:
        query["memory_type"] = memory_type
    
    items = await db.memory.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return items

@api_router.get("/memory/stats")
async def get_memory_stats():
    total = await db.memory.count_documents({})
    by_type = {}
    for mt in MemoryType:
        count = await db.memory.count_documents({"memory_type": mt.value})
        by_type[mt.value] = count
    
    return {"total_items": total, "by_type": by_type}

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

# Eval Runs
@api_router.post("/eval/run/{suite_id}")
async def run_eval_suite(suite_id: str):
    suite = await db.eval_suites.find_one({"id": suite_id}, {"_id": 0})
    if not suite:
        raise HTTPException(status_code=404, detail="Suite not found")
    
    eval_run = EvalRun(
        suite_id=suite_id,
        suite_name=suite["name"],
        total_tasks=len(suite.get("tasks", [])),
        model_used="gpt-4o"
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
        executed = await orchestrator.execute(task)
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