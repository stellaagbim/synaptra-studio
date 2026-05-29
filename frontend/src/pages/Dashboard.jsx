import { useApp } from "@/App";
import { useNavigate } from "react-router-dom";
import { 
  Play, Workflow, Brain, FlaskConical, ArrowRight,
  Activity, Cpu, Database, Clock, TrendingUp, Zap,
  CheckCircle2, AlertCircle, BarChart3
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const QuickAction = ({ icon: Icon, label, description, onClick, variant = "default" }) => {
  const variants = {
    default: "border-[var(--sy-border-default)] hover:border-[var(--sy-border-strong)]",
    primary: "border-[var(--sy-primary)]/30 bg-[var(--sy-primary-subtle)] hover:border-[var(--sy-primary)]/50",
  };
  
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border bg-[var(--sy-surface)] text-left transition-all duration-200 group ${variants[variant]}`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          variant === 'primary' 
            ? 'bg-[var(--sy-primary)]/20 text-[var(--sy-primary)]' 
            : 'bg-[var(--sy-elevated)] text-[var(--sy-text-tertiary)] group-hover:text-[var(--sy-text-secondary)]'
        }`}>
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--sy-text-primary)]">{label}</span>
            <ArrowRight className="w-4 h-4 text-[var(--sy-text-muted)] group-hover:text-[var(--sy-text-tertiary)] group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-xs text-[var(--sy-text-muted)] mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
};

const StatCard = ({ label, value, icon: Icon, trend, status }) => {
  const statusColors = {
    success: 'text-[var(--sy-success)]',
    warning: 'text-[var(--sy-warning)]',
    error: 'text-[var(--sy-error)]',
    neutral: 'text-[var(--sy-text-secondary)]',
  };
  
  return (
    <div className="sy-panel-solid p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="sy-label">{label}</span>
        <Icon className="w-4 h-4 text-[var(--sy-text-muted)]" strokeWidth={1.5} />
      </div>
      <div className={`sy-data text-2xl ${statusColors[status] || statusColors.neutral}`}>
        {value}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-2 text-xs text-[var(--sy-text-muted)]">
          <TrendingUp className="w-3 h-3" />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { tasks, systemStatus, navigate } = useApp();
  const nav = useNavigate();
  
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const avgScore = completedTasks.length > 0
    ? (completedTasks.reduce((acc, t) => acc + (t.evaluation?.overall_score || 0), 0) / completedTasks.length).toFixed(1)
    : '-';
  
  const recentTasks = tasks.slice(0, 5);
  const isOnline = systemStatus?.status === "operational";
  
  return (
    <div className="flex flex-col lg:flex-row sy-gap-section sy-animate-in" data-testid="dashboard-page">
      {/* Main Content */}
      <div className="flex-1 flex flex-col sy-gap-section min-w-0">
        {/* Hero Section */}
        <div className="sy-panel-solid p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="sy-label mb-2">Multimodal Agent Operations Hub</div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--sy-text-primary)] mb-2">
                SYNAPTRA STUDIO
              </h1>
              <p className="text-sm text-[var(--sy-text-tertiary)] max-w-md">
                Execute AI tasks, inspect memory, evaluate performance, and audit execution history.
              </p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
              isOnline 
                ? 'border-[var(--sy-success)]/30 bg-[var(--sy-success-glow)]' 
                : 'border-[var(--sy-error)]/30 bg-[var(--sy-error-glow)]'
            }`}>
              <div className={`sy-status-dot ${isOnline ? 'online' : 'error'}`} />
              <span className={`sy-data text-xs ${isOnline ? 'text-[var(--sy-success)]' : 'text-[var(--sy-error)]'}`}>
                {isOnline ? 'OPERATIONAL' : 'DEGRADED'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-4 sy-gap-section">
          <StatCard 
            label="Total Runs" 
            value={tasks.length} 
            icon={Activity}
            status="neutral"
          />
          <StatCard 
            label="Completed" 
            value={completedTasks.length} 
            icon={CheckCircle2}
            status="success"
          />
          <StatCard 
            label="Avg Score" 
            value={avgScore} 
            icon={BarChart3}
            status={parseFloat(avgScore) >= 80 ? 'success' : parseFloat(avgScore) >= 60 ? 'warning' : 'neutral'}
          />
          <StatCard 
            label="AI Engine" 
            value="GPT-5.2" 
            icon={Cpu}
            status="success"
          />
        </div>
        
        {/* Quick Actions */}
        <div>
          <div className="sy-label mb-4">Quick Actions</div>
          <div className="grid grid-cols-2 sy-gap-section">
            <QuickAction
              icon={Play}
              label="Run Task"
              description="Execute a new AI analysis task"
              onClick={() => nav('/task-runner')}
              variant="primary"
            />
            <QuickAction
              icon={FlaskConical}
              label="Evaluation Suite"
              description="Create or run benchmark evaluations"
              onClick={() => nav('/eval')}
            />
            <QuickAction
              icon={Brain}
              label="Inspect Memory"
              description="View agent memory and artifacts"
              onClick={() => nav('/memory')}
            />
            <QuickAction
              icon={Workflow}
              label="Automations"
              description="Design and manage workflows"
              onClick={() => nav('/automations')}
            />
          </div>
        </div>
      </div>
      
      {/* Right Panel - Recent Activity */}
      <div className="w-full lg:w-[340px] lg:flex-shrink-0 sy-panel-solid flex flex-col">
        <div className="sy-panel-header">
          <div>
            <h3 className="text-sm font-medium text-[var(--sy-text-primary)]">Recent Executions</h3>
            <p className="sy-label mt-1">{recentTasks.length} latest runs</p>
          </div>
          <button 
            onClick={() => nav('/history')}
            className="text-xs text-[var(--sy-primary)] hover:text-[var(--sy-primary-dim)] transition-colors"
          >
            View All
          </button>
        </div>
        
        <ScrollArea className="flex-1">
          {recentTasks.length === 0 ? (
            <div className="p-8 text-center text-[var(--sy-text-muted)]">
              <Zap className="w-10 h-10 mx-auto mb-4 opacity-30" strokeWidth={1} />
              <p className="text-sm">No executions yet</p>
              <p className="text-xs mt-1">Run a task to see activity</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {recentTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => nav('/task-runner')}
                  className="w-full p-3 rounded-lg bg-[var(--sy-surface)] border border-[var(--sy-border-subtle)] hover:border-[var(--sy-border-default)] transition-colors text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`sy-task-status ${task.status}`} />
                      <span className="sy-data text-[10px] text-[var(--sy-text-muted)]">
                        {task.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <span className={`sy-data text-xs ${
                      task.evaluation?.overall_score >= 80 ? 'text-[var(--sy-success)]' :
                      task.evaluation?.overall_score >= 60 ? 'text-[var(--sy-warning)]' :
                      'text-[var(--sy-text-muted)]'
                    }`}>
                      {task.evaluation?.overall_score?.toFixed(1) || '-'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--sy-text-secondary)] line-clamp-2 leading-relaxed">
                    {task.input_text?.slice(0, 80) || 'Task execution'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="sy-data text-[10px] text-[var(--sy-text-muted)]">
                      {new Date(task.created_at).toLocaleString('en-US', { 
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                    <ArrowRight className="w-3 h-3 text-[var(--sy-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default Dashboard;
