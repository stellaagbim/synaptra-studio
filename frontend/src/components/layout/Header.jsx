import { useApp } from "@/App";
import { Clock, Cpu } from "lucide-react";

const Header = ({ title }) => {
  const { systemStatus } = useApp();
  
  const isOperational = systemStatus?.status === "operational";
  
  return (
    <header className="sy-header" data-testid="header">
      <h1 className="sy-header-title">{title}</h1>
      
      <div className="sy-header-status">
        <div className="sy-status-indicator">
          <Cpu className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>GPT-5.2</span>
        </div>
        
        <div className="h-4 w-px bg-[var(--sy-border-default)]" />
        
        <div className="sy-status-indicator">
          <div className={`sy-status-dot ${isOperational ? 'online' : 'error'}`} />
          <span>{isOperational ? 'Operational' : 'Degraded'}</span>
        </div>
        
        <div className="h-4 w-px bg-[var(--sy-border-default)]" />
        
        <div className="sy-status-indicator">
          <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
