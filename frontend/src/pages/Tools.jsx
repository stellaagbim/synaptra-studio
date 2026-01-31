import { Wrench, Plus, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const defaultTools = [
  { name: 'Code Executor', description: 'Execute code snippets safely', enabled: true },
  { name: 'Web Search', description: 'Search the web for information', enabled: false },
  { name: 'File Reader', description: 'Read and parse file contents', enabled: true },
  { name: 'Calculator', description: 'Perform mathematical operations', enabled: true },
];

export const Tools = () => {
  return (
    <div className="max-w-5xl mx-auto" data-testid="tools-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Tools</h1>
          <p className="text-sm text-white/50">Manage agent tool permissions and registry</p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-400 text-[#0d1117]">
          <Plus className="w-4 h-4 mr-2" />
          Register Tool
        </Button>
      </div>
      
      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-[rgba(48,54,61,0.8)] flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-white/70">Tool permissions affect agent capabilities</span>
        </div>
        
        <div className="divide-y divide-[rgba(48,54,61,0.5)]">
          {defaultTools.map((tool) => (
            <div key={tool.name} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{tool.name}</div>
                  <div className="text-xs text-white/50">{tool.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Clock className="w-3.5 h-3.5" />
                  Never invoked
                </div>
                <Switch checked={tool.enabled} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tools;
