import { useState, useEffect, useCallback } from "react";
import {
  Wrench, Plus, Shield, Clock, Trash2, Code, Search, FileText,
  Calculator, Loader2, Terminal, Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORY_CONFIG = {
  code: { icon: Code, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  search: { icon: Search, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  data: { icon: Database, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  utility: { icon: Calculator, color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

export const Tools = () => {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("utility");

  const fetchTools = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/tools`);
      setTools(data);
    } catch (e) {
      console.error("Failed to fetch tools:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTools(); }, [fetchTools]);

  const toggleTool = async (toolId, enabled) => {
    try {
      const { data } = await axios.put(`${API}/tools/${toolId}`, { enabled });
      setTools(prev => prev.map(t => t.id === toolId ? data : t));
    } catch (e) {
      toast.error("Failed to update tool");
    }
  };

  const registerTool = async () => {
    if (!newName.trim()) return;
    try {
      const { data } = await axios.post(`${API}/tools`, {
        name: newName,
        description: newDesc,
        category: newCategory,
        enabled: true,
      });
      setTools(prev => [...prev, data]);
      setIsRegistering(false);
      setNewName("");
      setNewDesc("");
      setNewCategory("utility");
      toast.success("Tool registered");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to register tool");
    }
  };

  const deleteTool = async (toolId) => {
    try {
      await axios.delete(`${API}/tools/${toolId}`);
      setTools(prev => prev.filter(t => t.id !== toolId));
      toast.success("Tool removed");
    } catch (e) {
      toast.error("Failed to delete tool");
    }
  };

  const enabledCount = tools.filter(t => t.enabled).length;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--sy-primary)]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto sy-animate-in" data-testid="tools-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Tools</h1>
          <p className="text-sm text-white/50">
            {enabledCount} of {tools.length} tools active
          </p>
        </div>
        <Button
          className="bg-cyan-500 hover:bg-cyan-400 text-[#0d1117]"
          onClick={() => setIsRegistering(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Register Tool
        </Button>
      </div>

      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-[rgba(48,54,61,0.8)] flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-white/70">Tool permissions affect agent capabilities during task execution</span>
        </div>

        <div className="divide-y divide-[rgba(48,54,61,0.5)]">
          {tools.map((tool) => {
            const catConfig = CATEGORY_CONFIG[tool.category] || CATEGORY_CONFIG.utility;
            const Icon = catConfig.icon;
            return (
              <div key={tool.id} className="p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg ${catConfig.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${catConfig.color}`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{tool.name}</div>
                    <div className="text-xs text-white/50">{tool.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${catConfig.bg} ${catConfig.color}`}>
                      {tool.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Clock className="w-3.5 h-3.5" />
                    {tool.invocation_count > 0
                      ? `${tool.invocation_count} invocations`
                      : 'Never invoked'
                    }
                  </div>
                  <button
                    onClick={() => deleteTool(tool.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-[var(--sy-error)] transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <Switch
                    checked={tool.enabled}
                    onCheckedChange={(val) => toggleTool(tool.id, val)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Register Tool Dialog */}
      <Dialog open={isRegistering} onOpenChange={setIsRegistering}>
        <DialogContent className="bg-[var(--sy-elevated)] border-[var(--sy-border-default)] text-[var(--sy-text-primary)]">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">Register New Tool</DialogTitle>
            <DialogDescription className="text-[var(--sy-text-tertiary)]">
              Add a tool to the agent's capability registry
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="sy-label block mb-2">Tool Name</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., JSON Parser"
                className="sy-input"
              />
            </div>
            <div>
              <label className="sy-label block mb-2">Description</label>
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What does this tool do?"
                className="sy-input sy-textarea min-h-[60px]"
              />
            </div>
            <div>
              <label className="sy-label block mb-2">Category</label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="bg-[#0d1117] border-[rgba(48,54,61,0.8)] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[rgba(48,54,61,0.8)]">
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="search">Search</SelectItem>
                  <SelectItem value="data">Data</SelectItem>
                  <SelectItem value="utility">Utility</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsRegistering(false)}
              className="sy-btn sy-btn-ghost"
            >
              Cancel
            </Button>
            <Button
              onClick={registerTool}
              disabled={!newName.trim()}
              className="sy-btn sy-btn-primary"
            >
              Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tools;
