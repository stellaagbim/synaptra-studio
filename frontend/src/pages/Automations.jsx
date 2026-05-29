import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Workflow, Plus, Clock, Play, Trash2, X, Loader2,
  CheckCircle2, ToggleLeft, ToggleRight, Pencil, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const taskTypes = [
  { value: "general_analysis", label: "General Analysis" },
  { value: "text_summarization", label: "Text Summarization" },
  { value: "code_analysis", label: "Code Analysis" },
  { value: "document_processing", label: "Document Processing" },
];

const scheduleOptions = [
  { value: "hourly", label: "Every hour" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

export const Automations = () => {
  const navigate = useNavigate();
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [runningId, setRunningId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    input_text: "",
    task_type: "general_analysis",
    trigger_type: "manual",
    schedule: null,
  });

  const fetchAutomations = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/automations`);
      setAutomations(data);
    } catch (e) {
      toast.error("Failed to load automations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.input_text.trim()) return;

    try {
      const payload = { ...form };
      if (payload.trigger_type === "manual") payload.schedule = null;
      const { data } = await axios.post(`${API}/automations`, payload);
      setAutomations((prev) => [data, ...prev]);
      setShowForm(false);
      setForm({ name: "", description: "", input_text: "", task_type: "general_analysis", trigger_type: "manual", schedule: null });
      toast.success("Automation created");
    } catch (e) {
      toast.error("Failed to create automation");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/automations/${id}`);
      setAutomations((prev) => prev.filter((a) => a.id !== id));
      toast.success("Automation deleted");
    } catch (e) {
      toast.error("Failed to delete automation");
    }
  };

  const handleToggle = async (automation) => {
    try {
      const { data } = await axios.put(`${API}/automations/${automation.id}`, {
        enabled: !automation.enabled,
      });
      setAutomations((prev) => prev.map((a) => (a.id === data.id ? data : a)));
    } catch (e) {
      toast.error("Failed to update automation");
    }
  };

  const handleRun = async (automation) => {
    setRunningId(automation.id);
    try {
      const { data: task } = await axios.post(`${API}/automations/${automation.id}/run`);
      toast.success(`Automation completed`, {
        description: `Score: ${task.evaluation?.overall_score?.toFixed(1) || "-"}`,
      });
      fetchAutomations();
      if (task?.id) {
        navigate(`/task-runner?task=${task.id}`);
      }
    } catch (e) {
      const msg = e.response?.data?.detail || "Execution failed";
      toast.error("Automation run failed", { description: msg });
    } finally {
      setRunningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--sy-text-muted)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col sy-animate-in" data-testid="automations-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--sy-text-primary)]">Automations</h1>
          <p className="text-sm text-[var(--sy-text-muted)]">
            {automations.length} workflow{automations.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <Button
          className="sy-btn sy-btn-primary"
          onClick={() => setShowForm(!showForm)}
          data-testid="new-automation-btn"
        >
          {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showForm ? "Cancel" : "New Automation"}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="sy-panel-solid p-5 mb-6 sy-animate-slide">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="sy-label mb-2 block">Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Daily ML Summary"
                  className="sy-input"
                  required
                  data-testid="automation-name"
                />
              </div>
              <div>
                <label className="sy-label mb-2 block">Task Type</label>
                <Select value={form.task_type} onValueChange={(v) => setForm({ ...form, task_type: v })}>
                  <SelectTrigger className="bg-transparent border-[var(--sy-border-default)] text-[var(--sy-text-secondary)] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--sy-elevated)] border-[var(--sy-border-default)]">
                    {taskTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-[var(--sy-text-secondary)] text-sm">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="sy-label mb-2 block">Description</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What this automation does..."
                className="sy-input"
              />
            </div>

            <div>
              <label className="sy-label mb-2 block">Input Prompt</label>
              <Textarea
                value={form.input_text}
                onChange={(e) => setForm({ ...form, input_text: e.target.value })}
                placeholder="The prompt that will be sent to the AI engine..."
                className="sy-input sy-textarea min-h-[80px] resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="sy-label mb-2 block">Trigger</label>
                <Select value={form.trigger_type} onValueChange={(v) => setForm({ ...form, trigger_type: v })}>
                  <SelectTrigger className="bg-transparent border-[var(--sy-border-default)] text-[var(--sy-text-secondary)] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--sy-elevated)] border-[var(--sy-border-default)]">
                    <SelectItem value="manual" className="text-[var(--sy-text-secondary)] text-sm">Manual</SelectItem>
                    <SelectItem value="scheduled" className="text-[var(--sy-text-secondary)] text-sm">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.trigger_type === "scheduled" && (
                <div>
                  <label className="sy-label mb-2 block">Schedule</label>
                  <Select value={form.schedule || "daily"} onValueChange={(v) => setForm({ ...form, schedule: v })}>
                    <SelectTrigger className="bg-transparent border-[var(--sy-border-default)] text-[var(--sy-text-secondary)] text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--sy-elevated)] border-[var(--sy-border-default)]">
                      {scheduleOptions.map((s) => (
                        <SelectItem key={s.value} value={s.value} className="text-[var(--sy-text-secondary)] text-sm">
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="sy-btn sy-btn-primary" data-testid="create-automation-btn">
                <Plus className="w-4 h-4 mr-2" />
                Create Automation
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Automations List */}
      <ScrollArea className="flex-1">
        {automations.length === 0 && !showForm ? (
          <div className="sy-panel-solid p-12 text-center">
            <Workflow className="w-12 h-12 mx-auto mb-4 text-[var(--sy-text-muted)] opacity-30" strokeWidth={1} />
            <h3 className="text-base font-medium text-[var(--sy-text-primary)] mb-2">No automations configured</h3>
            <p className="text-sm text-[var(--sy-text-muted)] max-w-md mx-auto">
              Create reusable workflows with pre-defined prompts. Run them manually or set a schedule.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {automations.map((automation) => {
              const isRunning = runningId === automation.id;
              return (
                <div
                  key={automation.id}
                  className={`sy-panel-solid p-4 transition-all ${!automation.enabled ? "opacity-50" : ""}`}
                  data-testid={`automation-${automation.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-medium text-[var(--sy-text-primary)] truncate">
                          {automation.name}
                        </h3>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          automation.trigger_type === "scheduled"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-blue-500/10 text-blue-400"
                        }`}>
                          {automation.trigger_type === "scheduled" ? (
                            <><Clock className="w-2.5 h-2.5 inline mr-1" />{automation.schedule || "scheduled"}</>
                          ) : (
                            <><Zap className="w-2.5 h-2.5 inline mr-1" />manual</>
                          )}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--sy-elevated)] text-[var(--sy-text-muted)]">
                          {automation.task_type}
                        </span>
                      </div>
                      {automation.description && (
                        <p className="text-xs text-[var(--sy-text-muted)] mb-2">{automation.description}</p>
                      )}
                      <p className="text-xs text-[var(--sy-text-tertiary)] font-mono truncate">
                        {automation.input_text}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-[10px] text-[var(--sy-text-muted)]">
                        <span>{automation.run_count} run{automation.run_count !== 1 ? "s" : ""}</span>
                        {automation.last_run_score != null && (
                          <span>Last score: <span className="text-[var(--sy-text-secondary)]">{automation.last_run_score.toFixed(1)}</span></span>
                        )}
                        {automation.last_run_at && (
                          <span>Last run: {new Date(automation.last_run_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        className="sy-btn sy-btn-primary h-8 px-3 text-xs"
                        onClick={() => handleRun(automation)}
                        disabled={isRunning || !automation.enabled}
                        data-testid={`run-automation-${automation.id}`}
                      >
                        {isRunning ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <><Play className="w-3.5 h-3.5 mr-1" />Run</>
                        )}
                      </Button>
                      <button
                        onClick={() => handleToggle(automation)}
                        className="p-1.5 rounded text-[var(--sy-text-muted)] hover:text-[var(--sy-text-secondary)] hover:bg-[var(--sy-elevated)] transition-all"
                        title={automation.enabled ? "Disable" : "Enable"}
                      >
                        {automation.enabled ? (
                          <ToggleRight className="w-4 h-4 text-[var(--sy-success)]" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(automation.id)}
                        className="p-1.5 rounded text-[var(--sy-text-muted)] hover:text-[var(--sy-error)] hover:bg-[var(--sy-elevated)] transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default Automations;
