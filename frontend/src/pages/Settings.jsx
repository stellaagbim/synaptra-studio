import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/App";
import { Cpu, Database, Palette, Shield, Loader2, CheckCircle2 } from "lucide-react";
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
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Settings = () => {
  const { settings, updateSettings } = useApp();
  const [providers, setProviders] = useState([]);
  const [localSettings, setLocalSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    axios.get(`${API}/providers`).then(res => setProviders(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings({ ...settings });
    }
  }, [settings, localSettings]);

  const update = useCallback((key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const handleSave = async () => {
    if (!localSettings) return;
    setSaving(true);
    try {
      await updateSettings(localSettings);
      setDirty(false);
    } catch (e) {
      // toast handled by updateSettings
    } finally {
      setSaving(false);
    }
  };

  if (!localSettings) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--sy-primary)]" />
      </div>
    );
  }

  const activeProvider = providers.find(p => p.id === localSettings.default_provider);
  const availableModels = activeProvider?.models || [];

  return (
    <div className="max-w-3xl mx-auto sy-animate-in" data-testid="settings-page">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--sy-text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--sy-text-tertiary)]">Configure Synaptra Studio preferences</p>
      </div>

      <div className="space-y-6">
        {/* Model Configuration */}
        <div className="card-base p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--sy-text-primary)]">Model Configuration</h3>
              <p className="text-xs text-[var(--sy-text-tertiary)]">Select default AI provider and model</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--sy-text-tertiary)] mb-1.5 block">Provider</label>
              <Select
                value={localSettings.default_provider}
                onValueChange={(val) => {
                  update("default_provider", val);
                  // Reset model to first available for new provider
                  const newProvider = providers.find(p => p.id === val);
                  if (newProvider?.models?.length) {
                    update("default_model", newProvider.models[0].id);
                  }
                }}
              >
                <SelectTrigger className="bg-[var(--sy-surface)] border-[var(--sy-border-default)] text-[var(--sy-text-primary)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--sy-elevated)] border-[var(--sy-border-default)]">
                  {providers.map(p => (
                    <SelectItem key={p.id} value={p.id} disabled={!p.available}>
                      <span className="flex items-center gap-2">
                        {p.name}
                        {!p.available && (
                          <span className="text-[10px] text-[var(--sy-text-muted)] ml-1">no key</span>
                        )}
                        {p.available && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-[var(--sy-text-tertiary)] mb-1.5 block">Model</label>
              <Select
                value={localSettings.default_model}
                onValueChange={(val) => update("default_model", val)}
              >
                <SelectTrigger className="bg-[var(--sy-surface)] border-[var(--sy-border-default)] text-[var(--sy-text-primary)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--sy-elevated)] border-[var(--sy-border-default)]">
                  {availableModels.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Provider Status */}
          <div className="mt-4 pt-4 border-t border-[var(--sy-border-subtle)]">
            <div className="text-xs text-[var(--sy-text-muted)] mb-2">Provider Status</div>
            <div className="flex flex-wrap gap-3">
              {providers.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs border ${
                    p.available
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                      : 'border-[var(--sy-border-default)] bg-transparent text-[var(--sy-text-muted)]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${p.available ? 'bg-emerald-400' : 'bg-[var(--sy-border-strong)]'}`} />
                  {p.name}
                </div>
              ))}
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
              <h3 className="text-sm font-medium text-[var(--sy-text-primary)]">Storage</h3>
              <p className="text-xs text-[var(--sy-text-tertiary)]">Database and persistence settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[var(--sy-text-primary)]">Enable task persistence</div>
                <div className="text-xs text-[var(--sy-text-muted)]">Store all task runs in database</div>
              </div>
              <Switch
                checked={localSettings.enable_persistence}
                onCheckedChange={(val) => update("enable_persistence", val)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[var(--sy-text-primary)]">Enable memory</div>
                <div className="text-xs text-[var(--sy-text-muted)]">RAG memory and semantic search</div>
              </div>
              <Switch
                checked={localSettings.enable_memory}
                onCheckedChange={(val) => update("enable_memory", val)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[var(--sy-text-primary)]">Store artifacts</div>
                <div className="text-xs text-[var(--sy-text-muted)]">Save generated files and exports</div>
              </div>
              <Switch
                checked={localSettings.enable_artifacts}
                onCheckedChange={(val) => update("enable_artifacts", val)}
              />
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
              <h3 className="text-sm font-medium text-[var(--sy-text-primary)]">Appearance</h3>
              <p className="text-xs text-[var(--sy-text-tertiary)]">Visual preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[var(--sy-text-primary)]">Reduced motion</div>
                <div className="text-xs text-[var(--sy-text-muted)]">Minimize animations</div>
              </div>
              <Switch
                checked={localSettings.reduced_motion}
                onCheckedChange={(val) => update("reduced_motion", val)}
              />
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
              <h3 className="text-sm font-medium text-[var(--sy-text-primary)]">Safety Controls</h3>
              <p className="text-xs text-[var(--sy-text-tertiary)]">Agent execution boundaries</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-[var(--sy-text-tertiary)] mb-1.5 block">Max input size (characters)</label>
              <Input
                type="number"
                value={localSettings.max_input_size}
                onChange={(e) => update("max_input_size", parseInt(e.target.value) || 50000)}
                className="bg-[var(--sy-surface)] border-[var(--sy-border-default)] text-[var(--sy-text-primary)] w-48"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {dirty && (
            <span className="text-xs text-amber-400">Unsaved changes</span>
          )}
          {!dirty && <span />}
          <Button
            className="bg-cyan-500 hover:bg-cyan-400 text-[#0d1117]"
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : dirty ? null : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Saving...' : dirty ? 'Save Changes' : 'Saved'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
