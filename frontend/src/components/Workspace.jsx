import { useState, useRef } from "react";
import { 
  Send, Upload, X, Image as ImageIcon, FileText, Code, FileSearch, 
  Zap, CheckCircle2, Circle, Loader2, XCircle, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const taskTypes = [
  { value: "general_analysis", label: "Auto-detect", icon: Zap },
  { value: "text_summarization", label: "Text Analysis", icon: FileText },
  { value: "code_analysis", label: "Code Review", icon: Code },
  { value: "document_processing", label: "Document Processing", icon: FileSearch },
  { value: "image_analysis", label: "Image Analysis", icon: ImageIcon },
];

const EXECUTION_STAGES = [
  { id: 'input', name: 'Input Reception', description: 'Validating and structuring input data' },
  { id: 'preprocess', name: 'Preprocessing', description: 'Preparing data for analysis' },
  { id: 'analysis', name: 'AI Analysis', description: 'Executing primary analysis pipeline' },
  { id: 'evaluation', name: 'Evaluation', description: 'Computing quality and relevance metrics' },
  { id: 'output', name: 'Output Generation', description: 'Formatting and delivering results' },
];

export const Workspace = ({ selectedTask, onCreateTask, isLoading }) => {
  const [inputText, setInputText] = useState("");
  const [selectedType, setSelectedType] = useState("general_analysis");
  const [imageBase64, setImageBase64] = useState(null);
  const [imageName, setImageName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !imageBase64) return;

    try {
      await onCreateTask(inputText, imageBase64, selectedType);
      setInputText("");
      setImageBase64(null);
      setImageName("");
    } catch (error) {
      // Error handled in parent
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Supported formats: JPEG, PNG, WebP');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1];
      setImageBase64(base64);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const getStepStatus = (index) => {
    if (!selectedTask || !selectedTask.execution_steps) return 'awaiting';
    const step = selectedTask.execution_steps[index];
    if (!step) return 'awaiting';
    return step.status;
  };

  const getStepDetails = (index) => {
    if (!selectedTask || !selectedTask.execution_steps) return null;
    return selectedTask.execution_steps[index];
  };

  // Input Panel
  const renderInputPanel = () => (
    <div 
      className="panel flex-shrink-0"
      data-testid="input-panel"
    >
      <div className="panel-header">
        <div>
          <h2 className="text-heading text-[14px] text-[#e8eaed]">Task Input</h2>
          <p className="text-[11px] text-[#6b7280] mt-0.5">Define the content to be analyzed</p>
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger 
            className="w-[160px] h-8 bg-[#0f1114] border-[#2a2d32] text-[12px] text-[#9ca3af]"
            data-testid="task-type-selector"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1d22] border-[#2a2d32]">
            {taskTypes.map((type) => {
              const Icon = type.icon;
              return (
                <SelectItem 
                  key={type.value} 
                  value={type.value}
                  className="text-[12px] text-[#9ca3af] focus:bg-[#2a2d32] focus:text-[#e8eaed]"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    {type.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="panel-content">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text, code, or content for analysis..."
              className="input-field min-h-[100px] pr-14 w-full"
              disabled={isLoading}
              data-testid="task-input-textarea"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute bottom-3 right-3 w-9 h-9 bg-[#3b9ea8] hover:bg-[#349199]"
              disabled={isLoading || (!inputText.trim() && !imageBase64)}
              data-testid="submit-task-button"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Image Upload - minimal */}
          <div
            className={`border rounded-md p-4 flex items-center justify-center cursor-pointer transition-colors ${
              isDragging 
                ? 'border-[#3b9ea8] bg-[#3b9ea8]/5' 
                : 'border-dashed border-[#2a2d32] hover:border-[#3b9ea8]/50'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            data-testid="image-drop-zone"
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              data-testid="image-file-input"
            />
            
            {imageBase64 ? (
              <div className="flex items-center gap-3 w-full">
                <div className="w-12 h-12 rounded bg-[#1a1d22] overflow-hidden flex-shrink-0">
                  <img 
                    src={`data:image/jpeg;base64,${imageBase64}`} 
                    alt="Attachment" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[#e8eaed] truncate">{imageName}</p>
                  <p className="text-[11px] text-[#6b7280]">Image attached</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[#6b7280] hover:text-[#c0392b]"
                  onClick={(e) => { e.stopPropagation(); setImageBase64(null); setImageName(""); }}
                  data-testid="remove-image-button"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-2">
                <Upload className="w-5 h-5 text-[#4b5563] mx-auto mb-1.5" />
                <p className="text-[12px] text-[#6b7280]">Attach image (optional)</p>
                <p className="text-[10px] text-[#4b5563]">JPEG, PNG, WebP</p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  // Execution Pipeline - always visible, dynamic
  const renderExecutionPanel = () => {
    const hasTask = selectedTask && selectedTask.execution_steps?.length > 0;

    return (
      <div 
        className="panel flex-1 flex flex-col min-h-0"
        data-testid="execution-panel"
      >
        <div className="panel-header">
          <div>
            <h2 className="text-heading text-[14px] text-[#e8eaed]">Execution Pipeline</h2>
            <p className="text-[11px] text-[#6b7280] mt-0.5">
              {hasTask 
                ? `Task ${selectedTask.id.slice(0, 8).toUpperCase()}` 
                : 'Awaiting task execution'}
            </p>
          </div>
          {hasTask && selectedTask.status === 'completed' && (
            <div className="flex items-center gap-1.5 text-[#3d9970]">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[11px] font-medium">Complete</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 scroll-area">
          <div className="space-y-0">
            {EXECUTION_STAGES.map((stage, index) => {
              const status = hasTask ? getStepStatus(index) : 'awaiting';
              const stepData = hasTask ? getStepDetails(index) : null;
              const isLast = index === EXECUTION_STAGES.length - 1;
              
              const isCompleted = status === 'completed';
              const isRunning = status === 'running';
              const isFailed = status === 'failed';
              const isAwaiting = !isCompleted && !isRunning && !isFailed;

              return (
                <div 
                  key={stage.id}
                  className={`flex gap-4 relative ${isAwaiting && !hasTask ? 'opacity-40' : ''}`}
                  data-testid={`execution-step-${index}`}
                >
                  {/* Connector line */}
                  {!isLast && (
                    <div 
                      className={`absolute left-[15px] top-9 w-px h-[calc(100%-12px)] ${
                        isCompleted ? 'bg-[#3d9970]/40' : 'bg-[#2a2d32]'
                      }`}
                    />
                  )}
                  
                  {/* Step indicator */}
                  <div 
                    className={`step-node relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                      isCompleted ? 'border-[#3d9970] bg-[#3d9970]/10' :
                      isRunning ? 'border-[#3b9ea8] bg-[#3b9ea8]/10' :
                      isFailed ? 'border-[#c0392b] bg-[#c0392b]/10' :
                      'border-[#2a2d32] bg-[#1a1d22]'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-[#3d9970]" />
                    ) : isRunning ? (
                      <Loader2 className="w-4 h-4 text-[#3b9ea8] animate-spin" />
                    ) : isFailed ? (
                      <XCircle className="w-4 h-4 text-[#c0392b]" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#4b5563]" />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 pb-6 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-[13px] font-medium ${
                        isCompleted || isRunning ? 'text-[#e8eaed]' : 'text-[#6b7280]'
                      }`}>
                        {stage.name}
                      </span>
                      {stepData?.duration_ms && (
                        <span className="text-mono text-[10px] text-[#4b5563]">
                          {stepData.duration_ms}ms
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#4b5563] mt-0.5">
                      {stepData?.details || stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Output Panel
  const renderOutputPanel = () => {
    const hasOutput = selectedTask?.output;
    const isFailed = selectedTask?.status === 'failed';

    return (
      <div 
        className="panel flex-1 flex flex-col min-h-0"
        data-testid="output-panel"
      >
        <div className="panel-header">
          <div>
            <h2 className="text-heading text-[14px] text-[#e8eaed]">Analysis Output</h2>
            <p className="text-[11px] text-[#6b7280] mt-0.5">
              {hasOutput ? 'Results from AI analysis' : 'Awaiting execution'}
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1 scroll-area">
          <div className="p-5">
            {isFailed ? (
              <div 
                className="flex items-start gap-3 p-4 rounded-md bg-[#c0392b]/10 border border-[#c0392b]/20"
                data-testid="task-error"
              >
                <AlertCircle className="w-5 h-5 text-[#c0392b] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-medium text-[#c0392b]">Execution Failed</p>
                  <p className="text-[12px] text-[#c0392b]/80 mt-1">
                    {selectedTask.error_message || "An error occurred during task execution."}
                  </p>
                </div>
              </div>
            ) : hasOutput ? (
              <div 
                className="text-body text-[13px] text-[#d1d5db] leading-relaxed whitespace-pre-wrap"
                data-testid="task-output"
              >
                {selectedTask.output}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-lg bg-[#1a1d22] border border-[#2a2d32] flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-5 h-5 text-[#4b5563]" />
                </div>
                <p className="text-[13px] text-[#6b7280]">
                  {selectedTask ? 'Processing task...' : 'No completed runs yet'}
                </p>
                <p className="text-[11px] text-[#4b5563] mt-1">
                  {selectedTask ? 'Output will appear when analysis completes' : 'Execute a task to view results'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <main className="flex-1 flex flex-col gap-4 p-5 overflow-hidden bg-[#0f1114]" data-testid="main-workspace">
      {renderInputPanel()}
      
      <div className="flex-1 flex gap-4 min-h-0">
        {renderExecutionPanel()}
        {renderOutputPanel()}
      </div>
    </main>
  );
};

export default Workspace;
