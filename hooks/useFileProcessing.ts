
import { useState } from 'react';
import { TaskModel } from '../model/TaskModel';
import { analyzeTaskImage } from '../services/geminiService';
import { TaskSolution } from '../types';

export const useFileProcessing = (onSuccess: (tasks: TaskSolution[]) => void, onError: (msg: string) => void) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const getFingerprint = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

  const processFiles = async (files: FileList) => {
    const arr = Array.from(files);
    const filesToProcess = arr.filter(f => {
      const exists = TaskModel.exists(getFingerprint(f));
      if (exists) onError(`"${f.name}" wurde bereits analysiert.`);
      return !exists;
    });

    if (filesToProcess.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    for (let i = 0; i < filesToProcess.length; i++) {
      try {
        const file = filesToProcess[i];
        const { base64, mimeType } = await fileToData(file);
        
        const sol = await analyzeTaskImage(base64, TaskModel.getAll().length + 1, mimeType);
        const enriched = { ...sol, fileFingerprint: getFingerprint(file) };
        
        const updated = await TaskModel.addTasks([enriched]);
        onSuccess(updated);
        setProgress(((i + 1) / filesToProcess.length) * 100);
      } catch (err) {
        console.error("Processing error:", err);
        onError("Fehler bei der Analyse.");
      }
    }
    setIsProcessing(false);
  };

  const fileToData = (file: File): Promise<{base64: string, mimeType: string}> => 
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
