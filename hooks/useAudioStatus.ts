
import { useState, useEffect } from 'react';
import { TaskSolution } from '../types';
import { AudioCacheService } from '../services/audioCache';
import { speakText, getSharedAudioContext } from '../services/geminiService';

export const useAudioStatus = (solutions: TaskSolution[]) => {
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  const check = async () => {
    const ctx = getSharedAudioContext();
    const next: any = {};
    for (const s of solutions) {
      const has = await AudioCacheService.get(s.id, ctx);
      next[s.id] = has ? 'ready' : (statuses[s.id] === 'loading' ? 'loading' : 'missing');
    }
    setStatuses(next);
  };

  useEffect(() => { check(); }, [solutions.length]);

  const generate = async (sol: TaskSolution) => {
    setStatuses(p => ({ ...p, [sol.id]: 'loading' }));
    try {
      const text = `${sol.teacherSection.learningGoal_de}. ${sol.teacherSection.studentSteps_de.join(". ")}. ${sol.finalSolution_de}`;
      await speakText(text, sol.id);
      setStatuses(p => ({ ...p, [sol.id]: 'ready' }));
    } catch {
      setStatuses(p => ({ ...p, [sol.id]: 'error' }));
    }
  };

  const generateMissing = async () => {
    for (const s of solutions.filter(s => statuses[s.id] !== 'ready')) {
      await generate(s);
      await new Promise(r => setTimeout(r, 500));
    }
  };

  return { statuses, generate, generateMissing };
};
