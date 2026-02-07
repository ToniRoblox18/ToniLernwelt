
import React, { useState } from 'react';
import { TaskSolution } from '../types';
import { useAudioStatus } from '../hooks/useAudioStatus';
import { CheckCircle2, Volume2, Loader2, AlertCircle, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type SortField = 'nr' | 'title' | 'grade' | 'subject';
type SortDir = 'asc' | 'desc';

interface EditorialDashboardProps {
  solutions: TaskSolution[];
  onDelete: (id: string) => void;
}

export const EditorialDashboard: React.FC<EditorialDashboardProps> = ({ solutions, onDelete }) => {
  const { statuses, generate, generateMissing } = useAudioStatus(solutions);
  const [sortField, setSortField] = useState<SortField>('nr');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  if (solutions.length === 0) return null;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = [...solutions].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'nr': return (a.pageNumber - b.pageNumber) * dir;
      case 'title': return a.taskTitle.localeCompare(b.taskTitle, 'de') * dir;
      case 'grade': return a.grade.localeCompare(b.grade, 'de') * dir;
      case 'subject': return a.subject.localeCompare(b.subject, 'de') * dir;
      default: return 0;
    }
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 text-blue-500" />
      : <ArrowDown className="w-3 h-3 text-blue-500" />;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold">Aufgaben-Verwaltung</h3>
            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">{solutions.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generateMissing}
              className="text-xs font-bold border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Volume2 className="w-4 h-4 text-blue-500" /> Alles generieren
            </button>
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[3rem_4rem_1fr_7rem_7rem_6rem_6rem_2.5rem] items-center px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <button onClick={() => handleSort('nr')} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
          Nr <SortIcon field="nr" />
        </button>
        <span></span>
        <button onClick={() => handleSort('title')} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
          Aufgabe <SortIcon field="title" />
        </button>
        <button onClick={() => handleSort('grade')} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
          Klasse <SortIcon field="grade" />
        </button>
        <button onClick={() => handleSort('subject')} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
          Fach <SortIcon field="subject" />
        </button>
        <span className="text-center">Analyse</span>
        <span className="text-center">Audio</span>
        <span></span>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {sorted.map((sol, idx) => (
          <TableRow
            key={sol.id}
            nr={sortDir === 'asc' ? idx + 1 : sorted.length - idx}
            sol={sol}
            status={statuses[sol.id]}
            onGenerate={() => generate(sol)}
            onDelete={() => onDelete(sol.id)}
          />
        ))}
      </div>
    </div>
  );
};

const TableRow = ({ nr, sol, status, onGenerate, onDelete }: any) => (
  <div className="grid grid-cols-[3rem_4rem_1fr_7rem_7rem_6rem_6rem_2.5rem] items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
    {/* Nr */}
    <span className="text-xs font-bold text-slate-400 tabular-nums">{nr}</span>

    {/* Thumbnail */}
    <div className="relative group">
      <img src={sol.imagePreview} className="w-10 h-14 object-cover rounded-lg border shadow-sm transition-transform group-hover:scale-105" alt="" />
      {sol.displayId && (
        <div className="absolute top-0.5 right-0.5 bg-black/60 backdrop-blur-sm text-white text-[7px] font-mono px-0.5 rounded shadow-sm">
          {sol.displayId}
        </div>
      )}
    </div>

    {/* Title */}
    <div className="pl-2 min-w-0">
      <p className="font-bold text-sm leading-tight truncate">{sol.taskTitle}</p>
      <span className="text-[9px] text-slate-400 font-medium">{sol.subSubject}</span>
    </div>

    {/* Grade */}
    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-md text-center w-fit">{sol.grade}</span>

    {/* Subject */}
    <span className="text-[10px] font-medium text-slate-500 truncate">{sol.subject}</span>

    {/* Analyse Badge */}
    <div className="flex justify-center">
      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    </div>

    {/* Audio Badge */}
    <div className="flex justify-center">
      {status === 'ready' ? (
        <CheckCircle2 className="w-4 h-4 text-blue-500" />
      ) : status === 'loading' ? (
        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
      ) : status === 'checking' ? (
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      ) : (
        <button onClick={onGenerate} className="group">
          <AlertCircle className="w-4 h-4 text-red-400 group-hover:text-red-500 transition-colors" />
        </button>
      )}
    </div>

    {/* Delete */}
    <button onClick={onDelete} className="p-1 text-slate-300 hover:text-red-500 transition-all" title="Aufgabe löschen">
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  </div>
);
