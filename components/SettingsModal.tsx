import React, { useEffect } from 'react';
import { X, Settings as SettingsIcon, Cpu, Languages } from 'lucide-react';
import { AppMode, Language } from '../types';
import { DEFAULT_MODEL, AUDIO_MODEL } from '../services/geminiService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: AppMode;
    onToggleMode: () => void;
    language: Language;
    onToggleLanguage: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen, onClose, mode, onToggleMode, language, onToggleLanguage
}) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const geminiModel = DEFAULT_MODEL;
    const audioModel = AUDIO_MODEL;

    return (
        <div className="fixed bottom-4 left-4 z-[60] flex flex-col-reverse items-start animate-in zoom-in-95 duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-72 border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-2 duration-300 overflow-hidden relative">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg">
                            <SettingsIcon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                        </div>
                        <h3 className="text-sm font-bold font-display">Einstellungen</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* App Mode Auswahl */}
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">App Modus</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => { if (mode !== 'editorial') onToggleMode(); }}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${mode === 'editorial'
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                                    : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:border-blue-300'
                                    }`}
                            >
                                <SettingsIcon className="w-4 h-4 mb-1" />
                                <span className="font-bold text-[10px]">Redaktion</span>
                            </button>
                            <button
                                onClick={() => { if (mode !== 'stage') onToggleMode(); }}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${mode === 'stage'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300'
                                    : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:border-emerald-300'
                                    }`}
                            >
                                <Cpu className="w-4 h-4 mb-1" />
                                <span className="font-bold text-[10px]">Toni-Modus</span>
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Sprache */}
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Sprache</h4>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                                onClick={() => { if (language !== 'de') onToggleLanguage(); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all ${language === 'de'
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600'
                                    : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Languages className="w-3 h-3" /> Deutsch
                            </button>
                            <button
                                onClick={() => { if (language !== 'vi') onToggleLanguage(); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all ${language === 'vi'
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600'
                                    : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Languages className="w-3 h-3" /> Tiếng Việt
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* System Info */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                            <span className="flex items-center gap-1"><Cpu className="w-2.5 h-2.5" /> Model:</span>
                            <span className="text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{geminiModel}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                            <span className="flex items-center gap-1"><SettingsIcon className="w-2.5 h-2.5" /> Audio:</span>
                            <span className="text-slate-600 dark:text-slate-300">{audioModel}</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Click outside to close (invisible backdrop) */}
            <div className="fixed inset-0 z-[-1]" onClick={onClose}></div>
        </div>
    );
};
