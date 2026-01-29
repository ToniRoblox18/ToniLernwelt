
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { SolutionView } from './components/SolutionView';
import { EditorialView } from './components/EditorialView';
import { TaskModel } from './model/TaskModel';
import { useFileProcessing } from './hooks/useFileProcessing';
import { AppState, AppMode } from './types';
import { BookOpenCheck } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => ({
    solutions: [],
    currentSolutionId: null,
    uiLanguage: 'vi',
    isProcessing: false,
    isTestMode: localStorage.getItem('testMode') === 'true',
    progress: 0,
    darkMode: localStorage.getItem('theme') === 'light' ? false : true,
    mode: (localStorage.getItem('mode') as AppMode) || 'stage',
    notification: null,
    filters: { grade: null, subject: null }
  }));

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    TaskModel.load().then(solutions => {
      setState(p => ({ ...p, solutions }));
    });
  }, []);

  const notify = (message: string, type: any = 'info') => {
    setState(p => ({ ...p, notification: { message, type } }));
    setTimeout(() => setState(p => ({ ...p, notification: null })), 3000);
  };

  const { processFiles, isProcessing, progress } = useFileProcessing(
    state.solutions,
    state.isTestMode,
    (tasks) => setState(p => ({ ...p, solutions: [...tasks] })),
    (msg) => notify(msg, 'error')
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.darkMode);
    localStorage.setItem('theme', state.darkMode ? 'dark' : 'light');
    localStorage.setItem('mode', state.mode);
    localStorage.setItem('testMode', state.isTestMode.toString());
  }, [state.darkMode, state.mode, state.isTestMode]);

  // Gefilterte Lösungen berechnen
  const filteredSolutions = TaskModel.filterLocal(state.filters);
  const current = state.solutions.find(s => s.id === state.currentSolutionId);

  const handleDeleteTask = async (id: string) => {
    const updated = await TaskModel.removeTask(id);
    setState(p => ({
      ...p,
      solutions: updated,
      currentSolutionId: p.currentSolutionId === id ? null : p.currentSolutionId
    }));
    notify("Aufgabe erfolgreich gelöscht", "success");
  };

  const handleClearAll = async () => {
    console.log("[App] handleClearAll initiated. TestMode:", state.isTestMode);

    const msg = state.isTestMode
      ? "Möchten Sie wirklich alle SIMULIERTEN Test-Aufgaben löschen?"
      : "Möchten Sie wirklich alle ECHTEN Aufgaben und Sprachaufnahmen unwiderruflich löschen?";

    if (window.confirm(msg)) {
      console.log("[App] User confirmed deletion.");
      try {
        const empty = await TaskModel.clear(state.isTestMode);
        console.log("[App] Deletion successful. Remaining tasks:", empty.length);
        setState(p => ({ ...p, solutions: empty, currentSolutionId: null }));
        notify(state.isTestMode ? "Testdaten gelöscht" : "Alle Aufgaben gelöscht", "success");
      } catch (err) {
        console.error("[App] Deletion failed:", err);
        notify("Fehler beim Löschen der Daten", "error");
      }
    } else {
      console.log("[App] User cancelled deletion.");
    }
  };

  const handleToggleTestMode = () => {
    setState(p => ({ ...p, isTestMode: !p.isTestMode }));
    notify(state.isTestMode ? "KI-Modus aktiviert (Scharf)" : "Test-Modus aktiviert (Simulation)", "info");
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && processFiles(e.target.files)} multiple accept="image/*,application/pdf" className="hidden" />
      <Sidebar
        solutions={filteredSolutions}
        currentId={state.currentSolutionId}
        darkMode={state.darkMode}
        isTestMode={state.isTestMode}
        mode={state.mode}
        filters={state.filters}
        onSelect={id => setState(p => ({ ...p, currentSolutionId: id }))}
        onUploadClick={() => fileInputRef.current?.click()}
        onToggleDarkMode={() => setState(p => ({ ...p, darkMode: !p.darkMode }))}
        onToggleMode={() => setState(p => ({ ...p, mode: p.mode === 'editorial' ? 'stage' : 'editorial' }))}
        onToggleTestMode={handleToggleTestMode}
        onClearAll={handleClearAll}
        onFilterChange={filters => setState(p => ({ ...p, filters }))}
      />

      <main className="flex-1 relative overflow-hidden flex flex-col">
        {state.notification && <Toast notify={state.notification} />}

        {state.mode === 'editorial' ? (
          <EditorialView
            solutions={filteredSolutions}
            onUpload={processFiles}
            onDelete={handleDeleteTask}
            isBusy={isProcessing}
            isTestMode={state.isTestMode}
            progress={progress}
            onStartStage={() => setState(p => ({ ...p, mode: 'stage' }))}
          />
        ) : (
          current ? <SolutionView solution={current} language={state.uiLanguage} onToggleLanguage={() => setState(p => ({ ...p, uiLanguage: p.uiLanguage === 'de' ? 'vi' : 'de' }))} />
            : <EmptyState onBack={() => setState(p => ({ ...p, mode: 'editorial' }))} />
        )}
      </main>
    </div>
  );
};

const Toast = ({ notify }: any) => (
  <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl animate-in slide-in-from-top-4 border flex items-center gap-2 ${notify.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
    }`}>
    {notify.type === 'success' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
    <span className="font-bold text-sm">{notify.message}</span>
  </div>
);

const EmptyState = ({ onBack }: any) => (
  <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
    <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-full"><BookOpenCheck className="w-12 h-12 text-blue-600" /></div>
    <h2 className="text-3xl font-bold mb-4 font-display">Wähle eine Aufgabe!</h2>
    <button onClick={onBack} className="text-slate-400 hover:text-blue-500 transition-colors text-sm font-medium">Zurück zur Redaktion</button>
  </div>
);

export default App;
