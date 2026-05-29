import { useState, useMemo } from "react";
import { useApp } from "@/App";
import { History as HistoryIcon, Search, Filter, FileText, Code, Image, Zap, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const typeIcons = {
  text_summarization: FileText,
  code_analysis: Code,
  image_analysis: Image,
  general_analysis: Zap,
  document_processing: FileText,
};

const TYPE_FILTERS = [
  { value: "all", label: "All Types" },
  { value: "general_analysis", label: "General" },
  { value: "text_summarization", label: "Text" },
  { value: "code_analysis", label: "Code" },
  { value: "image_analysis", label: "Image" },
  { value: "document_processing", label: "Document" },
];

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

export const History = () => {
  const { tasks, navigate } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesInput = task.input_text?.toLowerCase().includes(q);
        const matchesId = task.id?.toLowerCase().includes(q);
        const matchesOutput = task.output?.toLowerCase().includes(q);
        if (!matchesInput && !matchesId && !matchesOutput) return false;
      }

      // Type filter
      if (typeFilter !== "all" && task.task_type !== typeFilter) return false;

      // Status filter
      if (statusFilter !== "all" && task.status !== statusFilter) return false;

      return true;
    });
  }, [tasks, searchQuery, typeFilter, statusFilter]);

  const hasActiveFilters = searchQuery || typeFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="flex flex-col sy-animate-in" data-testid="history-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--sy-text-primary)]">History</h1>
          <p className="text-sm text-[var(--sy-text-tertiary)]">
            {filteredTasks.length === tasks.length
              ? `${tasks.length} total runs`
              : `${filteredTasks.length} of ${tasks.length} runs`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sy-text-muted)]" />
            <Input
              placeholder="Search runs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64 bg-[var(--sy-elevated)] border-[var(--sy-border-default)] text-[var(--sy-text-primary)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--sy-text-muted)] hover:text-[var(--sy-text-secondary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            className={`border-[var(--sy-border-default)] ${showFilters ? 'text-[var(--sy-primary)] border-[var(--sy-primary)]/30' : 'text-[var(--sy-text-secondary)]'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
            {hasActiveFilters && (
              <span className="ml-2 w-2 h-2 rounded-full bg-[var(--sy-primary)]" />
            )}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="mb-4 flex items-center gap-4 p-3 rounded-lg bg-[var(--sy-surface)] border border-[var(--sy-border-subtle)] sy-animate-in">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--sy-text-muted)] uppercase tracking-wider">Type</span>
            <div className="flex gap-1">
              {TYPE_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setTypeFilter(f.value)}
                  className={`px-2.5 py-1 rounded text-[11px] transition-all ${
                    typeFilter === f.value
                      ? 'bg-[var(--sy-primary-subtle)] text-[var(--sy-primary)]'
                      : 'text-[var(--sy-text-muted)] hover:text-[var(--sy-text-secondary)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="w-px h-5 bg-[var(--sy-border-subtle)]" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--sy-text-muted)] uppercase tracking-wider">Status</span>
            <div className="flex gap-1">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-2.5 py-1 rounded text-[11px] transition-all ${
                    statusFilter === f.value
                      ? 'bg-[var(--sy-primary-subtle)] text-[var(--sy-primary)]'
                      : 'text-[var(--sy-text-muted)] hover:text-[var(--sy-text-secondary)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {hasActiveFilters && (
            <>
              <div className="w-px h-5 bg-[var(--sy-border-subtle)]" />
              <button
                onClick={clearFilters}
                className="text-[11px] text-[var(--sy-error)] hover:underline"
              >
                Clear all
              </button>
            </>
          )}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="card-base flex-1 flex items-center justify-center">
          <div className="text-center">
            <HistoryIcon className="w-12 h-12 text-[var(--sy-text-void)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--sy-text-primary)] mb-2">No runs recorded</h3>
            <p className="text-sm text-[var(--sy-text-tertiary)]">Execute tasks to populate the history ledger</p>
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card-base flex-1 flex items-center justify-center">
          <div className="text-center">
            <Search className="w-12 h-12 text-[var(--sy-text-void)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--sy-text-primary)] mb-2">No matching runs</h3>
            <p className="text-sm text-[var(--sy-text-tertiary)]">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="text-sm text-[var(--sy-primary)] mt-3 hover:underline">
              Clear filters
            </button>
          </div>
        </div>
      ) : (
        <div className="card-base flex-1 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-[var(--sy-border-default)] text-xs text-[var(--sy-text-muted)] uppercase tracking-wider">
            <div className="col-span-2">Task ID</div>
            <div className="col-span-3">Input</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-1">Provider</div>
            <div className="col-span-1">Score</div>
            <div className="col-span-2">Time</div>
            <div className="col-span-1">Status</div>
          </div>

          <ScrollArea className="h-[calc(100%-50px)]">
            {filteredTasks.map((task) => {
              const Icon = typeIcons[task.task_type] || Zap;
              return (
                <div
                  key={task.id}
                  className="grid grid-cols-12 gap-4 p-4 border-b border-[var(--sy-border-subtle)] hover:bg-[var(--sy-surface)]/[0.02] cursor-pointer transition-colors"
                  onClick={() => navigate('/task-runner')}
                >
                  <div className="col-span-2 font-mono text-sm text-cyan-400">
                    {task.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div className="col-span-3 text-sm text-[var(--sy-text-secondary)] truncate">
                    {task.input_text?.slice(0, 40) || '-'}
                  </div>
                  <div className="col-span-2 flex items-center gap-2 text-sm text-[var(--sy-text-secondary)]">
                    <Icon className="w-4 h-4" />
                    {task.task_type?.replace(/_/g, ' ') || 'analysis'}
                  </div>
                  <div className="col-span-1 text-sm text-[var(--sy-text-tertiary)] capitalize">
                    {task.metadata?.provider || '-'}
                  </div>
                  <div className="col-span-1 text-sm font-mono">
                    <span className={task.evaluation?.overall_score >= 80 ? 'text-green-400' : task.evaluation?.overall_score >= 60 ? 'text-amber-400' : 'text-[var(--sy-text-tertiary)]'}>
                      {task.evaluation?.overall_score?.toFixed(1) || '-'}
                    </span>
                  </div>
                  <div className="col-span-2 text-sm text-[var(--sy-text-tertiary)]">
                    {new Date(task.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                  <div className="col-span-1">
                    <div className={`w-2 h-2 rounded-full ${
                      task.status === 'completed' ? 'bg-green-400' :
                      task.status === 'failed' ? 'bg-red-400' : 'bg-amber-400'
                    }`} />
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default History;
