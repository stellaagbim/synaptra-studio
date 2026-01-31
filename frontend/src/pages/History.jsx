import { useApp } from "@/App";
import { History as HistoryIcon, Search, Download, Filter, FileText, Code, Image, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const typeIcons = {
  text_summarization: FileText,
  code_analysis: Code,
  image_analysis: Image,
  general_analysis: Zap,
};

export const History = () => {
  const { tasks, setSelectedTask, navigate } = useApp();

  return (
    <div className="h-full flex flex-col" data-testid="history-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">History</h1>
          <p className="text-sm text-white/50">Searchable run ledger with full audit trail</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input 
              placeholder="Search runs..." 
              className="pl-10 w-64 bg-[#161b22] border-[rgba(48,54,61,0.8)] text-white"
            />
          </div>
          <Button variant="outline" className="border-[rgba(48,54,61,0.8)] text-white/70">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" className="border-[rgba(48,54,61,0.8)] text-white/70">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {tasks.length === 0 ? (
        <div className="card-base flex-1 flex items-center justify-center">
          <div className="text-center">
            <HistoryIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No runs recorded</h3>
            <p className="text-sm text-white/50">Execute tasks to populate the history ledger</p>
          </div>
        </div>
      ) : (
        <div className="card-base flex-1 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-[rgba(48,54,61,0.8)] text-xs text-white/40 uppercase tracking-wider">
            <div className="col-span-2">Task ID</div>
            <div className="col-span-3">Input</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Score</div>
            <div className="col-span-2">Time</div>
            <div className="col-span-1">Status</div>
          </div>
          
          <ScrollArea className="h-[calc(100%-50px)]">
            {tasks.map((task) => {
              const Icon = typeIcons[task.task_type] || Zap;
              return (
                <div 
                  key={task.id}
                  className="grid grid-cols-12 gap-4 p-4 border-b border-[rgba(48,54,61,0.3)] hover:bg-white/[0.02] cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedTask(task);
                    navigate('/task-runner');
                  }}
                >
                  <div className="col-span-2 font-mono text-sm text-cyan-400">
                    {task.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div className="col-span-3 text-sm text-white/70 truncate">
                    {task.input_text?.slice(0, 40) || '—'}
                  </div>
                  <div className="col-span-2 flex items-center gap-2 text-sm text-white/60">
                    <Icon className="w-4 h-4" />
                    {task.task_type?.replace('_', ' ') || 'analysis'}
                  </div>
                  <div className="col-span-2 text-sm font-mono">
                    <span className={task.evaluation?.overall_score >= 80 ? 'text-green-400' : task.evaluation?.overall_score >= 60 ? 'text-amber-400' : 'text-white/50'}>
                      {task.evaluation?.overall_score?.toFixed(1) || '—'}
                    </span>
                  </div>
                  <div className="col-span-2 text-sm text-white/50">
                    {new Date(task.created_at).toLocaleDateString()}
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
