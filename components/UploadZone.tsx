
import React, { useState, useCallback } from 'react';
import { Upload, FileType, Plus } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: FileList) => void;
  compact?: boolean;
  isTestMode?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected, compact, isTestMode }) => {
  const [isDragging, setIsDragging] = useState(false);
  // Counter for robust drag enter/leave handling
  const dragCounter = React.useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  if (compact) {
    return (
      <label className="flex items-center gap-2 p-3 rounded-xl border-2 border-dashed border-blue-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors mb-6 cursor-pointer group">
        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="font-medium">Aufgaben hinzufügen</span>
        <input type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={handleChange} />
      </label>
    );
  }

  return (
    <div
      className={`relative group border-4 border-dashed rounded-3xl p-12 text-center transition-all bg-white dark:bg-slate-900 ${isDragging
        ? (isTestMode ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/40 ring-4 ring-amber-500/10' : 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/40 ring-4 ring-blue-500/10')
        : (isTestMode ? 'border-amber-200 dark:border-amber-900/30' : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700')
        }`}
    >
      {isTestMode && (
        <div className="absolute top-4 right-4 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-20 animate-pulse">
          SIMULATION AKTIV
        </div>
      )}
      <input
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        onChange={handleChange}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />
      <div className={`flex flex-col items-center gap-4 transition-transform duration-300 pointer-events-none ${isDragging ? 'scale-105' : ''}`}>
        <div className={`p-6 rounded-2xl transition-all duration-300 ${isDragging
          ? (isTestMode ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30')
          : (isTestMode ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110')}`}>
          <Upload className="w-12 h-12" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 font-display">
            {isTestMode ? 'Dateien hierher ziehen (Simulation)' : 'Aufgaben hierher ziehen'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {isTestMode
              ? 'Im Simulations-Modus werden zufällige Aufgaben generiert. Es werden keine echten Daten an Gemini gesendet.'
              : 'Wählen Sie mehrere Bilder oder PDFs aus dem Arbeitsheft aus. Die KI analysiert sie sofort.'}
          </p>
        </div>
        <div className="flex gap-2 mt-4">
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold rounded-md flex items-center gap-1">
            <FileType className="w-3 h-3" /> PDF
          </span>
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold rounded-md flex items-center gap-1">
            <FileType className="w-3 h-3" /> JPG / PNG
          </span>
        </div>
      </div>
    </div>
  );
};
