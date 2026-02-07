
import React from 'react';
import { UploadZone } from './UploadZone';
import { EditorialDashboard } from './EditorialDashboard';
import { PlayCircle, ShieldCheck } from 'lucide-react';
import { TaskSolution } from '../types';

interface EditorialViewProps {
  solutions: TaskSolution[];
  onUpload: (files: FileList) => void;
  onDelete: (id: string) => void;
  isBusy: boolean;
  progress: number;
  onStartStage: () => void;
}

export const EditorialView: React.FC<EditorialViewProps> = ({ solutions, onUpload, onDelete, isBusy, progress, onStartStage }) => {
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

        <UploadZone onFilesSelected={onUpload} />

        {isBusy && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30 shadow-xl animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-blue-500">
                KI analysiert Aufgaben...
              </span>
              <span className="text-sm font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <EditorialDashboard solutions={solutions} onDelete={onDelete} />
      </div>
    </div>
  );
};
