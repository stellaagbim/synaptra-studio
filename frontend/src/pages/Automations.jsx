import { Workflow, Plus, Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Automations = () => {
  return (
    <div className="max-w-5xl mx-auto" data-testid="automations-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Automations</h1>
          <p className="text-sm text-white/50">Create repeatable agent workflows</p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-400 text-[#0d1117]">
          <Plus className="w-4 h-4 mr-2" />
          New Automation
        </Button>
      </div>
      
      <div className="card-base p-8 text-center">
        <Workflow className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No automations configured</h3>
        <p className="text-sm text-white/50 max-w-md mx-auto mb-6">
          Define triggers, input templates, and output destinations to create repeatable agent workflows. Automations can be scheduled or event-driven.
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" className="border-[rgba(48,54,61,0.8)] text-white/70">
            <Clock className="w-4 h-4 mr-2" />
            Scheduled
          </Button>
          <Button variant="outline" className="border-[rgba(48,54,61,0.8)] text-white/70">
            <Play className="w-4 h-4 mr-2" />
            Manual Trigger
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Automations;
