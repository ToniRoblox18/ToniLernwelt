
import React from 'react';
import { TaskSolution } from '../types';
import { BookOpen, GraduationCap, ClipboardList, CheckCircle2 } from 'lucide-react';

interface TaskDisplayProps {
  task: TaskSolution;
  id?: string;
}

export const TaskDisplay: React.FC<TaskDisplayProps> = ({ task, id }) => {
  return (
    <div id={id} className="bg-white p-12 shadow-xl rounded-lg border border-gray-100 max-w-5xl mx-auto my-8 print:shadow-none print:border-none print:my-0">
      {/* Header & Description */}
      <div className="pdf-break-avoid">
        <div className="border-b-4 border-indigo-500 pb-6 mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{task.taskTitle}</h1>
            <p className="text-indigo-600 font-semibold text-xl">{task.subject} • {task.subSubject} • {task.grade}</p>
          </div>
          <div className="text-right text-base text-gray-500 font-medium">
            <p>Seite: {task.pageNumber}</p>
            <p>ID: {task.id.slice(0, 12)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-blue-50 p-6 rounded-md border-l-4 border-blue-500">
            <h3 className="font-bold text-blue-800 text-xl flex items-center gap-3 mb-3">
              <ClipboardList size={22} /> Beschreibung (DE)
            </h3>
            <p className="text-gray-700 italic text-lg leading-relaxed">{task.taskDescription_de}</p>
          </div>
          <div className="bg-indigo-50 p-6 rounded-md border-l-4 border-indigo-500">
            <h3 className="font-bold text-indigo-800 text-xl flex items-center gap-3 mb-3">
              <ClipboardList size={22} /> Mô tả (VI)
            </h3>
            <p className="text-gray-700 italic text-lg leading-relaxed">{task.taskDescription_vi}</p>
          </div>
        </div>
      </div>

      {/* Lehrer-Informationen (Positioniert vor der Anleitung) */}
      <section className="pdf-break-avoid bg-slate-50 p-10 rounded-xl border-2 border-dashed border-slate-300 mb-12">
        <h2 className="text-2xl font-bold text-slate-700 mb-6 flex items-center gap-3">
          <GraduationCap className="text-slate-600" size={28} /> Lehrer-Informationen (DE)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-lg text-slate-600">
          <div>
            <p className="font-bold text-slate-800 mb-2">Lernziel:</p>
            <p className="mb-6 leading-relaxed">{task.teacherSection.learningGoal_de}</p>
            <p className="font-bold text-slate-800 mb-2">Empfohlene Schritte:</p>
            <ul className="list-disc pl-6 space-y-3">
              {task.teacherSection.studentSteps_de.map((s, i) => <li key={i} className="leading-relaxed">{s}</li>)}
            </ul>
          </div>
          <div className="md:border-l md:pl-10 border-slate-200">
            <p className="font-bold text-slate-800 mb-2">Erklärung:</p>
            <p className="mb-6 leading-relaxed">{task.teacherSection.explanation_de}</p>
            <p className="font-bold text-slate-800 mb-2">Zusammenfassung:</p>
            <p className="leading-relaxed italic">{task.teacherSection.summary_de}</p>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="mb-12">
        <h2 className="pdf-break-avoid text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3 border-b-2 pb-4">
          <BookOpen className="text-indigo-500" size={28} /> Schritt-für-Schritt Anleitung / Hướng dẫn từng bước
        </h2>
        <div className="space-y-8">
          {task.steps.map((step, idx) => (
            <div key={idx} className="pdf-break-avoid bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex flex-col md:flex-row gap-10">
                <div className="flex-1">
                  <h4 className="font-bold text-indigo-700 text-2xl mb-3">{idx + 1}. {step.title_de}</h4>
                  <p className="text-gray-800 text-xl leading-relaxed">{step.description_de}</p>
                </div>
                <div className="flex-1 border-t md:border-t-0 md:border-l pt-8 md:pt-0 md:pl-10 border-gray-300">
                  <h4 className="font-bold text-indigo-600 text-2xl mb-3">{idx + 1}. {step.title_vi}</h4>
                  <p className="text-gray-600 italic text-xl leading-relaxed">{step.description_vi}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Solution Table */}
      <section className="mb-12">
        <h2 className="pdf-break-avoid text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3 border-b-2 pb-4">
          <CheckCircle2 className="text-green-500" size={28} /> Übersichtstabelle / Bảng tổng kết
        </h2>
        <div className="overflow-x-auto rounded-xl border-2 border-gray-200 shadow-md">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Nr.</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Label (DE / VI)</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Inhalt / Nội dung</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {task.solutionTable.map((row, idx) => (
                <tr key={idx} className={`pdf-break-avoid ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-indigo-50'}`}>
                  <td className="px-8 py-8 whitespace-nowrap text-2xl font-bold text-gray-900">{row.taskNumber}</td>
                  <td className="px-8 py-8">
                    <div className="font-bold text-gray-800 text-xl">{row.label_de}</div>
                    <div className="text-gray-500 italic text-lg">{row.label_vi}</div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="text-gray-900 text-xl font-medium leading-snug">{row.value_de}</div>
                    <div className="text-gray-500 italic text-lg leading-snug mt-2">{row.value_vi}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="pdf-break-avoid mt-12 pt-8 border-t-2 border-gray-100 text-center text-base text-gray-400 font-medium italic">
        Erstellt am {new Date(task.timestamp).toLocaleString('de-DE')} • Qualitätssicheres Lehrmaterial
      </div>
    </div>
  );
};
