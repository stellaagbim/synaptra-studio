import { Settings as SettingsIcon, Cpu, Database, Palette, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Settings = () => {
  return (
    <div className="max-w-3xl mx-auto" data-testid="settings-page">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-white/50">Configure Synaptra Studio preferences</p>
      </div>
      
      <div className="space-y-6">
        {/* Model Configuration */}
        <div className="card-base p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Model Configuration</h3>
              <p className="text-xs text-white/50">Select default AI provider and model</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Provider</label>
              <Select defaultValue="openai">
                <SelectTrigger className="bg-[#0d1117] border-[rgba(48,54,61,0.8)] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[rgba(48,54,61,0.8)]">
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic" disabled>Anthropic (coming soon)</SelectItem>
                  <SelectItem value="gemini" disabled>Google Gemini (coming soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Model</label>
              <Select defaultValue="gpt-5.2">
                <SelectTrigger className="bg-[#0d1117] border-[rgba(48,54,61,0.8)] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[rgba(48,54,61,0.8)]">
                  <SelectItem value="gpt-5.2">GPT-5.2</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Storage */}
        <div className="card-base p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Storage</h3>
              <p className="text-xs text-white/50">Database and persistence settings</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">Enable task persistence</div>
                <div className="text-xs text-white/40">Store all task runs in database</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">Store artifacts</div>
                <div className="text-xs text-white/40">Save generated files and exports</div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
        
        {/* Appearance */}
        <div className="card-base p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Appearance</h3>
              <p className="text-xs text-white/50">Visual preferences</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">Reduced motion</div>
                <div className="text-xs text-white/40">Minimize animations</div>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">Compact mode</div>
                <div className="text-xs text-white/40">Reduce spacing and padding</div>
              </div>
              <Switch />
            </div>
          </div>
        </div>
        
        {/* Safety */}
        <div className="card-base p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Safety Controls</h3>
              <p className="text-xs text-white/50">Agent execution boundaries</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Max input size (characters)</label>
              <Input 
                type="number" 
                defaultValue="50000"
                className="bg-[#0d1117] border-[rgba(48,54,61,0.8)] text-white w-48"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">Require confirmation for destructive actions</div>
                <div className="text-xs text-white/40">Prompt before deletions</div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button className="bg-cyan-500 hover:bg-cyan-400 text-[#0d1117]">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
