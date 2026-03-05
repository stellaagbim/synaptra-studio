import { useState, useEffect } from "react";
import {
  FlaskConical, Play, Plus, Trash2, ChevronRight, BarChart3,
  Target, Activity, TrendingUp, Clock, CheckCircle2,
  XCircle, Loader2, FileText, ArrowRight, Info, Gauge,
  GitCompare, Cpu
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const ComparisonBar = ({ label, models }) => {
  const maxVal = Math.max(...models.map(m => m.value || 0), 1);
  return (
    <div className="mb-4">
      <div className="text-xs text-[var(--sy-text-tertiary)] mb-2">{label}</div>
      <div className="space-y-1.5">
        {models.map((m, i) => {
          const color = m.value >= 80 ? 'var(--sy-success)' : m.value >= 60 ? 'var(--sy-amber)' : 'var(--sy-error)';
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[10px] text-[var(--sy-text-muted)] w-28 truncate font-mono">{m.model}</span>
              <div className="flex-1 h-5 rounded bg-[var(--sy-surface)] overflow-hidden relative">
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{ width: `${(m.value / 100) * 100}%`, background: color }}
                />
              </div>
              <span className="text-xs font-mono text-[var(--sy-text-secondary)] w-10 text-right">
                {m.value?.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
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
  const [providers, setProviders] = useState([]);
  const [runProvider, setRunProvider] = useState("");
  const [runModel, setRunModel] = useState("");
  const [comparisonData, setComparisonData] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  const [newSuiteName, setNewSuiteName] = useState("");
  const [newSuiteDesc, setNewSuiteDesc] = useState("");
  const [newSuiteTasks, setNewSuiteTasks] = useState([
    { input_text: "", expected_behavior: "", task_type: "general_analysis", weight: 1.0 }
  ]);

  useEffect(() => {
    fetchData();
    axios.get(`${API}/providers`).then(res => {
      setProviders(res.data);
      const available = res.data.find(p => p.available);
      if (available) {
        setRunProvider(available.id);
        if (available.models?.length) setRunModel(available.models[0].id);
      }
    }).catch(() => {});
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

  const fetchComparison = async (suiteId) => {
    try {
      const { data } = await axios.get(`${API}/eval/compare/${suiteId}`);
      setComparisonData(data);
      setShowComparison(true);
      setSelectedRun(null);
    } catch (e) {
      console.error("Failed to fetch comparison:", e);
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
      const { data } = await axios.post(`${API}/eval/run/${suiteId}`, {
        provider: runProvider || undefined,
        model: runModel || undefined
      });
      setRuns(prev => [data, ...prev]);
      setSelectedRun(data);
      setShowComparison(false);
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

  const activeProviderConfig = providers.find(p => p.id === runProvider);
  const availableRunModels = activeProviderConfig?.models || [];

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
                    onClick={() => { setSelectedSuite(suite); setSelectedRun(null); setShowComparison(false); }}
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
        {showComparison && comparisonData ? (
          /* ===== Comparison View ===== */
          <>
            <div className="sy-panel-solid p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <GitCompare className="w-5 h-5 text-[var(--sy-primary)]" />
                    <h2 className="text-lg font-medium text-[var(--sy-text-primary)]">Model Comparison</h2>
                  </div>
                  <p className="text-sm text-[var(--sy-text-tertiary)] mt-1">
                    {comparisonData.total_runs} total runs across {comparisonData.models.length} model{comparisonData.models.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComparison(false)}
                  className="sy-btn sy-btn-ghost"
                >
                  Back to Suite
                </Button>
              </div>

              {/* Leaderboard */}
              <div className="space-y-2">
                {comparisonData.models
                  .sort((a, b) => b.avg_overall - a.avg_overall)
                  .map((m, idx) => {
                    const isTop = idx === 0 && comparisonData.models.length > 1;
                    return (
                      <div
                        key={`${m.provider}:${m.model}`}
                        className={`flex items-center gap-4 p-3 rounded-lg border ${
                          isTop
                            ? 'border-[var(--sy-primary)]/30 bg-[var(--sy-primary-subtle)]'
                            : 'border-[var(--sy-border-subtle)] bg-[var(--sy-surface)]'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isTop ? 'bg-[var(--sy-primary)] text-[var(--sy-void)]' : 'bg-[var(--sy-elevated)] text-[var(--sy-text-muted)]'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--sy-text-primary)]">{m.model}</span>
                            <span className="text-[10px] text-[var(--sy-text-muted)] px-1.5 py-0.5 rounded bg-[var(--sy-elevated)]">
                              {m.provider}
                            </span>
                          </div>
                          <span className="text-[10px] text-[var(--sy-text-muted)]">{m.run_count} run{m.run_count !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-mono font-semibold sy-text-${getScoreColor(m.avg_overall)}`}>
                            {m.avg_overall.toFixed(1)}
                          </div>
                          <div className="text-[10px] text-[var(--sy-text-muted)]">
                            best {m.best_overall.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="sy-panel-solid flex-1 flex flex-col overflow-hidden">
              <div className="sy-panel-header">
                <div>
                  <h3 className="text-sm font-medium text-[var(--sy-text-primary)]">Metric Breakdown</h3>
                  <p className="sy-label mt-1">Per-metric comparison across models</p>
                </div>
              </div>
              <ScrollArea className="flex-1 p-5">
                {["quality_score", "relevance_score", "efficiency_score", "plan_adherence", "output_coherence", "overall_score"].map(metric => {
                  const label = metric.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  const models = comparisonData.models.map(m => {
                    // Average this metric across latest runs
                    const vals = m.runs.map(r => r.aggregate_scores?.[metric] || 0);
                    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                    return { model: m.model, value: avg };
                  }).sort((a, b) => b.value - a.value);
                  return <ComparisonBar key={metric} label={label} models={models} />;
                })}
              </ScrollArea>
            </div>
          </>
        ) : selectedRun ? (
          /* ===== Run Results ===== */
          <>
            <div className="sy-panel-solid p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-medium text-[var(--sy-text-primary)]">{selectedRun.suite_name}</h2>
                  <p className="text-sm text-[var(--sy-text-tertiary)] mt-1">
                    Run completed {selectedRun.completed_at ? `• ${new Date(selectedRun.completed_at).toLocaleString()}` : ''}
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

              <div className="grid grid-cols-4 sy-gap-section">
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
                  <div className="sy-metric-label">Provider</div>
                  <div className="sy-metric-value text-[var(--sy-text-primary)] text-base capitalize">
                    {selectedRun.provider_used || 'openai'}
                  </div>
                </div>
                <div className="sy-metric-card">
                  <div className="sy-metric-label">Model</div>
                  <div className="sy-metric-value text-[var(--sy-text-primary)] text-base">
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
                    description="Vocabulary richness, structure, information density"
                  />
                  <MetricDisplay
                    label="Relevance Score"
                    value={selectedRun.aggregate_scores?.relevance_score}
                    icon={Target}
                    description="Embedding-based semantic similarity"
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
                      Semantic composite • Quality(30%) + Relevance(25%) + Efficiency(15%) + Plan(15%) + Coherence(15%)
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </>
        ) : selectedSuite ? (
          /* ===== Suite Details ===== */
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
                  {(selectedSuite.run_count || 0) >= 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchComparison(selectedSuite.id)}
                      className="sy-btn sy-btn-ghost text-[var(--sy-primary)]"
                    >
                      <GitCompare className="w-4 h-4 mr-1" />
                      Compare
                    </Button>
                  )}
                </div>
              </div>

              {/* Model Selector for Run */}
              <div className="p-4 rounded-lg bg-[var(--sy-surface)] border border-[var(--sy-border-subtle)] mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-4 h-4 text-[var(--sy-primary)]" />
                  <span className="text-xs font-medium text-[var(--sy-text-secondary)]">Run Configuration</span>
                </div>
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-[10px] text-[var(--sy-text-muted)] mb-1 block">Provider</label>
                    <Select
                      value={runProvider}
                      onValueChange={(val) => {
                        setRunProvider(val);
                        const prov = providers.find(p => p.id === val);
                        if (prov?.models?.length) setRunModel(prov.models[0].id);
                      }}
                    >
                      <SelectTrigger className="bg-[var(--sy-elevated)] border-[var(--sy-border-default)] text-[var(--sy-text-secondary)] text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--sy-elevated)] border-[var(--sy-border-default)]">
                        {providers.filter(p => p.available).map(p => (
                          <SelectItem key={p.id} value={p.id} className="text-xs">
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--sy-text-muted)] mb-1 block">Model</label>
                    <Select value={runModel} onValueChange={setRunModel}>
                      <SelectTrigger className="bg-[var(--sy-elevated)] border-[var(--sy-border-default)] text-[var(--sy-text-secondary)] text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--sy-elevated)] border-[var(--sy-border-default)]">
                        {availableRunModels.map(m => (
                          <SelectItem key={m.id} value={m.id} className="text-xs">
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="sy-btn sy-btn-primary h-9"
                    onClick={() => runSuite(selectedSuite.id)}
                    disabled={isRunning || !selectedSuite.tasks?.length}
                    data-testid="run-suite-btn"
                  >
                    {isRunning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Run
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
          /* ===== Empty State ===== */
          <div className="flex-1 sy-panel-solid flex items-center justify-center">
            <div className="text-center max-w-md">
              <FlaskConical className="w-16 h-16 mx-auto mb-6 text-[var(--sy-text-muted)] opacity-30" strokeWidth={1} />
              <h3 className="text-lg font-medium text-[var(--sy-text-secondary)] mb-2">Synaptra Eval</h3>
              <p className="text-sm text-[var(--sy-text-muted)] leading-relaxed">
                Define benchmark suites for systematic AI evaluation. Create suites with multiple tasks,
                run evaluations across different models, and compare aggregate metrics.
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
                    onClick={() => { setSelectedRun(run); setSelectedSuite(null); setShowComparison(false); }}
                    data-testid={`run-${run.id}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[var(--sy-text-secondary)]">{run.suite_name}</span>
                      <span className={`sy-data text-sm sy-text-${getScoreColor(score)}`}>
                        {score?.toFixed(1) || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] text-[var(--sy-text-muted)]">
                        <Clock className="w-3 h-3" strokeWidth={1.5} />
                        {run.completed_at
                          ? new Date(run.completed_at).toLocaleDateString()
                          : 'Running'}
                      </div>
                      <span className="text-[10px] text-[var(--sy-text-muted)] font-mono">
                        {run.model_used || 'gpt-4o'}
                      </span>
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
