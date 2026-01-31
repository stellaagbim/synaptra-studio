import { useState, useEffect, useCallback, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";

// Layout
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

// Pages
import Dashboard from "@/pages/Dashboard";
import TaskRunner from "@/pages/TaskRunner";
import Automations from "@/pages/Automations";
import Memory from "@/pages/Memory";
import Tools from "@/pages/Tools";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import Eval from "@/pages/Eval";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AppContext = createContext(null);
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

function AppContent() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchSystemStatus = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/status`);
      setSystemStatus(data);
    } catch (e) {
      setSystemStatus({ status: "error", ai_engine: "unavailable", database: "disconnected" });
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/tasks`);
      setTasks(data);
    } catch (e) {
      console.error("Failed to fetch tasks:", e);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/settings`);
      setSettings(data);
    } catch (e) {
      console.error("Failed to fetch settings:", e);
    }
  }, []);

  const createTask = async (inputText, imageBase64 = null, taskType = null) => {
    setIsLoading(true);
    try {
      const { data: newTask } = await axios.post(`${API}/tasks`, {
        input_text: inputText,
        input_image_base64: imageBase64,
        task_type: taskType
      });
      
      setTasks(prev => [newTask, ...prev]);
      
      if (newTask.status === "completed") {
        toast.success("Task execution completed", {
          description: `Overall score: ${newTask.evaluation?.overall_score?.toFixed(1) || '—'}`
        });
      } else if (newTask.status === "failed") {
        toast.error("Task execution failed", {
          description: newTask.error_message || "An error occurred"
        });
      }
      
      return newTask;
    } catch (e) {
      toast.error("Task creation failed", { description: e.response?.data?.detail || e.message });
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success("Task removed");
    } catch (e) {
      toast.error("Failed to delete task");
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const { data } = await axios.put(`${API}/settings`, newSettings);
      setSettings(data);
      toast.success("Settings updated");
      return data;
    } catch (e) {
      toast.error("Failed to update settings");
      throw e;
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    fetchTasks();
    fetchSettings();
    const interval = setInterval(fetchSystemStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchSystemStatus, fetchTasks, fetchSettings]);

  const contextValue = {
    systemStatus, tasks, settings, isLoading,
    createTask, deleteTask, fetchTasks, updateSettings, navigate
  };

  const pageTitles = {
    '/': 'Dashboard',
    '/task-runner': 'Task Runner',
    '/automations': 'Automations',
    '/memory': 'Memory',
    '/tools': 'Tools',
    '/history': 'History',
    '/settings': 'Settings',
    '/eval': 'Evaluation'
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="h-screen w-screen flex overflow-hidden" style={{ background: 'var(--sy-void)' }} data-testid="synaptra-app">
        <Toaster 
          position="top-right" 
          theme="dark" 
          toastOptions={{
            style: {
              background: 'var(--sy-elevated)',
              border: '1px solid var(--sy-border-default)',
              color: 'var(--sy-text-primary)',
              fontFamily: 'Inter, sans-serif',
            },
          }}
        />
        <Sidebar systemStatus={systemStatus} currentPath={location.pathname} />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title={pageTitles[location.pathname] || 'Synaptra'} />
          <main className="flex-1 overflow-auto p-6" style={{ background: 'var(--sy-void)' }}>
            <div className="h-full">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/task-runner" element={<TaskRunner />} />
                <Route path="/automations" element={<Automations />} />
                <Route path="/memory" element={<Memory />} />
                <Route path="/tools" element={<Tools />} />
                <Route path="/history" element={<History />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/eval" element={<Eval />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
