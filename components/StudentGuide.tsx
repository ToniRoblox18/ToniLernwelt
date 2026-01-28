
import React from 'react';
import { TaskSolution } from '../types';
import { Compass, Footprints, CheckCircle2, Sparkles, Volume2, VolumeX } from 'lucide-react';

interface StudentGuideProps {
  solution: TaskSolution;
  isSpeaking: boolean;
  onToggleVoice: () => void;
}

export const StudentGuide: React.FC<StudentGuideProps> = ({ solution, isSpeaking, onToggleVoice }) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-start gap-4 bg-blue-50 dark:bg-blue-900/10 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/30 relative overflow-hidden">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm shrink-0 border border-blue-200 dark:border-blue-800 relative z-10">
          <span className="text-2xl">👩‍🏫</span>
        </div>
        <div className="flex-1 z-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-blue-900 dark:text-blue-300 text-sm">Deine Lehrerin erklärt:</h3>
            <button onClick={onToggleVoice} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm ${isSpeaking ? 'bg-red-100 text-red-600' : 'bg-blue-600 text-white'}`}>
              {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />} {isSpeaking ? 'STOPP' : 'VORLESEN'}
            </button>
          </div>
          <p className="text-blue-800 dark:text-blue-200/80 text-xs italic leading-relaxed">"Schau mal, wie wir diese Aufgabe heute gemeinsam lösen!"</p>
        </div>
      </div>

      <section className="space-y-2">
        <div className="flex items-center gap-2 text-blue-600"><Compass className="w-4 h-4" /><h4 className="text-[10px] font-bold uppercase tracking-widest">Lernziel</h4></div>
        <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">{solution.teacherSection.learningGoal_de}</p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-blue-600"><Footprints className="w-4 h-4" /><h4 className="text-[10px] font-bold uppercase tracking-widest">Schritte</h4></div>
        <div className="space-y-2">
          {solution.teacherSection.studentSteps_de.map((s, i) => (
            <div key={i} className="flex gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl text-sm border border-slate-100 dark:border-slate-800">
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] shrink-0">{i+1}</span>
              <p className="text-slate-700 dark:text-slate-300">{s}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="w-4 h-4" /><h4 className="text-[10px] font-bold uppercase tracking-widest">Die Lösung</h4></div>
        <p className="text-sm text-emerald-900 dark:text-emerald-200/80 leading-relaxed">{solution.teacherSection.explanation_de}</p>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center font-bold text-emerald-600">{solution.finalSolution_de}</div>
      </section>
    </div>
  );
};
