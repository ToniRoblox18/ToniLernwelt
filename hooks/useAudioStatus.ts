import { useState, useEffect, useCallback } from 'react';
import { TaskSolution } from '../types';
import { AudioCacheService } from '../services/audioCache';
import { GeminiAudioService, getSharedAudioContext } from '../services/geminiService';

/**
 * Hook für Audio-Status Management
 * Verwendet die gleiche Check-Logik wie TaskItem (die funktioniert!)
 */
export const useAudioStatus = (solutions: TaskSolution[]) => {
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<Set<string>>(new Set());

  // Check einzelner Solution - gleiche Logik wie TaskItem
  const checkSingle = useCallback(async (id: string) => {
    try {
      const ctx = getSharedAudioContext();
      const audio = await AudioCacheService.get(id, ctx);
      return audio ? 'ready' : 'missing';
    } catch {
      return 'missing';
    }
  }, []);

  // Check ALLER Solutions bei Mount und wenn sich solutions ändert
  useEffect(() => {
    if (solutions.length === 0) return;

    let cancelled = false;

    const checkAllSolutions = async () => {
      console.log('[useAudioStatus] Starte Check für', solutions.length, 'Solutions');

      const results: Record<string, string> = {};

      for (const sol of solutions) {
        if (cancelled) break;

        // Wenn gerade am Generieren, überspringe
        if (isGenerating.has(sol.id)) {
          results[sol.id] = 'loading';
          continue;
        }

        results[sol.id] = await checkSingle(sol.id);
      }

      if (!cancelled) {
        setStatuses(results);
        console.log('[useAudioStatus] Check fertig:', results);
      }
    };

    // Kurze Verzögerung für Render-Stabilität
    const timer = setTimeout(checkAllSolutions, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [solutions, checkSingle, isGenerating]);

  // Generiere Audio für eine Solution
  const generate = useCallback(async (sol: TaskSolution) => {
    setIsGenerating(prev => new Set(prev).add(sol.id));
    setStatuses(prev => ({ ...prev, [sol.id]: 'loading' }));

    try {
      const text = `${sol.teacherSection.learningGoal_de}. ${sol.teacherSection.studentSteps_de.join(". ")}. ${sol.finalSolution_de}`;
      await GeminiAudioService.speakText(text, sol.id);
      setStatuses(prev => ({ ...prev, [sol.id]: 'ready' }));
    } catch (err) {
      console.error('[useAudioStatus] Generate Fehler:', err);
      setStatuses(prev => ({ ...prev, [sol.id]: 'error' }));
    } finally {
      setIsGenerating(prev => {
        const next = new Set(prev);
        next.delete(sol.id);
        return next;
      });
    }
  }, []);

  // Generiere alle fehlenden
  const generateMissing = useCallback(async () => {
    const missing = solutions.filter(s => statuses[s.id] !== 'ready');
    for (const sol of missing) {
      await generate(sol);
      await new Promise(r => setTimeout(r, 500)); // Pause zwischen Generierungen
    }
  }, [solutions, statuses, generate]);

  // Manueller Re-Check
  const checkAll = useCallback(async () => {
    const results: Record<string, string> = {};
    for (const sol of solutions) {
      results[sol.id] = await checkSingle(sol.id);
    }
    setStatuses(results);
  }, [solutions, checkSingle]);

  return { statuses, generate, generateMissing, checkAll };
};
