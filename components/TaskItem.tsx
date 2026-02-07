import React, { useState, useEffect } from 'react';
import { TaskSolution, AppMode } from '../types';
import { AudioCacheService } from '../services/audioCache';
import { getSharedAudioContext } from '../services/geminiService';
import { FileText, Volume2, ChevronRight } from 'lucide-react';

interface TaskItemProps {
    task: TaskSolution;
    index: number;
    isActive: boolean;
    onSelect: (id: string) => void;
    mode: AppMode;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, index, isActive, onSelect, mode }) => {
    const [isVoiceReady, setIsVoiceReady] = useState(false);

    useEffect(() => {
        const check = async () => { // Corrected: removed extra parenthesis
            const ctx = getSharedAudioContext();
            const ready = await AudioCacheService.get(task.id, ctx);
            if (ready) setIsVoiceReady(true);
        };
        check();
    }, [task.id, mode]);

    return (
        <button
            onClick={() => onSelect(task.id)}
            className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-all ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
        >
            <div className={`w-6 h-6 flex items-center justify-center rounded-md text-[10px] font-bold tabular-nums shrink-0 ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                {index}
            </div>
            <div className={`p-2 rounded-lg relative ${isActive ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <FileText className="w-4 h-4" />
                {isVoiceReady && (
                    <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full ${isActive ? 'bg-blue-400' : 'bg-blue-500'}`}>
                        <Volume2 className="w-2.5 h-2.5 text-white" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate leading-tight mb-1">
                    {task.displayId && <span className="opacity-70 font-mono mr-1.5">{task.displayId}.</span>}
                    {task.taskTitle}
                </p>
                <div className="flex items-center gap-1.5 opacity-90">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${isActive ? 'bg-blue-500/50 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                        {task.grade || 'Klasse ?'}
                    </span>
                    <span className="text-[9px] truncate">•</span>
                    <span className={`text-[9px] truncate font-medium ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                        {task.subject || 'Fach ?'}
                    </span>
                </div>
            </div>
            {isActive && <ChevronRight className="w-3 h-3 text-white/50" />}
        </button>
    );
};
