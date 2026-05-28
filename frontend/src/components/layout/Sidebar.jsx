import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Play, 
  FlaskConical,
  Workflow, 
  Brain, 
  Wrench, 
  History, 
  Settings,
  Activity
} from "lucide-react";

const navSections = [
  {
    label: "Operations",
    items: [
      { path: "/", label: "Dashboard", icon: LayoutDashboard },
      { path: "/task-runner", label: "Task Runner", icon: Play },
      { path: "/eval", label: "Evaluation", icon: FlaskConical },
    ]
  },
  {
    label: "System",
    items: [
      { path: "/automations", label: "Automations", icon: Workflow },
      { path: "/memory", label: "Memory", icon: Brain },
      { path: "/tools", label: "Tools", icon: Wrench },
    ]
  },
  {
    label: "Audit",
    items: [
      { path: "/history", label: "History", icon: History },
      { path: "/settings", label: "Settings", icon: Settings },
    ]
  }
];

const Sidebar = ({ systemStatus, isOpen, onClose }) => {
  const location = useLocation();

  const isOnline = systemStatus?.status === "operational";
  const aiReady = systemStatus?.ai_engine === "ready";

  return (
    <>
      <div
        className={`sy-sidebar-backdrop ${isOpen ? 'show' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
    <div className={`sy-sidebar ${isOpen ? 'open' : ''}`} data-testid="sidebar">
      {/* Brand */}
      <div className="sy-sidebar-brand">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--sy-primary-subtle)] border border-[var(--sy-border-active)] flex items-center justify-center">
            <Activity className="w-5 h-5 text-[var(--sy-primary)]" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-[15px] font-semibold tracking-tight text-[var(--sy-text-primary)]">
              SYNAPTRA
            </div>
            <div className="sy-label mt-0.5">
              Control Console
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="sy-sidebar-nav">
        {navSections.map((section) => (
          <div key={section.label} className="sy-nav-section">
            <div className="sy-nav-section-label">{section.label}</div>
            {section.items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sy-nav-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon className="sy-nav-icon" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      
      {/* Status Footer */}
      <div className="sy-sidebar-status">
        <div className="flex items-center justify-between mb-3">
          <span className="sy-label">System Status</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`sy-status-dot ${isOnline ? 'online' : 'error'}`} />
              <span className="text-xs text-[var(--sy-text-tertiary)]">Core</span>
            </div>
            <span className="sy-data text-[10px] text-[var(--sy-text-muted)]">
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`sy-status-dot ${aiReady ? 'online' : 'error'}`} />
              <span className="text-xs text-[var(--sy-text-tertiary)]">AI Engine</span>
            </div>
            <span className="sy-data text-[10px] text-[var(--sy-text-muted)]">
              {aiReady ? 'READY' : 'ERROR'}
            </span>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
