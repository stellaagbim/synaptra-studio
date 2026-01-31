import { 
  ChevronLeft, ChevronRight, BarChart2, Clock, Cpu, Hash, 
  Calendar, Layers, Gauge, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const METRICS_DEFINITION = [
  { 
    key: 'quality', 
    label: 'Quality', 
    description: 'Measures output completeness, structure, and depth',
    icon: Gauge 
  },
  { 
    key: 'relevance', 
    label: 'Relevance', 
    description: 'Alignment between input content and analysis output',
    icon: Layers 
  },
  { 
    key: 'efficiency', 
    label: 'Efficiency', 
    description: 'Processing speed relative to task complexity',
    icon: Activity 
  },
];

const getScoreLevel = (score) => {
  if (score >= 80) return { label: 'Excellent', color: '#3d9970', fillClass: 'metric-fill-success' };
  if (score >= 60) return { label: 'Good', color: '#b8860b', fillClass: 'metric-fill-warning' };
  if (score >= 40) return { label: 'Fair', color: '#b8860b', fillClass: 'metric-fill-warning' };
  return { label: 'Low', color: '#c0392b', fillClass: 'metric-fill-error' };
};

export const MetricsPanel = ({ task, collapsed, onToggleCollapse }) => {
  if (collapsed) {
    return (
      <aside 
        className="w-11 flex-shrink-0 border-l bg-[#14171b] flex flex-col"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        data-testid="metrics-panel-collapsed"
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-11 rounded-none text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#1a1d22]"
                onClick={onToggleCollapse}
                data-testid="expand-metrics-button"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-[#1a1d22] border-[#2a2d32]">
              Show Metrics
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </aside>
    );
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "—";
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const hasTask = !!task;
  const hasMetrics = task?.evaluation?.overall_score > 0;

  return (
    <aside 
      className="w-[300px] flex-shrink-0 flex flex-col border-l bg-[#14171b]"
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      data-testid="metrics-panel"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#3b9ea8]" />
          <span className="text-[13px] font-medium text-[#e8eaed]">Metrics & Metadata</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#1a1d22]"
          onClick={onToggleCollapse}
          data-testid="collapse-metrics-button"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 scroll-area">
        <div className="p-4 space-y-6">
          
          {/* Evaluation Metrics - Always visible */}
          <div data-testid="evaluation-scores">
            <div className="flex items-center justify-between mb-4">
              <span className="text-label">Evaluation Metrics</span>
              {!hasMetrics && (
                <span className="text-[10px] text-[#4b5563]">Awaiting execution</span>
              )}
            </div>
            
            <div className="space-y-4">
              {METRICS_DEFINITION.map((metric) => {
                const value = task?.evaluation?.[`${metric.key}_score`];
                const scoreInfo = value ? getScoreLevel(value) : null;
                const Icon = metric.icon;
                
                return (
                  <div key={metric.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-[#6b7280]" />
                        <span className="text-[12px] text-[#9ca3af]">{metric.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasMetrics ? (
                          <>
                            <span 
                              className="text-mono text-[12px] font-medium"
                              style={{ color: scoreInfo?.color }}
                            >
                              {value?.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-[#4b5563]">
                              {scoreInfo?.label}
                            </span>
                          </>
                        ) : (
                          <span className="text-mono text-[12px] text-[#4b5563]">—</span>
                        )}
                      </div>
                    </div>
                    <div className="metric-bar">
                      <div 
                        className={`metric-fill ${hasMetrics ? scoreInfo?.fillClass : 'metric-fill-neutral'}`}
                        style={{ width: hasMetrics ? `${value}%` : '0%' }}
                      />
                    </div>
                    <p className="text-[10px] text-[#4b5563] leading-relaxed">
                      {metric.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Overall Score */}
            <div 
              className="mt-5 pt-4 border-t flex items-center justify-between"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <span className="text-[13px] text-[#9ca3af]">Overall Score</span>
              <div 
                className={`px-3 py-1.5 rounded text-mono text-[16px] font-semibold ${
                  hasMetrics 
                    ? 'bg-[#1a1d22] border border-[#2a2d32]' 
                    : 'bg-[#1a1d22]/50'
                }`}
                style={{ 
                  color: hasMetrics 
                    ? getScoreLevel(task?.evaluation?.overall_score)?.color 
                    : '#4b5563' 
                }}
                data-testid="overall-score"
              >
                {hasMetrics ? task?.evaluation?.overall_score?.toFixed(1) : '—'}
              </div>
            </div>
          </div>

          {/* Performance */}
          <div data-testid="performance-metrics">
            <span className="text-label">Performance</span>
            
            <div 
              className="mt-3 p-3 rounded-md bg-[#0f1114] border"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#6b7280]" />
                  <span className="text-[12px] text-[#9ca3af]">Execution Time</span>
                </div>
                <span className="text-mono text-[12px] text-[#e8eaed]" data-testid="execution-time">
                  {formatDuration(task?.metadata?.processing_time_ms)}
                </span>
              </div>
            </div>
          </div>

          {/* Run Metadata */}
          <div data-testid="run-metadata">
            <span className="text-label">Run Metadata</span>
            
            <div 
              className="mt-3 p-3 rounded-md bg-[#0f1114] border space-y-3"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-[#6b7280]" />
                  <span className="text-[11px] text-[#6b7280]">Task ID</span>
                </div>
                <span className="text-mono text-[10px] text-[#9ca3af]" data-testid="task-id">
                  {task?.id ? task.id.slice(0, 12).toUpperCase() : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#6b7280]" />
                  <span className="text-[11px] text-[#6b7280]">Created</span>
                </div>
                <span className="text-[10px] text-[#9ca3af]" data-testid="created-at">
                  {formatTimestamp(task?.created_at)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#6b7280]" />
                  <span className="text-[11px] text-[#6b7280]">Completed</span>
                </div>
                <span className="text-[10px] text-[#9ca3af]" data-testid="completed-at">
                  {formatTimestamp(task?.completed_at)}
                </span>
              </div>

              <div 
                className="pt-3 border-t space-y-3"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-[#6b7280]" />
                    <span className="text-[11px] text-[#6b7280]">Model</span>
                  </div>
                  <span className="text-mono text-[10px] text-[#9ca3af]" data-testid="model-used">
                    {task?.metadata?.model_used || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[#6b7280]" />
                    <span className="text-[11px] text-[#6b7280]">Modality</span>
                  </div>
                  <span className="text-[10px] text-[#9ca3af] capitalize" data-testid="input-modality">
                    {task?.metadata?.input_modality || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </ScrollArea>
    </aside>
  );
};

export default MetricsPanel;
