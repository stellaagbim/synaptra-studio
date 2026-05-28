import { useApp } from "@/App";
import { Clock, Cpu, Menu } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const Header = ({ title, onMenuClick }) => {
  const { systemStatus } = useApp();

  const isOperational = systemStatus?.status === "operational";

  return (
    <header className="sy-header" data-testid="header">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="lg:hidden p-2 -ml-2 rounded text-[var(--sy-text-secondary)] hover:bg-[var(--sy-elevated)]"
          data-testid="menu-toggle"
        >
          <Menu className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <h1 className="sy-header-title truncate">{title}</h1>
      </div>

      <div className="sy-header-status">
        <div className="hidden md:flex sy-status-indicator">
          <Cpu className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>GPT-5.2</span>
        </div>

        <div className="hidden md:block h-4 w-px bg-[var(--sy-border-default)]" />

        <div className="hidden sm:flex sy-status-indicator">
          <div className={`sy-status-dot ${isOperational ? 'online' : 'error'}`} />
          <span>{isOperational ? 'Operational' : 'Degraded'}</span>
        </div>

        <div className="hidden sm:block h-4 w-px bg-[var(--sy-border-default)]" />

        <div className="hidden lg:flex sy-status-indicator">
          <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div className="hidden lg:block h-4 w-px bg-[var(--sy-border-default)]" />

        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
