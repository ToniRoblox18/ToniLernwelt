
import React, { useState, useEffect } from 'react';
import { TaskSolution, AppMode } from '../types';
import { AudioCacheService } from '../services/audioCache';
import { getSharedAudioContext } from '../services/geminiService';
import { BookOpen, ChevronRight, FileText, Plus, Moon, Sun, Trash2, Volume2, Settings, ShieldCheck, Filter, SearchX } from 'lucide-react';

interface SidebarProps {
  solutions: TaskSolution[];
  currentId: string | null;
  darkMode: boolean;
  mode: AppMode;
  onSelect: (id: string) => void;
  onUploadClick: () => void;
  onToggleDarkMode: () => void;
  onToggleMode: () => void;
  onClearAll: () => void;
}

const TaskItem: React.FC<{ task: TaskSolution; isActive: boolean; onSelect: (id: string) => void; mode: AppMode }> = ({ task, isActive, onSelect, mode }) => {
  const [isVoiceReady, setIsVoiceReady] = useState(false);

  useEffect(() => {
    const check = async () => {
      const ctx = getSharedAudioContext();
      const ready = await AudioCacheService.get(task.id, ctx);
      if (ready) setIsVoiceReady(true);
    };
    check();
  }, [task.id, mode]);

  return (
    <button
      onClick={() => onSelect(task.id)}
      className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02]'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      <div className={`p-2 rounded-lg relative ${isActive ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-800'}`}>
        <FileText className="w-4 h-4" />
        {isVoiceReady && (
          <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full ${isActive ? 'bg-blue-400' : 'bg-blue-500'}`}>
            <Volume2 className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate leading-tight">{task.taskTitle}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[9px] px-1 rounded uppercase font-bold ${isActive ? 'bg-blue-400 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>{task.grade}</span>
          <span className={`text-[9px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{task.subject}</span>
        </div>
      </div>
      {isActive && <ChevronRight className="w-3 h-3 text-white/50" />}
    </button>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ solutions, currentId, darkMode, mode, onSelect, onUploadClick, onToggleDarkMode, onToggleMode, onClearAll }) => {
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  const grades = Array.from(new Set(solutions.map(s => s.grade))).sort();
  const subjects = Array.from(new Set(solutions.map(s => s.subject))).sort();

  const filteredSolutions = solutions.filter(s => 
    (gradeFilter === 'all' || s.grade === gradeFilter) && 
    (subjectFilter === 'all' || s.subject === subjectFilter)
  );

  return (
    <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col shadow-sm transition-colors z-20">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className={`p-2 rounded-lg shadow-md transition-colors ${mode === 'editorial' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-blue-600 text-white shadow-blue-500/20'}`}>
          {mode === 'editorial' ? <Settings className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
        </div>
        <div>
          <h1 className="font-bold text-slate-800 dark:text-white text-lg leading-tight font-display tracking-tight">LernBegleiter</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 transition-all">
            {mode === 'editorial' ? 'Redaktion' : 'Lern-Modus'}
          </p>
        </div>
      </div>

      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mb-1">
          <Filter className="w-3 h-3" /> Filterung
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select 
            value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}
            className="text-[10px] font-bold p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
            <option value="all">Klassen</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select 
            value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
            className="text-[10px] font-bold p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
            <option value="all">Fächer</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {mode === 'editorial' && (
          <button onClick={onUploadClick} className="w-full flex items-center justify-center gap-3 p-3 rounded-xl border-2 border-dashed border-blue-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all mb-4 group">
            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" /> <span className="font-bold text-sm">Aufgabe laden</span>
          </button>
        )}
        
        <div className="space-y-1.5">
          {filteredSolutions.length > 0 ? (
            filteredSolutions.map((task) => (
              <TaskItem key={task.id} task={task} isActive={currentId === task.id} onSelect={onSelect} mode={mode} />
            ))
          ) : (
            <div className="py-12 text-center animate-in fade-in zoom-in-95">
              <SearchX className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-[10px] font-bold text-slate-400 uppercase">Keine Aufgaben gefunden</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
        <button 
          onClick={onToggleMode} 
          className={`w-full flex items-center justify-center gap-3 p-3 rounded-xl border shadow-sm transition-all font-bold text-sm hover:scale-[1.02] active:scale-95 ${
            mode === 'editorial' 
              ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20' 
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
          }`}
        >
          {mode === 'editorial' ? <ShieldCheck className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          <span>{mode === 'editorial' ? 'Zum Lern-Modus' : 'Zur Redaktion'}</span>
        </button>
        <div className="flex gap-2">
          <button onClick={onToggleDarkMode} title="Design umschalten" className="flex-1 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
          </button>
          {mode === 'editorial' && (
            <button onClick={onClearAll} title="Alle Daten löschen" className="flex-1 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
