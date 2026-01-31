import { Settings, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const TopNav = ({ systemStatus }) => {
  const isOperational = systemStatus?.status === "operational";
  const statusText = !systemStatus 
    ? "Connecting..." 
    : isOperational 
      ? "System Operational" 
      : "System Degraded";

  return (
    <nav 
      className="h-14 flex items-center justify-between px-6 border-b bg-[#14171b]"
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      data-testid="top-navigation"
    >
      {/* Brand - restrained, clear */}
      <div className="flex items-center gap-3">
        <div 
          className="w-7 h-7 rounded-md bg-[#1a1d22] border flex items-center justify-center"
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          data-testid="brand-logo"
        >
          <Cpu className="w-4 h-4 text-[#3b9ea8]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span 
            className="font-semibold text-[15px] tracking-tight text-[#e8eaed]"
            data-testid="brand-name"
          >
            Synaptra Studio
          </span>
          <span className="text-[11px] text-[#6b7280] hidden sm:inline">
            Task Execution & Evaluation
          </span>
        </div>
      </div>

      {/* System Status - subtle, informative */}
      <div className="flex items-center gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#1a1d22] border cursor-default"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                data-testid="system-status-indicator"
              >
                <div 
                  className={`w-2 h-2 rounded-full ${
                    !systemStatus ? 'bg-[#b8860b]' :
                    isOperational ? 'bg-[#3d9970]' : 'bg-[#c0392b]'
                  }`} 
                />
                <span className="text-xs text-[#9ca3af]">
                  {statusText}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              className="bg-[#1a1d22] border-[#2a2d32] text-[13px]"
            >
              <div className="space-y-1.5 py-1">
                <div className="flex items-center justify-between gap-6">
                  <span className="text-[#6b7280]">AI Engine</span>
                  <span className={systemStatus?.ai_engine === "ready" ? "text-[#3d9970]" : "text-[#b8860b]"}>
                    {systemStatus?.ai_engine === "ready" ? "Ready" : "Unavailable"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span className="text-[#6b7280]">Database</span>
                  <span className={systemStatus?.database === "connected" ? "text-[#3d9970]" : "text-[#c0392b]"}>
                    {systemStatus?.database === "connected" ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-8 h-8 text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#1a1d22]"
                data-testid="settings-button"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-[#1a1d22] border-[#2a2d32]">
              Configuration
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </nav>
  );
};

export default TopNav;
