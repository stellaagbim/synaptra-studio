import { useState, useEffect } from "react";
import { useApp } from "@/App";
import {
  Brain, Search, Clock, Database, Trash2, Sparkles,
  FileText, MessageSquare, BookOpen, Link2, X, Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip";

const MEMORY_TYPE_CONFIG = {
  summary: { label: "Summary", color: "text-[var(--sy-primary)]", bg: "bg-[var(--sy-primary-subtle)]", border: "border-[var(--sy-primary)]/20", icon: FileText },
  context: { label: "Context", color: "text-[var(--sy-success)]", bg: "bg-[var(--sy-success-glow)]", border: "border-[var(--sy-success)]/20", icon: MessageSquare },
  artifact: { label: "Artifact", color: "text-[var(--sy-amber)]", bg: "bg-[var(--sy-amber-subtle)]", border: "border-[var(--sy-amber)]/20", icon: BookOpen },
  reference: { label: "Reference", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: Link2 },
};

const TYPE_FILTERS = ["all", "summary", "context", "artifact", "reference"];

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="sy-panel-solid p-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-[var(--sy-primary-subtle)] flex items-center justify-center">
        <Icon className="w-5 h-5 text-[var(--sy-primary)]" strokeWidth={1.5} />
      </div>
      <div>
        <div className="sy-label">{label}</div>
        <div className="sy-data text-lg text-[var(--sy-text-primary)]">{value}</div>
      </div>
    </div>
  </div>
);

const MemoryItemCard = ({ item, similarity, onDelete }) => {
  const config = MEMORY_TYPE_CONFIG[item.memory_type] || MEMORY_TYPE_CONFIG.context;
  const TypeIcon = config.icon;
  const preview = item.content?.length > 200 ? item.content.slice(0, 200) + "..." : item.content;

  return (
    <div className="sy-panel-solid p-4 transition-all duration-200 hover:border-[var(--sy-border-strong)]" data-testid="memory-item">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${config.bg} ${config.color} ${config.border} border text-[10px] font-mono uppercase tracking-wider px-2 py-0.5`}>
            <TypeIcon className="w-3 h-3 mr-1" strokeWidth={1.5} />
            {config.label}
          </Badge>
          {similarity !== undefined && (
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1 rounded-full bg-[var(--sy-border-void)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--sy-primary)]"
                  style={{ width: `${Math.round(similarity * 100)}%` }}
                />
              </div>
              <span className="sy-data text-[10px] text-[var(--sy-primary)]">
                {(similarity * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onDelete(item.id)}
                className="p-1.5 rounded-md hover:bg-[var(--sy-error-glow)] text-[var(--sy-text-muted)] hover:text-[var(--sy-error)] transition-colors"
                data-testid="delete-memory-item"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left"><p>Delete memory item</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <p className="text-sm text-[var(--sy-text-secondary)] leading-relaxed mb-3">
        {preview}
      </p>

      <div className="flex items-center gap-4">
        <span className="sy-label">{item.source}</span>
        <span className="sy-data text-[10px] text-[var(--sy-text-muted)]">
          {item.task_id?.slice(0, 8).toUpperCase()}
        </span>
        <span className="sy-data text-[10px] text-[var(--sy-text-muted)] ml-auto">
          {new Date(item.created_at).toLocaleString("en-US", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
          })}
        </span>
      </div>
    </div>
  );
};

export const Memory = () => {
  const { memory, memoryStats, fetchMemory, fetchMemoryStats, searchMemory, deleteMemoryItem } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetchMemory();
    fetchMemoryStats();
  }, [fetchMemory, fetchMemoryStats]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchMemory(searchQuery.trim());
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  const handleDelete = async (itemId) => {
    await deleteMemoryItem(itemId);
    if (searchResults) {
      setSearchResults(prev => prev.filter(r => r.item.id !== itemId));
    }
    fetchMemory();
  };

  const displayItems = searchResults
    ? searchResults.map(r => ({ ...r.item, _similarity: r.similarity }))
    : memory;

  const filteredItems = activeFilter === "all"
    ? displayItems
    : displayItems.filter(item => item.memory_type === activeFilter);

  const lastUpdated = memory.length > 0
    ? new Date(memory[0].created_at).toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
      })
    : "\u2014";

  return (
    <div className="h-full flex flex-col sy-animate-in" data-testid="memory-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--sy-text-primary)]">Memory</h1>
          <p className="text-sm text-[var(--sy-text-tertiary)]">Semantic memory store with vector embeddings and retrieval</p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sy-text-muted)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Semantic search..."
              className="pl-10 w-64 bg-[var(--sy-surface)] border-[var(--sy-border-default)] text-[var(--sy-text-primary)] placeholder:text-[var(--sy-text-muted)] focus:border-[var(--sy-primary)]"
              data-testid="memory-search-input"
            />
            {searchResults && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--sy-text-muted)] hover:text-[var(--sy-text-secondary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="sy-btn sy-btn-primary text-sm px-4 py-2"
            data-testid="memory-search-button"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" strokeWidth={1.5} />}
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Items" value={memoryStats?.total_items ?? 0} icon={Database} />
        <StatCard label="Embedded" value={memoryStats?.total_with_embeddings ?? 0} icon={Brain} />
        <StatCard label="Last Updated" value={lastUpdated} icon={Clock} />
      </div>

      {/* Search Results Indicator */}
      {searchResults && (
        <div className="flex items-center gap-2 mb-4 px-1">
          <Sparkles className="w-3.5 h-3.5 text-[var(--sy-primary)]" strokeWidth={1.5} />
          <span className="text-xs text-[var(--sy-text-secondary)]">
            {searchResults.length} semantic match{searchResults.length !== 1 ? "es" : ""} for
          </span>
          <span className="sy-data text-xs text-[var(--sy-primary)]">"{searchQuery}"</span>
          <button
            onClick={clearSearch}
            className="text-xs text-[var(--sy-text-muted)] hover:text-[var(--sy-text-secondary)] ml-auto"
          >
            Clear
          </button>
        </div>
      )}

      {/* Type Filters */}
      <div className="flex items-center gap-1 mb-4">
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeFilter === filter
                ? "bg-[var(--sy-primary-subtle)] text-[var(--sy-primary)] border border-[var(--sy-border-active)]"
                : "text-[var(--sy-text-tertiary)] hover:text-[var(--sy-text-secondary)] hover:bg-[rgba(255,255,255,0.02)] border border-transparent"
            }`}
            data-testid={`filter-${filter}`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
        <span className="sy-label ml-auto">
          {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Memory Items List */}
      <div className="flex-1 min-h-0">
        {filteredItems.length === 0 ? (
          <div className="sy-panel-solid p-8 text-center">
            <Brain className="w-12 h-12 text-[var(--sy-text-muted)] mx-auto mb-4" strokeWidth={1} />
            <h3 className="text-lg font-medium text-[var(--sy-text-primary)] mb-2">
              {searchResults ? "No matches found" : "Memory is empty"}
            </h3>
            <p className="text-sm text-[var(--sy-text-tertiary)] max-w-md mx-auto">
              {searchResults
                ? "Try a different search query or lower the similarity threshold."
                : "Execute tasks to populate the memory store. Memory items include summaries, context, and artifacts with vector embeddings."
              }
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-3 pb-4">
              {filteredItems.map((item) => (
                <MemoryItemCard
                  key={item.id}
                  item={item}
                  similarity={item._similarity}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default Memory;
