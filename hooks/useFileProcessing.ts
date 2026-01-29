
import { useState } from 'react';
import { TaskModel } from '../model/TaskModel';
import { GeminiAnalysisService } from '../services/geminiService';
import { TaskSolution } from '../types';
import { MockTaskGenerator } from '../services/MockTaskGenerator';

export const useFileProcessing = (
  solutions: TaskSolution[],
  isTestMode: boolean,
  onSuccess: (tasks: TaskSolution[]) => void,
  onError: (msg: string) => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const getFingerprint = (file: File) => `${file.name}-${file.size}-${file.lastModified}-${file.type}`;

  const processFiles = async (files: FileList) => {
    if (isTestMode) {
      setIsProcessing(true);
      setProgress(20);
      await new Promise(r => setTimeout(r, 800)); // Simulierte Ladezeit

      const count = Math.floor(Math.random() * 3) + 1; // 1, 2 oder 3
      console.log(`[TestMode] Generiere ${count} simulierte Aufgaben.`);

      const mocks = MockTaskGenerator.generateTasks(count);
      const updated = await TaskModel.addTasks(mocks);

      setProgress(100);
      onSuccess(updated);
      setIsProcessing(false);
      return;
    }

    const arr = Array.from(files);
    console.log(`Verarbeite ${arr.length} Dateien. Aktuelle Bibliothek hat ${solutions.length} Einträge.`);

    const filesToProcess = arr.filter(f => {
      const fp = getFingerprint(f);
      const existing = solutions.find(s => s.fileFingerprint === fp);

      if (existing) {
        console.warn(`Duplikat erkannt: "${f.name}" kollidiert mit Task "${existing.taskTitle}" (ID: ${existing.displayId || existing.id})`);
        onError(`"${f.name}" wurde bereits analysiert (als "${existing.taskTitle}").`);
        return false;
      }
      return true;
    });

    if (filesToProcess.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    for (let i = 0; i < filesToProcess.length; i++) {
      try {
        const file = filesToProcess[i];
        const { base64, mimeType } = await fileToData(file);

        const sol = await GeminiAnalysisService.analyzeTaskImage(base64, TaskModel.getAll().length + 1, mimeType);
        const enriched = { ...sol, fileFingerprint: getFingerprint(file) };

        const updated = await TaskModel.addTasks([enriched]);
        onSuccess(updated);
        setProgress(((i + 1) / filesToProcess.length) * 100);
      } catch (err: any) {
        console.error("Processing error:", err);
        onError(`Fehler bei der Analyse: ${err.message || 'Unbekannter Fehler'}`);
      }
    }
    setIsProcessing(false);
  };

  const fileToData = (file: File): Promise<{ base64: string, mimeType: string }> =>
    new Promise(r => {
      const rd = new FileReader();
      rd.onload = () => r({
        base64: (rd.result as string).split(',')[1],
        mimeType: file.type || "image/jpeg"
      });
      rd.readAsDataURL(file);
    });

  return { processFiles, isProcessing, progress };
};
