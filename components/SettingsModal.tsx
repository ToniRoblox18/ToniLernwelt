
import React, { useEffect } from 'react';
import { X, Trash2, ShieldCheck, Settings as SettingsIcon, Database, Cpu } from 'lucide-react';
import { AppMode } from '../types';

import { DEFAULT_MODEL, AUDIO_MODEL } from '../services/geminiService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: AppMode;
    onToggleMode: () => void;
    onClearAll: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen, onClose, mode, onToggleMode, onClearAll
}) => {

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Read exported constants from geminiService
    const geminiModel = DEFAULT_MODEL;
    const audioModel = AUDIO_MODEL;

    return (
        <div className="fixed bottom-4 left-4 z-50 flex flex-col-reverse items-start animate-in zoom-in-95 duration-200">
            {/* Backdrop is removed for better UX if it's a corner menu, or added back if modal behavior is strictly needed. 
                 User request says "Menu um 30% verkleinern und direkt in der Ecke unten links anzeigen." 
                 Typically does not imply a full screen backdrop blocking interaction, but preventing clicks outside is often desired. 
                 I will add a transparent click-outside handler if needed, but for now simple corner popup. */}

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-72 border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-2 duration-300 overflow-hidden">
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
                    {/* Mode Selection */}
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">App Modus</h4>
                        <div className="grid grid-cols-1 gap-2">
                            <button
                                onClick={() => { onToggleMode(); }}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${mode === 'editorial'
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                                    : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700'
                                    }`}
                            >
                                <ShieldCheck className={`w-4 h-4 ${mode === 'editorial' ? 'text-blue-600' : 'text-slate-400'}`} />
                                <span className="font-bold text-xs">Redaktion</span>
                                {mode === 'editorial' && <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                            </button>

                            <button
                                onClick={() => { onToggleMode(); }}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${mode === 'stage'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300'
                                    : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-700'
                                    }`}
                            >
                                <Database className={`w-4 h-4 ${mode === 'stage' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span className="font-bold text-xs">Lern-Modus</span>
                                {mode === 'stage' && <div className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Model Info */}
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">System Info</h4>
                        <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2">
                            <div className="flex items-center gap-2">
                                <Cpu className="w-3 h-3 text-purple-500" />
                                <div>
                                    <p className="text-[9px] font-mono font-bold text-slate-600 dark:text-slate-400 leading-none">{geminiModel}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <SettingsIcon className="w-3 h-3 text-pink-500" />
                                <div>
                                    <p className="text-[9px] font-mono font-bold text-slate-600 dark:text-slate-400 leading-none">{audioModel}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Danger Zone */}
                    <button
                        onClick={() => {
                            if (confirm("Wirklich ALLES löschen?")) {
                                onClearAll();
                                onClose();
                            }
                        }}
                        className="w-full flex items-center justify-center gap-2 p-2.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors"
                    >
                        <Trash2 className="w-3 h-3" /> Daten löschen
                    </button>
                </div>
            </div>
            {/* Click outside to close (invisible backdrop) */}
            <div className="fixed inset-0 z-[-1]" onClick={onClose}></div>
        </div>
    );
};
