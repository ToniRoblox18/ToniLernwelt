
import React from 'react';
import { TaskSolution, Language, TableRow } from '../types';
import { GraduationCap, Table as TableIcon } from 'lucide-react';

interface ParentGuideProps {
  solution: TaskSolution;
  language: Language;
}

const SolutionTable = ({ title, headers, rows, isVi }: { title: string, headers: string[], rows: TableRow[], isVi?: boolean }) => (
  <div className="space-y-2">
    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</h5>
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <table className="w-full text-left text-[11px]">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="px-3 py-2 w-16">{headers[0]}</th>
            <th className="px-3 py-2">{headers[1]}</th>
            <th className="px-3 py-2">{headers[2]}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
              <td className="px-3 py-2 font-mono text-blue-500">{r.taskNumber}</td>
              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{isVi ? r.label_vi : r.label_de}</td>
              <td className="px-3 py-2 text-emerald-600 font-bold">{isVi ? r.value_vi : r.value_de}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const ParentGuide: React.FC<ParentGuideProps> = ({ solution, language }) => {
  const isDe = language === 'de';
  return (
    <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-blue-600"><GraduationCap className="w-5 h-5" /><h4 className="text-[10px] font-bold uppercase tracking-widest">{isDe ? 'Unterstützung' : 'Hỗ trợ'}</h4></div>
        <div className="space-y-4">
          {solution.steps.map((s, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-6 h-6 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">{i + 1}</div>
              <div>
                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{isDe ? s.title_de : s.title_vi}</h5>
                <p className="text-slate-600 dark:text-slate-400 text-xs">{isDe ? s.description_de : s.description_vi}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-emerald-600"><TableIcon className="w-5 h-5" /><h4 className="text-[10px] font-bold uppercase tracking-widest">Lösungstabellen / Bảng lời giải</h4></div>
        <SolutionTable title="Lösungen (Deutsch)" headers={['Nr.', 'Aufgabe', 'Lösung']} rows={solution.solutionTable} />
        <SolutionTable title="Lời giải (Tiếng Việt)" headers={['Số', 'Nhiệm vụ', 'Lời giải']} rows={solution.solutionTable} isVi />
      </section>
    </div>
  );
};
