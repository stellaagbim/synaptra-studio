import { Brain, Search, Clock, Database } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Memory = () => {
  return (
    <div className="max-w-5xl mx-auto" data-testid="memory-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Memory</h1>
          <p className="text-sm text-white/50">Inspect system memory and context management</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input 
            placeholder="Search memory items..." 
            className="pl-10 w-64 bg-[#161b22] border-[rgba(48,54,61,0.8)] text-white"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Items', value: '0', icon: Database },
          { label: 'Active Context', value: '0 tokens', icon: Brain },
          { label: 'Last Updated', value: '—', icon: Clock },
        ].map((stat) => (
          <div key={stat.label} className="card-base p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-xs text-white/40">{stat.label}</div>
                <div className="text-lg font-semibold text-white">{stat.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="card-base p-8 text-center">
        <Brain className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Memory is empty</h3>
        <p className="text-sm text-white/50 max-w-md mx-auto">
          Execute tasks to populate the memory store. Memory items include saved summaries, artifacts, and context links.
        </p>
      </div>
    </div>
  );
};

export default Memory;
