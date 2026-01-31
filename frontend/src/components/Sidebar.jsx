import { Plus, Trash2, FileText, Code, Image, FileSearch, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const taskTypeIcons = {
  text_summarization: FileText,
  code_analysis: Code,
  image_analysis: Image,
  document_processing: FileSearch,
  general_analysis: Zap,
};

const taskTypeLabels = {
  text_summarization: "Text Analysis",
  code_analysis: "Code Review",
  image_analysis: "Image Analysis",
  document_processing: "Document Processing",
  general_analysis: "General Analysis",
};

const statusLabels = {
  pending: "Queued",
  input_received: "Received",
  preprocessing: "Processing",
  analyzing: "Analyzing",
  evaluating: "Evaluating",
  completed: "Completed",
  failed: "Failed",
};

export const Sidebar = ({ tasks, selectedTask, onSelectTask, onNewTask, onDeleteTask }) => {
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const truncateId = (id) => id.slice(0, 8).toUpperCase();

  const getStatusColor = (status) => {
    if (status === 'completed') return 'bg-[#3d9970]';
    if (status === 'failed') return 'bg-[#c0392b]';
    if (['analyzing', 'evaluating', 'preprocessing'].includes(status)) return 'bg-[#b8860b]';
    return 'bg-[#6b7280]';
  };

  return (
    <aside 
      className="w-[260px] flex-shrink-0 flex flex-col border-r bg-[#14171b]"
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      data-testid="task-sidebar"
    >
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <Button 
          className="w-full bg-[#3b9ea8] hover:bg-[#349199] text-white font-medium h-9 text-[13px]"
          onClick={onNewTask}
          data-testid="new-task-button"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Task History Label */}
      <div className="px-4 py-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#6b7280]">
          Task History
        </span>
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1 px-2 scroll-area">
        {tasks.length === 0 ? (
          <div className="px-4 py-8 text-center" data-testid="empty-task-list">
            <p className="text-[13px] text-[#6b7280]">
              No tasks executed yet
            </p>
          </div>
        ) : (
          <div className="space-y-1 pb-4" data-testid="task-list">
            {tasks.map((task) => {
              const TaskIcon = taskTypeIcons[task.task_type] || Zap;
              const isSelected = selectedTask?.id === task.id;

              return (
                <div
                  key={task.id}
                  className={`task-history-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectTask(task)}
                  data-testid={`task-item-${task.id}`}
                >
                  {/* Task Type & Status */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TaskIcon className="w-3.5 h-3.5 text-[#6b7280]" />
                      <span className="text-[12px] font-medium text-[#e8eaed]">
                        {taskTypeLabels[task.task_type] || "Analysis"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(task.status)}`} />
                      <span className="text-[10px] text-[#6b7280]">
                        {statusLabels[task.status] || task.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Task ID & Time */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#4b5563]">
                      {truncateId(task.id)}
                    </span>
                    <span className="text-[10px] text-[#4b5563]">
                      {formatTimestamp(task.created_at)}
                    </span>
                  </div>

                  {/* Input Preview */}
                  <p className="text-[11px] text-[#6b7280] truncate mt-1.5 leading-relaxed">
                    {task.input_text.slice(0, 60)}
                    {task.input_text.length > 60 ? '…' : ''}
                  </p>

                  {/* Delete action for selected */}
                  {isSelected && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-3 h-7 text-[11px] text-[#9ca3af] hover:text-[#c0392b] hover:bg-[#c0392b]/10"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`delete-task-${task.id}`}
                        >
                          <Trash2 className="w-3 h-3 mr-1.5" />
                          Remove from history
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#1a1d22] border-[#2a2d32]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-[#e8eaed]">Delete Task</AlertDialogTitle>
                          <AlertDialogDescription className="text-[#6b7280]">
                            This will permanently remove the task and its results. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-[#1a1d22] border-[#2a2d32] hover:bg-[#2a2d32] text-[#9ca3af]">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-[#c0392b] hover:bg-[#a33327] text-white"
                            onClick={() => onDeleteTask(task.id)}
                            data-testid="confirm-delete-task"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;
