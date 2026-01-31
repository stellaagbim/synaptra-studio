import { useState, useEffect } from "react";
import {
  FlaskConical, Play, Plus, Trash2, ChevronRight, BarChart3,
  Target, Activity, TrendingUp, Clock, CheckCircle2,
  XCircle, Loader2, FileText, ArrowRight, Info, Gauge
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MetricDisplay = ({ label, value, description, icon: Icon }) => {
  const getColor = (v) => {
    if (v >= 80) return 'success';
    if (v >= 60) return 'warning';
    return 'error';
  };
  const color = value ? getColor(value) : 'primary';
  
  return (
    <div className="sy-metric-card">
      <div className="sy-metric-label">
        <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
        {label}
      </div>
      <div className="flex items-end justify-between">
        <div className={`sy-metric-value sy-text-${color}`}>
          {value?.toFixed(1) || '—'}
        </div>
      </div>
      <div className="sy-metric-bar mt-3">
        <div 
          className={`sy-metric-fill ${color}`}
          style={{ width: `${value || 0}%` }}
        />
      </div>
      {description && (
        <p className="text-[10px] text-[var(--sy-text-muted)] mt-2">{description}</p>
      )}
    </div>
  );
};

export const Eval = () => {
  const [suites, setSuites] = useState([]);
  const [runs, setRuns] = useState([]);
  const [selectedSuite, setSelectedSuite] = useState(null);
  const [selectedRun, setSelectedRun] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [newSuiteName, setNewSuiteName] = useState("");
  const [newSuiteDesc, setNewSuiteDesc] = useState("");
  const [newSuiteTasks, setNewSuiteTasks] = useState([
    { input_text: "", expected_behavior: "", task_type: "general_analysis", weight: 1.0 }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [suitesRes, runsRes] = await Promise.all([
        axios.get(`${API}/eval/suites`),
        axios.get(`${API}/eval/runs`)
      ]);
      setSuites(suitesRes.data);
      setRuns(runsRes.data);
    } catch (e) {
      console.error("Failed to fetch eval data:", e);
    } finally {
      setLoading(false);
    }
  };

  const createSuite = async () => {
    if (!newSuiteName.trim()) return;
    
    try {
      const validTasks = newSuiteTasks.filter(t => t.input_text.trim());
      const { data } = await axios.post(`${API}/eval/suites`, {
        name: newSuiteName,
        description: newSuiteDesc,
        tasks: validTasks
      });
      setSuites(prev => [data, ...prev]);
      setIsCreating(false);
      setNewSuiteName("");
      setNewSuiteDesc("");
      setNewSuiteTasks([{ input_text: "", expected_behavior: "", task_type: "general_analysis", weight: 1.0 }]);
    } catch (e) {
      console.error("Failed to create suite:", e);
    }
  };

  const runSuite = async (suiteId) => {
    setIsRunning(true);
    try {
      const { data } = await axios.post(`${API}/eval/run/${suiteId}`);
      setRuns(prev => [data, ...prev]);
      setSelectedRun(data);
      await fetchData();
    } catch (e) {
      console.error("Failed to run suite:", e);
    } finally {
      setIsRunning(false);
    }
  };

  const deleteSuite = async (suiteId) => {
    try {
      await axios.delete(`${API}/eval/suites/${suiteId}`);
      setSuites(prev => prev.filter(s => s.id !== suiteId));
      if (selectedSuite?.id === suiteId) setSelectedSuite(null);
    } catch (e) {
      console.error("Failed to delete suite:", e);
    }
  };

  const addTaskToForm = () => {
    setNewSuiteTasks(prev => [...prev, { input_text: "", expected_behavior: "", task_type: "general_analysis", weight: 1.0 }]);
  };

  const updateTaskInForm = (index, field, value) => {
    setNewSuiteTasks(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  const removeTaskFromForm = (index) => {
    if (newSuiteTasks.length > 1) {
      setNewSuiteTasks(prev => prev.filter((_, i) => i !== index));
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--sy-primary)] mx-auto mb-4" />
          <p className="text-sm text-[var(--sy-text-muted)]">Loading evaluation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex sy-gap-section sy-animate-in" data-testid="eval-page">
      {/* Left Panel - Suites */}
      <div className="w-[280px] flex-shrink-0 sy-panel-solid flex flex-col">
        <div className="sy-panel-header">
          <div>
            <h3 className="text-sm font-medium text-[var(--sy-text-primary)]">Evaluation Suites</h3>
            <p className="sy-label mt-1">{suites.length} suites</p>
          </div>
          <Button
            size="sm"
            className="sy-btn sy-btn-primary h-8 px-3 text-xs"
            onClick={() => setIsCreating(true)}
            data-testid="create-suite-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-3">
          {suites.length === 0 ? (
            <div className="text-center py-12 text-[var(--sy-text-muted)]">
              <FlaskConical className="w-10 h-10 mx-auto mb-4 opacity-30" strokeWidth={1} />
              <p className="text-sm">No evaluation suites</p>
              <p className="text-xs mt-1">Create a benchmark suite</p>
            </div>
          ) : (
            <div className="space-y-2">
              {suites.map((suite) => {
                const isSelected = selectedSuite?.id === suite.id;
                return (
                  <div
                    key={suite.id}
                    className={`sy-task-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => { setSelectedSuite(suite); setSelectedRun(null); }}
                    data-testid={`suite-${suite.id}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[var(--sy-text-primary)]">
                        {suite.name}
                      </span>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-[var(--sy-primary)]' : 'text-[var(--sy-text-muted)]'}`} />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[var(--sy-text-muted)]">
                      <span>{suite.tasks?.length || 0} tasks</span>
                      <span>{suite.run_count || 0} runs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Center Panel - Details */}
      <div className="flex-1 flex flex-col sy-gap-section min-w-0">
        {selectedRun ? (
          // Run Results
          <>
            <div className="sy-panel-solid p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-medium text-[var(--sy-text-primary)]">{selectedRun.suite_name}</h2>
                  <p className="text-sm text-[var(--sy-text-tertiary)] mt-1">
                    Run completed • {new Date(selectedRun.completed_at).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRun(null)}
                  className="sy-btn sy-btn-ghost"
                >
                  Back to Suite
                </Button>
              </div>
              
              <div className="grid grid-cols-3 sy-gap-section">
                <div className="sy-metric-card">
                  <div className="sy-metric-label">Tasks Completed</div>
                  <div className="sy-metric-value text-[var(--sy-text-primary)]">
                    {selectedRun.completed_tasks}/{selectedRun.total_tasks}
                  </div>
                </div>
                <div className="sy-metric-card">
                  <div className="sy-metric-label">Overall Score</div>
                  <div className={`sy-metric-value sy-text-${getScoreColor(selectedRun.aggregate_scores?.overall_score)}`}>
                    {selectedRun.aggregate_scores?.overall_score?.toFixed(1) || '—'}
                  </div>
                </div>
                <div className="sy-metric-card">
                  <div className="sy-metric-label">Model Used</div>
                  <div className="sy-metric-value text-[var(--sy-text-primary)] text-lg">
                    {selectedRun.model_used}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="sy-panel-solid flex-1 flex flex-col overflow-hidden">
              <div className="sy-panel-header">
                <div>
                  <h3 className="text-sm font-medium text-[var(--sy-text-primary)]">Aggregate Metrics</h3>
                  <p className="sy-label mt-1">Decision-process evaluation</p>
                </div>
              </div>
              <ScrollArea className="flex-1 p-5">
                <div className="grid grid-cols-2 sy-gap-section">
                  <MetricDisplay 
                    label="Quality Score" 
                    value={selectedRun.aggregate_scores?.quality_score} 
                    icon={Gauge}
                    description="Output structure, depth, and formatting"
                  />
                  <MetricDisplay 
                    label="Relevance Score" 
                    value={selectedRun.aggregate_scores?.relevance_score} 
                    icon={Target}
                    description="Input coverage and topic alignment"
                  />
                  <MetricDisplay 
                    label="Efficiency Score" 
                    value={selectedRun.aggregate_scores?.efficiency_score} 
                    icon={Activity}
                    description="Processing time optimization"
                  />
                  <MetricDisplay 
                    label="Plan Adherence" 
                    value={selectedRun.aggregate_scores?.plan_adherence} 
                    icon={CheckCircle2}
                    description="Planned vs executed steps"
                  />
                </div>
                
                <div className="mt-6">
                  <div className="sy-eval-score highlight">
                    <div className={`sy-eval-score-value sy-text-${getScoreColor(selectedRun.aggregate_scores?.overall_score)}`}>
                      {selectedRun.aggregate_scores?.overall_score?.toFixed(1) || '—'}
                    </div>
                    <div className="sy-eval-score-label">Weighted Fidelity Score</div>
                    <div className="sy-eval-confidence">
                      <Info className="w-3 h-3 inline mr-1" />
                      Heuristic composite • Quality(30%) + Relevance(25%) + Efficiency(15%) + Plan(15%) + Coherence(15%)
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </>
        ) : selectedSuite ? (
          // Suite Details
          <>
            <div className="sy-panel-solid p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-medium text-[var(--sy-text-primary)]">{selectedSuite.name}</h2>
                  <p className="text-sm text-[var(--sy-text-tertiary)] mt-1">
                    {selectedSuite.description || 'No description'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSuite(selectedSuite.id)}
                    className="sy-btn sy-btn-ghost text-[var(--sy-error)] hover:text-[var(--sy-error)]"
                    data-testid="delete-suite-btn"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    className="sy-btn sy-btn-primary"
                    onClick={() => runSuite(selectedSuite.id)}
                    disabled={isRunning || !selectedSuite.tasks?.length}
                    data-testid="run-suite-btn"
                  >
                    {isRunning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Run Evaluation
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 sy-gap-section">
                <div className="sy-metric-card">
                  <div className="sy-metric-label">Tasks</div>
                  <div className="sy-metric-value text-[var(--sy-text-primary)]">
                    {selectedSuite.tasks?.length || 0}
                  </div>
                </div>
                <div className="sy-metric-card">
                  <div className="sy-metric-label">Run Count</div>
                  <div className="sy-metric-value text-[var(--sy-text-primary)]">
                    {selectedSuite.run_count || 0}
                  </div>
                </div>
                <div className="sy-metric-card">
                  <div className="sy-metric-label">Last Run</div>
                  <div className="sy-metric-value text-[var(--sy-text-primary)] text-base">
                    {selectedSuite.last_run_at 
                      ? new Date(selectedSuite.last_run_at).toLocaleDateString() 
                      : '—'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="sy-panel-solid flex-1 flex flex-col overflow-hidden">
              <div className="sy-panel-header">
                <div>
                  <h3 className="text-sm font-medium text-[var(--sy-text-primary)]">Suite Tasks</h3>
                  <p className="sy-label mt-1">Benchmark tasks in this suite</p>
                </div>
              </div>
              <ScrollArea className="flex-1 p-4">
                {selectedSuite.tasks?.length === 0 ? (
                  <div className="text-center py-12 text-[var(--sy-text-muted)]">
                    <FileText className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No tasks defined</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedSuite.tasks?.map((task, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-[var(--sy-surface)] border border-[var(--sy-border-subtle)]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="sy-label">Task {idx + 1}</span>
                          <span className="sy-data text-[10px] text-[var(--sy-text-muted)] px-2 py-0.5 rounded bg-[var(--sy-elevated)]">
                            {task.task_type}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--sy-text-secondary)] line-clamp-2">{task.input_text}</p>
                        {task.expected_behavior && (
                          <p className="text-xs text-[var(--sy-text-muted)] mt-2">
                            Expected: {task.expected_behavior}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </>
        ) : (
          // Empty State
          <div className="flex-1 sy-panel-solid flex items-center justify-center">
            <div className="text-center max-w-md">
              <FlaskConical className="w-16 h-16 mx-auto mb-6 text-[var(--sy-text-muted)] opacity-30" strokeWidth={1} />
              <h3 className="text-lg font-medium text-[var(--sy-text-secondary)] mb-2">Synaptra Eval</h3>
              <p className="text-sm text-[var(--sy-text-muted)] leading-relaxed">
                Define benchmark suites for systematic AI evaluation. Create suites with multiple tasks, 
                run evaluations, and analyze aggregate metrics across runs.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Run History */}
      <div className="w-[260px] flex-shrink-0 sy-panel-solid flex flex-col overflow-hidden">
        <div className="sy-panel-header">
          <div>
            <h3 className="text-sm font-medium text-[var(--sy-text-primary)]">Run History</h3>
            <p className="sy-label mt-1">{runs.length} runs</p>
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-3">
          {runs.length === 0 ? (
            <div className="text-center py-12 text-[var(--sy-text-muted)]">
              <BarChart3 className="w-8 h-8 mx-auto mb-3 opacity-30" strokeWidth={1} />
              <p className="text-sm">No runs yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {runs.map((run) => {
                const isSelected = selectedRun?.id === run.id;
                const score = run.aggregate_scores?.overall_score;
                return (
                  <div
                    key={run.id}
                    className={`sy-task-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => { setSelectedRun(run); setSelectedSuite(null); }}
                    data-testid={`run-${run.id}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[var(--sy-text-secondary)]">{run.suite_name}</span>
                      <span className={`sy-data text-sm sy-text-${getScoreColor(score)}`}>
                        {score?.toFixed(1) || '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--sy-text-muted)]">
                      <Clock className="w-3 h-3" strokeWidth={1.5} />
                      {run.completed_at 
                        ? new Date(run.completed_at).toLocaleDateString() 
                        : 'Running'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Create Suite Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="bg-[var(--sy-elevated)] border-[var(--sy-border-default)] text-[var(--sy-text-primary)] max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">Create Evaluation Suite</DialogTitle>
            <DialogDescription className="text-[var(--sy-text-tertiary)]">
              Define a benchmark suite with evaluation tasks
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto space-y-4 py-4">
            <div>
              <label className="sy-label block mb-2">Suite Name</label>
              <Input
                value={newSuiteName}
                onChange={(e) => setNewSuiteName(e.target.value)}
                placeholder="e.g., Code Analysis Benchmark"
                className="sy-input"
                data-testid="suite-name-input"
              />
            </div>
            
            <div>
              <label className="sy-label block mb-2">Description</label>
              <Textarea
                value={newSuiteDesc}
                onChange={(e) => setNewSuiteDesc(e.target.value)}
                placeholder="Describe the evaluation suite"
                className="sy-input sy-textarea min-h-[60px]"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="sy-label">Evaluation Tasks</label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={addTaskToForm}
                  className="sy-btn sy-btn-ghost text-[var(--sy-primary)] h-7"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Task
                </Button>
              </div>
              
              <div className="space-y-3">
                {newSuiteTasks.map((task, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-[var(--sy-surface)] border border-[var(--sy-border-subtle)]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="sy-label">Task {idx + 1}</span>
                      {newSuiteTasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTaskFromForm(idx)}
                          className="text-[var(--sy-text-muted)] hover:text-[var(--sy-error)] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <Textarea
                      value={task.input_text}
                      onChange={(e) => updateTaskInForm(idx, 'input_text', e.target.value)}
                      placeholder="Task input / prompt"
                      className="sy-input sy-textarea min-h-[60px] mb-3"
                    />
                    <Input
                      value={task.expected_behavior}
                      onChange={(e) => updateTaskInForm(idx, 'expected_behavior', e.target.value)}
                      placeholder="Expected behavior (optional)"
                      className="sy-input"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setIsCreating(false)} 
              className="sy-btn sy-btn-ghost"
            >
              Cancel
            </Button>
            <Button
              onClick={createSuite}
              disabled={!newSuiteName.trim()}
              className="sy-btn sy-btn-primary"
              data-testid="confirm-create-suite-btn"
            >
              Create Suite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Eval;
