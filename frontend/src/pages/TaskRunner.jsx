import { useState, useRef, useCallback } from "react";
import { useApp } from "@/App";
import { 
  Send, Upload, X, Play, CheckCircle2, Circle, Loader2, 
  XCircle, AlertCircle, FileText, ChevronRight,
  Clock, Cpu, Hash, ArrowRight, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const taskTypes = [
  { value: "general_analysis", label: "Auto-detect" },
  { value: "text_summarization", label: "Text Analysis" },
  { value: "code_analysis", label: "Code Analysis" },
  { value: "image_analysis", label: "Image Analysis" },
];

const PIPELINE_STAGES = [
  { id: 'input', name: 'Input Reception', desc: 'Validating input data' },
  { id: 'preprocess', name: 'Preprocessing', desc: 'Preparing data' },
  { id: 'analysis', name: 'AI Analysis', desc: 'Executing model' },
  { id: 'eval', name: 'Evaluation', desc: 'Computing metrics' },
  { id: 'output', name: 'Output Generation', desc: 'Formatting results' },
];

export const TaskRunner = () => {
  const { tasks, createTask, isLoading } = useApp();
  const [inputText, setInputText] = useState("");
  const [taskType, setTaskType] = useState("general_analysis");
  const [imageBase64, setImageBase64] = useState(null);
  const [imageName, setImageName] = useState("");
  const [activeTaskId, setActiveTaskId] = useState(null);
  const fileInputRef = useRef(null);

  const activeTask = tasks.find(t => t.id === activeTaskId) || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !imageBase64) return;
    
    try {
      const newTask = await createTask(inputText, imageBase64, taskType);
      setInputText("");
      setImageBase64(null);
      setImageName("");
      if (newTask?.id) {
        setActiveTaskId(newTask.id);
      }
    } catch (error) {
      // handled
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageBase64(e.target.result.split(',')[1]);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const selectTask = useCallback((taskId) => {
    setActiveTaskId(taskId);
  }, []);

  const getStepData = (index) => {
    if (!activeTask?.execution_steps || activeTask.execution_steps.length === 0) {
      return { status: 'pending', details: PIPELINE_STAGES[index].desc, duration: null };
    }
    const step = activeTask.execution_steps[index];
    if (!step) {
      if (activeTask.status === 'completed') {
        return { status: 'completed', details: 'Complete', duration: null };
      }
      return { status: 'pending', details: PIPELINE_STAGES[index].desc, duration: null };
    }
    return {
      status: step.status || 'pending',
      details: step.details || PIPELINE_STAGES[index].desc,
      duration: step.duration_ms
    };
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const hasExecution = activeTask && activeTask.execution_steps && activeTask.execution_steps.length > 0;
  const hasOutput = activeTask && activeTask.output;
  const hasMetrics = activeTask && activeTask.evaluation && activeTask.evaluation.overall_score > 0;

  return (
    <div className="h-full flex sy-gap-section sy-animate-in" data-testid="task-runner-page">
      {/* Left Panel - Task List */}
      <div className="w-[260px] flex-shrink-0 sy-panel-solid flex flex-col">
        <div className="sy-panel-header">
          <div>
            <h3 className="text-sm font-medium text-[var(--sy-text-primary)]">Task Queue</h3>
            <p className="sy-label mt-1">{tasks.length} tasks</p>
          </div>
          <Button
            size="sm"
            className="sy-btn sy-btn-primary h-8 px-3 text-xs"
            onClick={() => setActiveTaskId(null)}
            data-testid="new-task-btn"
          >
            <Play className="w-3.5 h-3.5" />
            New
          </Button>
        </div>
        
        <div className="px-3 py-3 border-b border-[var(--sy-border-void)]">
          <Select value={taskType} onValueChange={setTaskType}>
            <SelectTrigger className="bg-transparent border-[var(--sy-border-default)] text-[var(--sy-text-secondary)] text-xs h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[var(--sy-elevated)] border-[var(--sy-border-default)]">
              {taskTypes.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-[var(--sy-text-secondary)] text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <ScrollArea className="flex-1 p-2">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-[var(--sy-text-muted)] text-sm">
              <FileText className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p>No tasks</p>
            </div>
          ) : (
            <div className="space-y-1">
              {tasks.map((task) => {
                const isSelected = activeTaskId === task.id;
                return (
                  <div
                    key={task.id}
                    className={`sy-task-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => selectTask(task.id)}
                    data-testid={`task-${task.id}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="sy-task-id">
                        {task.id.slice(0, 8)}
                      </span>
                      <div className={`sy-task-status ${task.status}`} />
                    </div>
                    <p className="sy-task-title">
                      {task.input_text?.slice(0, 60) || 'Task'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Center Panel - Main Workspace */}
      <div className="flex-1 flex flex-col sy-gap-section min-w-0">
        {/* Input Section */}
        <div className="sy-panel-solid p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter task input for analysis..."
                className="sy-input sy-textarea min-h-[100px] pr-14 resize-none"
                disabled={isLoading}
                data-testid="task-input"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute bottom-3 right-3 sy-btn sy-btn-primary w-10 h-10"
                disabled={isLoading || (!inputText.trim() && !imageBase64)}
                data-testid="run-btn"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                imageBase64 
                  ? 'border-[var(--sy-primary)] bg-[var(--sy-primary-subtle)]' 
                  : 'border-[var(--sy-border-default)] hover:border-[var(--sy-border-strong)]'
              }`}
              onClick={() => fileInputRef.current?.click()}
              data-testid="file-upload"
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
              {imageBase64 ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded bg-[var(--sy-surface)] overflow-hidden border border-[var(--sy-border-default)]">
                    <img src={`data:image/jpeg;base64,${imageBase64}`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm text-[var(--sy-text-secondary)]">{imageName}</span>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); setImageBase64(null); setImageName(""); }} 
                    className="text-[var(--sy-text-muted)] hover:text-[var(--sy-error)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-[var(--sy-text-muted)]">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Attach image (optional)</span>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Execution Pipeline */}
        <div className="sy-panel-solid flex-1 flex flex-col overflow-hidden">
          <div className="sy-panel-header">
            <div>
              <h3 className="text-sm font-medium text-[var(--sy-text-primary)]">Execution Pipeline</h3>
              <p className="sy-label mt-1">
                {activeTask ? `Task ${activeTask.id.slice(0,8).toUpperCase()}` : 'Awaiting execution'}
              </p>
            </div>
            {activeTask?.status === 'completed' && (
              <div className="flex items-center gap-2 text-[var(--sy-success)]">
                <CheckCircle2 className="w-4 h-4" />
                <span className="sy-data text-xs">COMPLETE</span>
              </div>
            )}
            {activeTask?.status === 'failed' && (
              <div className="flex items-center gap-2 text-[var(--sy-error)]">
                <XCircle className="w-4 h-4" />
                <span className="sy-data text-xs">FAILED</span>
              </div>
            )}
            {activeTask?.status === 'processing' && (
              <div className="flex items-center gap-2 text-[var(--sy-amber)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="sy-data text-xs">PROCESSING</span>
              </div>
            )}
          </div>
          
          <ScrollArea className="flex-1 p-5">
            <div className="sy-pipeline">
              {PIPELINE_STAGES.map((stage, idx) => {
                const stepData = getStepData(idx);
                const isActive = stepData.status === 'running';
                const isComplete = stepData.status === 'completed';
                const isFailed = stepData.status === 'failed';
                
                return (
                  <div key={stage.id} className={`sy-pipeline-step ${isComplete ? 'completed' : ''}`}>
                    <div className={`sy-pipeline-node ${stepData.status}`}>
                      {isComplete ? <CheckCircle2 className="w-4 h-4" /> :
                       isActive ? <Loader2 className="w-4 h-4 animate-spin" /> :
                       isFailed ? <XCircle className="w-4 h-4" /> :
                       <Circle className="w-4 h-4" />}
                    </div>
                    <div className="sy-pipeline-content">
                      <div className={`sy-pipeline-title ${!activeTask || stepData.status === 'pending' ? 'muted' : ''}`}>
                        {stage.name}
                      </div>
                      <div className="sy-pipeline-detail">{stepData.details}</div>
                    </div>
                    {stepData.duration && (
                      <div className="sy-pipeline-timing">{stepData.duration}ms</div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Output Panel */}
        <div className="sy-panel-solid flex-1 flex flex-col overflow-hidden">
          <div className="sy-panel-header">
            <div>
              <h3 className="text-sm font-medium text-[var(--sy-text-primary)]">Output</h3>
              <p className="sy-label mt-1">
                {hasOutput ? 'Analysis results' : 'Awaiting execution'}
              </p>
            </div>
          </div>
          <ScrollArea className="flex-1 p-5">
            {activeTask?.status === 'failed' ? (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--sy-error-glow)] border border-[var(--sy-error)]/30">
                <AlertCircle className="w-5 h-5 text-[var(--sy-error)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[var(--sy-error)]">Execution Failed</p>
                  <p className="text-xs text-[var(--sy-error)]/70 mt-1">{activeTask.error_message || 'Unknown error'}</p>
                </div>
              </div>
            ) : hasOutput ? (
              <div className="sy-output sy-animate-slide" data-testid="task-output">
                {activeTask.output}
              </div>
            ) : (
              <div className="text-center py-16 text-[var(--sy-text-muted)]">
                <Zap className="w-10 h-10 mx-auto mb-4 opacity-30" strokeWidth={1} />
                <p className="text-sm">Execute a task to view results</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Right Panel - Metrics */}
      <div className="w-[280px] flex-shrink-0 sy-panel-solid flex flex-col overflow-hidden">
        <div className="sy-panel-header">
          <h3 className="text-sm font-medium text-[var(--sy-text-primary)]">Metrics</h3>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Evaluation Scores */}
            <div>
              <div className="sy-label mb-4">Evaluation Scores</div>
              <div className="space-y-4">
                {[
                  { key: 'quality', label: 'Quality' },
                  { key: 'relevance', label: 'Relevance' },
                  { key: 'efficiency', label: 'Efficiency' },
                  { key: 'plan_adherence', label: 'Plan Adherence' },
                ].map((m) => {
                  const value = activeTask?.evaluation?.[`${m.key}_score`] ?? activeTask?.evaluation?.[m.key];
                  const color = value ? getScoreColor(value) : 'primary';
                  return (
                    <div key={m.key}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-[var(--sy-text-tertiary)]">{m.label}</span>
                        <span className={`sy-data text-sm sy-text-${color}`}>
                          {value?.toFixed(1) || '—'}
                        </span>
                      </div>
                      <div className="sy-metric-bar">
                        <div 
                          className={`sy-metric-fill ${color}`}
                          style={{ width: `${value || 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Overall Score */}
              <div className="mt-6 pt-4 border-t border-[var(--sy-border-void)]">
                <div className="sy-eval-score highlight">
                  <div className={`sy-eval-score-value ${hasMetrics ? `sy-text-${getScoreColor(activeTask.evaluation.overall_score)}` : 'text-[var(--sy-text-muted)]'}`}>
                    {hasMetrics ? activeTask.evaluation.overall_score.toFixed(1) : '—'}
                  </div>
                  <div className="sy-eval-score-label">Overall Score</div>
                  {hasMetrics && (
                    <div className="sy-eval-confidence">
                      Heuristic composite • Weighted average
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Performance */}
            <div>
              <div className="sy-label mb-3">Performance</div>
              <div className="sy-metric-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[var(--sy-text-tertiary)]">
                    <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span className="text-xs">Execution Time</span>
                  </div>
                  <span className="sy-data text-sm text-[var(--sy-text-primary)]">
                    {activeTask?.metadata?.processing_time_ms 
                      ? `${(activeTask.metadata.processing_time_ms / 1000).toFixed(2)}s`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Metadata */}
            <div>
              <div className="sy-label mb-3">Run Metadata</div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--sy-text-muted)]">Task ID</span>
                  <span className="sy-data text-[var(--sy-text-tertiary)]">
                    {activeTask?.id?.slice(0, 12).toUpperCase() || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--sy-text-muted)]">Created</span>
                  <span className="sy-data text-[var(--sy-text-tertiary)]">
                    {activeTask?.created_at 
                      ? new Date(activeTask.created_at).toLocaleString('en-US', { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--sy-text-muted)]">Model</span>
                  <span className="sy-data text-[var(--sy-text-tertiary)]">
                    {activeTask?.metadata?.model_used || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--sy-text-muted)]">Modality</span>
                  <span className="sy-data text-[var(--sy-text-tertiary)] capitalize">
                    {activeTask?.metadata?.input_modality || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default TaskRunner;
