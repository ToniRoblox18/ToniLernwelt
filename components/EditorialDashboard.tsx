
import React, { useState } from 'react';
import { TaskSolution } from '../types';
import { useAudioStatus } from '../hooks/useAudioStatus';
import { CheckCircle2, Volume2, Loader2, AlertCircle, Trash2, FileDown, CheckSquare, Square } from 'lucide-react';

interface EditorialDashboardProps {
  solutions: TaskSolution[];
  onDelete: (id: string) => void;
  onExport: (selectedIds: string[]) => void;
}

export const EditorialDashboard: React.FC<EditorialDashboardProps> = ({ solutions, onDelete, onExport }) => {
  const { statuses, generate, generateMissing } = useAudioStatus(solutions);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (solutions.length === 0) return null;

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === solutions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(solutions.map(s => s.id)));
    }
  };

  const handleExport = () => {
    if (selectedIds.size > 0) {
      onExport(Array.from(selectedIds));
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Aufgaben-Verwaltung</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={selectAll} 
              className="text-xs font-bold border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {selectedIds.size === solutions.length ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
              {selectedIds.size === solutions.length ? 'Alle abwählen' : 'Alle auswählen'}
            </button>
            <button 
              onClick={handleExport} 
              disabled={selectedIds.size === 0}
              className={`text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-sm ${
                selectedIds.size > 0 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <FileDown className="w-4 h-4" /> PDF Export {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
            </button>
            <button 
              onClick={generateMissing} 
              className="text-xs font-bold border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Volume2 className="w-4 h-4 text-blue-500" /> Alles generieren
            </button>
          </div>
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {solutions.map(sol => (
          <StatusRow
            key={sol.id}
            sol={sol}
            status={statuses[sol.id]}
            onGenerate={() => generate(sol)}
            onDelete={() => onDelete(sol.id)}
            isSelected={selectedIds.has(sol.id)}
            onToggleSelection={() => toggleSelection(sol.id)}
          />
        ))}
      </div>
    </div>
  );
};

const StatusRow = ({ sol, status, onGenerate, onDelete, isSelected, onToggleSelection }: any) => (
  <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
    <div className="flex items-center gap-4 flex-1">
      <button
        onClick={onToggleSelection}
        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-300" />}
      </button>
      <div className="relative group">
        <img src={sol.imagePreview} className="w-12 h-16 object-cover rounded-lg border shadow-sm transition-transform group-hover:scale-105" alt="" />
        {sol.displayId && (
          <div className="absolute top-0.5 right-0.5 bg-black/60 backdrop-blur-sm text-white text-[8px] font-mono px-1 rounded shadow-sm">
            {sol.displayId}
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
          <button onClick={onDelete} className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div>
        <p className="font-bold text-sm leading-tight mb-1">{sol.taskTitle}</p>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded uppercase">{sol.grade}</span>
          <span className="text-[9px] text-slate-400 font-medium">{sol.subject} • {sol.subSubject}</span>
        </div>
      </div>
    </div>
    <div className="flex gap-8 items-center">
      <Badge label="Analyse" icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} text="OK" />
      <div className="min-w-[100px] flex flex-col items-end">
        {status === 'ready' ? (
          <Badge label="Audio" icon={<CheckCircle2 className="w-4 h-4 text-blue-500" />} text="Bereit" />
        ) : status === 'loading' ? (
          <Badge label="Audio" icon={<Loader2 className="w-4 h-4 animate-spin text-amber-500" />} text="Lädt..." />
        ) : status === 'checking' ? (
          <Badge label="Audio" icon={<Loader2 className="w-4 h-4 animate-spin text-slate-400" />} text="Prüfe..." />
        ) : (
          <button onClick={onGenerate} className="flex flex-col items-end gap-1 group">
            <span className="text-[9px] font-bold text-slate-400">Audio</span>
            <div className="flex items-center gap-1 text-red-400 group-hover:text-red-500 transition-colors">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold underline">Generieren</span>
            </div>
          </button>
        )}
      </div>
      <button onClick={onDelete} className="p-2 text-slate-300 hover:text-red-500 transition-all ml-2" title="Aufgabe löschen">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const Badge = ({ label, icon, text }: any) => (
  <div className="flex flex-col items-end gap-1">
    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{label}</span>
    <div className="flex items-center gap-1">{icon}<span className="text-[11px] font-bold">{text}</span></div>
  </div>
);
