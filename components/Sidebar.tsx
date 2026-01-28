
import React, { useState, useEffect } from 'react';
import { TaskSolution, AppMode } from '../types';
import { AudioCacheService } from '../services/audioCache';
import { getSharedAudioContext } from '../services/geminiService';
import { TaskModel } from '../model/TaskModel';
import {
  BookOpen, ChevronRight, FileText, Plus, Moon, Sun,
  Trash2, Volume2, Settings, ShieldCheck, Filter,
  SearchX, XCircle, Library
} from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { TaskItem } from './TaskItem';

interface SidebarProps {
  solutions: TaskSolution[];
  currentId: string | null;
  darkMode: boolean;
  mode: AppMode;
  filters: { grade: string | null; subject: string | null };
  onSelect: (id: string) => void;
  onUploadClick: () => void;
  onToggleDarkMode: () => void;
  onToggleMode: () => void;
  onClearAll: () => void;
  onFilterChange: (filters: { grade: string | null; subject: string | null }) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  solutions, currentId, darkMode, mode, filters,
  onSelect, onUploadClick, onToggleDarkMode, onToggleMode, onClearAll, onFilterChange
}) => {

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const grades = TaskModel.getUniqueGrades();
  const subjects = TaskModel.getUniqueSubjects(filters.grade || undefined);

  const handleGradeChange = (val: string) => {
    onFilterChange({ ...filters, grade: val === 'all' ? null : val, subject: null });
  };

  const handleSubjectChange = (val: string) => {
    onFilterChange({ ...filters, subject: val === 'all' ? null : val });
  };

  const clearFilters = () => {
    onFilterChange({ grade: null, subject: null });
  };

  const hasActiveFilters = filters.grade || filters.subject;

  return (
    <>
      <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col shadow-sm transition-colors z-20">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className={`p-2 rounded-lg shadow-md transition-colors ${mode === 'editorial' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-blue-600 text-white shadow-blue-500/20'}`}>
            {mode === 'editorial' ? <ShieldCheck className="w-6 h-6" /> : <Library className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="font-bold text-slate-800 dark:text-white text-lg leading-tight font-display tracking-tight">LernBegleiter</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 transition-all">
              {mode === 'editorial' ? 'Redaktion' : 'Lern-Modus'}
            </p>
          </div>
        </div>

        <div className="px-4 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
              <Filter className="w-3 h-3 text-blue-500" /> Filter-Bar
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                title="Filter zurücksetzen"
              >
                <XCircle className="w-3 h-3 text-slate-400 hover:text-red-500" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            <div className="relative">
              <select
                value={filters.grade || 'all'}
                onChange={e => handleGradeChange(e.target.value)}
                className="w-full text-xs font-bold p-2.5 pl-3 pr-8 appearance-none rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer shadow-sm"
              >
                <option value="all">Alle Klassen</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <ChevronRight className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filters.subject || 'all'}
                onChange={e => handleSubjectChange(e.target.value)}
                disabled={!filters.grade && grades.length > 0}
                className={`w-full text-xs font-bold p-2.5 pl-3 pr-8 appearance-none rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer shadow-sm ${!filters.grade && grades.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="all">Alle Fächer</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronRight className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {mode === 'editorial' && (
            <button onClick={onUploadClick} className="w-full flex items-center justify-center gap-3 p-3 rounded-xl border-2 border-dashed border-blue-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all mb-4 group ring-offset-white dark:ring-offset-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" /> <span className="font-bold text-sm">Aufgabe laden</span>
            </button>
          )}

          <div className="space-y-1.5 pt-1">
            {solutions.length > 0 ? (
              solutions.map((task) => (
                <TaskItem key={task.id} task={task} isActive={currentId === task.id} onSelect={onSelect} mode={mode} />
              ))
            ) : (
              <div className="py-12 text-center animate-in fade-in zoom-in-95">
                <SearchX className="w-8 h-8 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keine Übereinstimmung</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
              title="Einstellungen & Tools"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={onToggleDarkMode}
              title="Design umschalten"
              className="flex-1 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        mode={mode}
        onToggleMode={onToggleMode}
        onClearAll={onClearAll}
      />
    </>
  );
};
