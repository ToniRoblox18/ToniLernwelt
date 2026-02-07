
import React, { useState, useRef, useEffect } from 'react';
import { TaskSolution, Language } from '../types';
import { GeminiAudioService, getSharedAudioContext } from '../services/geminiService';
import { AudioCacheService } from '../services/audioCache';
import { PDFExportService } from '../services/pdfExportService';
import { StudentGuide } from './StudentGuide';
import { ParentGuide } from './ParentGuide';
import { UserRound, Heart, Languages, FileDown, Loader2 } from 'lucide-react';

export const SolutionView: React.FC<{ solution: TaskSolution; language: Language; onToggleLanguage: () => void; }> = ({ solution, language, onToggleLanguage }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'parent'>('parent');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioCached, setIsAudioCached] = useState<boolean | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Prüfe beim Laden ob Audio gecacht ist
  useEffect(() => {
    const checkCache = async () => {
      try {
        const ctx = getSharedAudioContext();
        const cached = await AudioCacheService.get(solution.id, ctx);
        setIsAudioCached(cached !== null);
        console.log(`[SolutionView] Audio-Cache für ${solution.id}: ${cached ? 'JA' : 'NEIN'}`);
      } catch (err) {
        console.error('[SolutionView] Cache-Check Fehler:', err);
        setIsAudioCached(false);
      }
    };
    checkCache();
  }, [solution.id]);

  // Resize logic
  const [sidebarWidth, setSidebarWidth] = useState(480);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = React.useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate new width relative to window width (right sidebar)
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 800) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);


  const handleVoice = async () => {
    if (isSpeaking) {
      audioSourceRef.current?.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    try {
      const text = `Lehrerin erklärt: ${solution.teacherSection.learningGoal_de}. Schritte: ${solution.teacherSection.studentSteps_de.join(". ")}. Lösung: ${solution.finalSolution_de}. ${solution.teacherSection.summary_de}`;
      const buffer = await GeminiAudioService.speakText(text, solution.id);
      const ctx = getSharedAudioContext();

      // Audio wurde generiert/geladen → jetzt gecacht
      setIsAudioCached(true);

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

  const handleExportPDF = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      await PDFExportService.exportToPDF([solution]);
    } catch (error) {
      console.error('PDF Export Fehler:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`h-full flex flex-col lg:flex-row overflow-hidden animate-in fade-in duration-500 ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
      <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 lg:p-8 overflow-y-auto border-r border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">SEITE {solution.pageNumber}</span>
              <h2 className="text-xl font-bold dark:text-white font-display">{solution.taskTitle}</h2>
            </div>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              PDF-Export
            </button>
          </div>
          <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 transition-all">
            <img src={solution.imagePreview} className="w-full rounded-xl object-contain h-auto max-h-[70vh]" alt="Aufgabe" />
          </div>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="hidden lg:flex w-1 bg-slate-200 dark:bg-slate-800 hover:bg-blue-400 cursor-col-resize items-center justify-center transition-colors z-30"
        onMouseDown={startResizing}
      >
        <div className="h-8 w-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
      </div>

      <div
        className="w-full lg:w-[auto] bg-white dark:bg-slate-900 h-full overflow-y-auto flex flex-col shadow-inner"
        style={{ width: window.innerWidth >= 1024 ? sidebarWidth : '100%' }}
        ref={sidebarRef}
      >
        <div className="flex p-2 bg-slate-50 dark:bg-slate-900 gap-2 sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <TabBtn active={activeTab === 'parent'} onClick={() => setActiveTab('parent')} icon={<Heart className="w-4 h-4" />} text="ELTERN" color="emerald" />
          <TabBtn active={activeTab === 'student'} onClick={() => setActiveTab('student')} icon={<UserRound className="w-4 h-4" />} text="FÜR DICH" />
        </div>

        <div className="flex-1 p-6 lg:p-8">
          {activeTab === 'student' ? (
            <StudentGuide solution={solution} isSpeaking={isSpeaking} onToggleVoice={handleVoice} isAudioCached={isAudioCached} />
          ) : (
            <div className="animate-in slide-in-from-left-4 duration-300">
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
