
import React, { useState, useRef } from 'react';
import { TaskSolution, Language } from '../types';
import { speakText, getSharedAudioContext } from '../services/geminiService';
import { StudentGuide } from './StudentGuide';
import { ParentGuide } from './ParentGuide';
import { Maximize2, UserRound, Heart, Languages } from 'lucide-react';

export const SolutionView: React.FC<{ solution: TaskSolution; language: Language; onToggleLanguage: () => void; }> = ({ solution, language, onToggleLanguage }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'parent'>('student');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const handleVoice = async () => {
    if (isSpeaking) { 
      audioSourceRef.current?.stop(); 
      setIsSpeaking(false); 
      return; 
    }
    
    setIsSpeaking(true);
    try {
      const text = `Lehrerin erklärt: ${solution.teacherSection.learningGoal_de}. Schritte: ${solution.teacherSection.studentSteps_de.join(". ")}. Lösung: ${solution.finalSolution_de}. ${solution.teacherSection.summary_de}`;
      const buffer = await speakText(text, solution.id);
      const ctx = getSharedAudioContext();
      
      // Falls noch was spielt, stoppen
      audioSourceRef.current?.stop();
      
      const source = ctx.createBufferSource();
      source.buffer = buffer; 
      source.connect(ctx.destination);
      source.onended = () => setIsSpeaking(false);
      audioSourceRef.current = source; 
      source.start();
    } catch (err) { 
      console.error("Audio Playback Error:", err);
      setIsSpeaking(false); 
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden animate-in fade-in duration-500">
      <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 lg:p-8 overflow-y-auto border-r border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">SEITE {solution.pageNumber}</span>
              <h2 className="text-xl font-bold dark:text-white font-display">{solution.taskTitle}</h2>
            </div>
            <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Maximize2 className="w-5 h-5" /></button>
          </div>
          <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 transition-all">
            <img src={solution.imagePreview} className="w-full rounded-xl object-contain h-auto max-h-[70vh]" alt="Aufgabe" />
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[480px] xl:w-[580px] bg-white dark:bg-slate-900 h-full overflow-y-auto flex flex-col shadow-inner">
        <div className="flex p-2 bg-slate-50 dark:bg-slate-800/50 gap-2 sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md">
          <TabBtn active={activeTab === 'student'} onClick={() => setActiveTab('student')} icon={<UserRound className="w-4 h-4" />} text="FÜR DICH" />
          <TabBtn active={activeTab === 'parent'} onClick={() => setActiveTab('parent')} icon={<Heart className="w-4 h-4" />} text="ELTERN" color="emerald" />
        </div>

        <div className="flex-1 p-6 lg:p-8">
          {activeTab === 'student' ? (
            <StudentGuide solution={solution} isSpeaking={isSpeaking} onToggleVoice={handleVoice} />
          ) : (
            <div className="animate-in slide-in-from-left-4 duration-300">
              <div className="flex justify-end mb-6">
                <button onClick={onToggleLanguage} className="flex items-center gap-2 text-[10px] font-bold bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 transition-all shadow-sm">
                  <Languages className="w-3 h-3 text-blue-600" /> {language === 'de' ? 'TIẾNG VIỆT HIỂN THỊ' : 'DEUTSCH ANZEIGEN'}
                </button>
              </div>
              <ParentGuide solution={solution} language={language} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, text, color = 'blue' }: any) => {
  const activeClass = color === 'emerald' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-blue-600 text-white shadow-lg';
  return (
    <button 
      onClick={onClick} 
      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[10px] transition-all ${active ? activeClass : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
    >
      {icon} {text}
    </button>
  );
};
