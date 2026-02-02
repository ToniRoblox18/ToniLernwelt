
import React, { useState } from 'react';
import { UploadZone } from './UploadZone';
import { EditorialDashboard } from './EditorialDashboard';
import { PlayCircle, ShieldCheck, FileDown, Loader2 } from 'lucide-react';
import { TaskSolution } from '../types';
import { PDFExportService } from '../services/pdfExportService';

interface EditorialViewProps {
  solutions: TaskSolution[];
  onUpload: (files: FileList) => void;
  onDelete: (id: string) => void;
  isBusy: boolean;
  isTestMode: boolean;
  progress: number;
  onStartStage: () => void;
}

export const EditorialView: React.FC<EditorialViewProps> = ({ solutions, onUpload, onDelete, isBusy, isTestMode, progress, onStartStage }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

  const handleExport = async (selectedIds: string[]) => {
    const selectedSolutions = solutions.filter(s => selectedIds.includes(s.id));
    
    if (selectedSolutions.length === 0) return;
    
    setIsExporting(true);
    setExportProgress({ current: 0, total: selectedSolutions.length });
    
    try {
      await PDFExportService.exportToPDF(selectedSolutions, (current, total) => {
        setExportProgress({ current, total });
      });
    } catch (error) {
      console.error('Fehler beim Export:', error);
    } finally {
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950/50">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold font-display">Redaktion</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Verwalte deine Mediathek und bereite die Lernreise vor.</p>
            </div>
          </div>
          <button
            onClick={onStartStage}
            disabled={solutions.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all hover:scale-105"
          >
            <PlayCircle className="w-5 h-5" /> Stage starten
          </button>
        </header>

        <UploadZone onFilesSelected={onUpload} isTestMode={isTestMode} />

        {(isBusy || isExporting) && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30 shadow-xl animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-bold ${isTestMode ? 'text-amber-500' : 'text-blue-500'}`}>
                {isExporting ? "Exportiere PDF..." : (isTestMode ? "Simuliere Analyse..." : "KI analysiert Aufgaben...")}
              </span>
              <span className="text-sm font-bold">{Math.round(isExporting ? (exportProgress.current / exportProgress.total) * 100 : progress)}%</span>
            </div>
            <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-500" 
                style={{ width: `${isExporting ? (exportProgress.current / exportProgress.total) * 100 : progress}%` }} 
              />
            </div>
            {isExporting && (
              <div className="mt-2 text-xs text-slate-500 text-center">
                {exportProgress.current} von {exportProgress.total} Aufgaben exportiert
              </div>
            )}
          </div>
        )}

        <EditorialDashboard solutions={solutions} onDelete={onDelete} onExport={handleExport} />
      </div>
    </div>
  );
};
