/**
 * PDF Export Service - CSS Grid Print System
 * ==========================================
 * Nutzt natives Browser-Rendering für perfekte vietnamesische Glyphen.
 * DIN A4 optimiert mit smart page breaks.
 */

import { TaskSolution } from '../types';

// Print Stylesheet für DIN A4 - Optimiert für hohe Informationsdichte
const PRINT_STYLES = `
@page {
  size: A4 portrait;
  margin: 10mm 8mm 10mm 8mm;
}

@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    font-size: 8pt !important;
    line-height: 1.3 !important;
  }

  .no-print, .summary-header {
    display: none !important;
  }

  .print-container {
    padding: 0 !important;
  }

  .task-block {
    margin-bottom: 4mm !important;
    padding: 3mm !important;
  }

  /* Lehrerbereich: Standard ausgeblendet, per Checkbox einblendbar */
  .teacher-section {
    page-break-before: auto;
    page-break-inside: avoid;
  }
}

/* Base Reset */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Noto Sans', 'Segoe UI', system-ui, sans-serif;
  font-size: 8.5pt;
  line-height: 1.3;
  color: #1e293b;
  background: #f8fafc;
  padding: 0;
}

/* Print Container */
.print-container {
  max-width: 210mm;
  margin: 0 auto;
  padding: 16px;
  background: white;
}

/* Task Block - Kompakt, ohne Rahmen */
.task-block {
  margin-bottom: 5mm;
  padding: 3mm;
  background: white;
}

/* Nur Hauptinhalt vermeidet Seitenumbruch */
.task-main {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Task Header - Einzeilig */
.task-header {
  display: flex;
  align-items: baseline;
  gap: 2mm;
  padding-bottom: 1.5mm;
  margin-bottom: 2mm;
  border-bottom: 0.2mm solid #cbd5e1;
}

.task-badge {
  font-size: 7pt;
  font-weight: 700;
  padding: 0.5mm 1.5mm;
  background: #334155;
  color: white;
  white-space: nowrap;
}

.task-title {
  font-size: 9pt;
  font-weight: 700;
  color: #0f172a;
  flex: 1;
}

.task-meta {
  font-size: 6.5pt;
  color: #64748b;
  white-space: nowrap;
}

/* Bilingual Section - Mit Trennlinie danach */
.bilingual-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2mm;
  margin-bottom: 3mm;
  padding-bottom: 3mm;
  border-bottom: 0.15mm solid #e2e8f0;
}

.lang-column {
  padding: 1mm;
}

.lang-label {
  font-size: 6pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  margin-bottom: 0.5mm;
}

.lang-label.de { color: #475569; }
.lang-label.vi { color: #0284c7; }

/* Description Box - Ohne Hintergrund */
.description-box {
  font-size: 8pt;
  padding: 1mm;
  min-height: 5mm;
  line-height: 1.25;
}

/* Steps Section - Mit Trennlinie danach */
.steps-section {
  margin-top: 2mm;
  margin-bottom: 3mm;
  padding-bottom: 3mm;
  border-bottom: 0.15mm solid #e2e8f0;
}

.section-title {
  font-size: 6.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #475569;
  margin-bottom: 1mm;
}

.step-row {
  display: grid;
  grid-template-columns: 4mm 1fr 1fr;
  gap: 1.5mm;
  padding: 1mm 0;
  page-break-inside: avoid;
  break-inside: avoid;
  border-bottom: 0.1mm solid #f1f5f9;
}

.step-row:last-child {
  border-bottom: none;
}

.step-number {
  font-size: 7pt;
  font-weight: 700;
  color: #475569;
  text-align: center;
}

.step-content {
  font-size: 8pt;
  line-height: 1.3;
}

.step-title {
  font-weight: 600;
  color: #1e293b;
}

.step-desc {
  font-size: 8pt;
  color: #475569;
  margin-top: 0.3mm;
}

/* Solution Table - Mit Trennlinie danach */
.solution-table {
  width: 100%;
  margin-top: 2mm;
  margin-bottom: 3mm;
  padding-bottom: 3mm;
  border-collapse: collapse;
  border-bottom: 0.15mm solid #e2e8f0;
}

.solution-table th {
  background: none;
  font-weight: 700;
  text-align: left;
  padding: 1.5mm 2mm;
  font-size: 8pt;
  color: #1e293b;
}

.solution-table td {
  padding: 1.5mm 2mm;
  vertical-align: top;
  line-height: 1.3;
  font-size: 8pt;
  color: #1e293b;
}

.solution-table tr {
  page-break-inside: avoid;
  break-inside: avoid;
}

.col-nr { width: 5mm; text-align: center; font-weight: 700; }
.col-label { width: 10%; }
.col-value { width: 38%; font-weight: 600; }

/* Final Solution - Sparsam ohne Hintergrund */
.final-solution {
  margin-top: 2mm;
  margin-bottom: 3mm;
  padding: 1.5mm;
  padding-bottom: 3mm;
  border-bottom: 0.15mm solid #e2e8f0;
}

.final-title {
  font-size: 6.5pt;
  font-weight: 700;
  text-transform: uppercase;
  color: #166534;
  margin-bottom: 0.5mm;
}

.final-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2mm;
}

.final-text {
  font-size: 8pt;
  font-weight: 600;
  line-height: 1.2;
}

/* Teacher Section - Sparsam ohne Hintergrund */
.teacher-section {
  margin-top: 4mm;
  padding: 3mm;
  page-break-before: auto;
  page-break-inside: avoid;
  break-before: auto;
  break-inside: avoid;
}

.teacher-title {
  font-size: 8pt;
  font-weight: 700;
  color: #6d28d9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2mm;
}

.teacher-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3mm;
  font-size: 8pt;
}

.teacher-item {
  padding: 2mm;
}

.teacher-label {
  font-size: 7pt;
  font-weight: 700;
  color: #6d28d9;
  margin-bottom: 1mm;
  text-transform: uppercase;
}

.teacher-content {
  color: #1e293b;
  line-height: 1.3;
  font-size: 8pt;
}

.teacher-steps {
  grid-column: 1 / -1;
}

.teacher-steps ol {
  margin: 0;
  padding-left: 4mm;
}

.teacher-steps li {
  margin-bottom: 1mm;
  line-height: 1.3;
}

/* Preview Controls */
.preview-controls {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #1e293b;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  z-index: 1000;
}

.preview-title {
  color: white;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-title svg {
  width: 18px;
  height: 18px;
}

.preview-info {
  color: #94a3b8;
  font-size: 11px;
}

.preview-buttons {
  display: flex;
  gap: 8px;
}

.btn-cancel {
  padding: 6px 16px;
  background: transparent;
  color: #94a3b8;
  border: 1px solid #475569;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel:hover {
  background: #334155;
  color: white;
}

.btn-print {
  padding: 6px 18px;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s;
}

.btn-print:hover {
  background: #16a34a;
}

.btn-print svg {
  width: 14px;
  height: 14px;
}

/* Spacer for fixed header */
.header-spacer {
  height: 50px;
}

/* Page break utilities */
.page-break-before {
  page-break-before: always;
  break-before: page;
}

.page-break-after {
  page-break-after: always;
  break-after: page;
}

/* Summary Header - Nur Vorschau */
.summary-header {
  text-align: center;
  padding: 3mm;
  margin-bottom: 4mm;
}

.summary-title {
  font-size: 14pt;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1mm;
}

.summary-meta {
  font-size: 8pt;
  color: #64748b;
}

/* Print-spezifische Optimierungen */
@media print {
  /* Orphans/Widows für besseren Textfluss */
  p, li, td {
    orphans: 2;
    widows: 2;
  }

  /* Tabellen-Header auf jeder Seite */
  thead {
    display: table-header-group;
  }

  /* Fußzeile vermeiden */
  tfoot {
    display: table-footer-group;
  }
}
`;

// HTML escapen
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Task HTML generieren
function renderTaskHtml(task: TaskSolution): string {
  const stepsHtml = task.steps.length > 0 ? `
    <div class="steps-section">
      <div class="section-title">Lösungsschritte / Các bước giải</div>
      ${task.steps.map((step, i) => `
        <div class="step-row">
          <div class="step-number">${i + 1}</div>
          <div class="step-content">
            <div class="step-title">${escapeHtml(step.title_de)}</div>
            <div class="step-desc">${escapeHtml(step.description_de)}</div>
          </div>
          <div class="step-content">
            <div class="step-title">${escapeHtml(step.title_vi)}</div>
            <div class="step-desc">${escapeHtml(step.description_vi)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  ` : '';

  const tableHtml = task.solutionTable.length > 0 ? `
    <table class="solution-table">
      <thead>
        <tr>
          <th class="col-nr">Nr.</th>
          <th class="col-label">Deutsch</th>
          <th class="col-value">Wert</th>
          <th class="col-label">Tiếng Việt</th>
          <th class="col-value">Giá trị</th>
        </tr>
      </thead>
      <tbody>
        ${task.solutionTable.map(row => `
          <tr>
            <td class="col-nr">${escapeHtml(row.taskNumber)}</td>
            <td>${escapeHtml(row.label_de)}</td>
            <td>${escapeHtml(row.value_de)}</td>
            <td>${escapeHtml(row.label_vi)}</td>
            <td>${escapeHtml(row.value_vi)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '';

  const teacherHtml = task.teacherSection ? `
    <div class="teacher-section">
      <div class="teacher-title">Lehrerbereich</div>
      <div class="teacher-grid">
        <div class="teacher-item">
          <div class="teacher-label">Lernziel</div>
          <div class="teacher-content">${escapeHtml(task.teacherSection.learningGoal_de)}</div>
        </div>
        <div class="teacher-item">
          <div class="teacher-label">Zusammenfassung</div>
          <div class="teacher-content">${escapeHtml(task.teacherSection.summary_de)}</div>
        </div>
        ${task.teacherSection.studentSteps_de.length > 0 ? `
          <div class="teacher-item teacher-steps">
            <div class="teacher-label">Schüler-Arbeitsschritte</div>
            <div class="teacher-content">
              <ol>
                ${task.teacherSection.studentSteps_de.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
              </ol>
            </div>
          </div>
        ` : ''}
        <div class="teacher-item" style="grid-column: 1 / -1;">
          <div class="teacher-label">Erklärung</div>
          <div class="teacher-content">${escapeHtml(task.teacherSection.explanation_de)}</div>
        </div>
      </div>
    </div>
  ` : '';

  return `
    <div class="task-block">
      <div class="task-main">
        <div class="task-header">
          <span class="task-badge">${escapeHtml(task.displayId || task.id.slice(0, 8))}</span>
          <span class="task-title">${escapeHtml(task.taskTitle)}</span>
          <span class="task-meta">${escapeHtml(task.grade)} · ${escapeHtml(task.subject)} · S.${task.pageNumber}</span>
        </div>

        <div class="bilingual-grid">
          <div class="lang-column">
            <div class="lang-label de">Deutsch</div>
            <div class="description-box">${escapeHtml(task.taskDescription_de)}</div>
          </div>
          <div class="lang-column">
            <div class="lang-label vi">Tiếng Việt</div>
            <div class="description-box">${escapeHtml(task.taskDescription_vi)}</div>
          </div>
        </div>

        ${stepsHtml}
        ${tableHtml}

        <div class="final-solution">
          <div class="final-title">Endergebnis / Kết quả cuối cùng</div>
          <div class="final-grid">
            <div class="final-text">${escapeHtml(task.finalSolution_de)}</div>
            <div class="final-text">${escapeHtml(task.finalSolution_vi)}</div>
          </div>
        </div>
      </div>

      ${teacherHtml}
    </div>
  `;
}

// Preview Window Icons
const ICONS = {
  print: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>`,
  file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`
};

export const PDFExportService = {
  /**
   * Öffnet ein Vorschau-Fenster und ermöglicht den Druck aller Tasks
   */
  async exportToPDF(
    tasks: TaskSolution[],
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    if (tasks.length === 0) return;

    // Sortiere nach Klasse, Fach, Seite
    const sorted = [...tasks].sort((a, b) => {
      if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
      if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
      return a.pageNumber - b.pageNumber;
    });

    // HTML generieren
    const now = new Date();
    const dateStr = now.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let tasksHtml = '';
    for (let i = 0; i < sorted.length; i++) {
      tasksHtml += renderTaskHtml(sorted[i]);
      onProgress?.(i + 1, sorted.length);
    }

    const fullHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ToniLernwelt Export - ${dateStr}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <div class="preview-controls no-print">
    <div class="preview-title">
      ${ICONS.file}
      <span>Druckvorschau</span>
    </div>
    <div class="preview-info">${sorted.length} Aufgaben · ${dateStr}</div>
    <div class="preview-buttons">
      <label style="display:flex;align-items:center;gap:5px;color:#94a3b8;font-size:11px;cursor:pointer;">
        <input type="checkbox" id="showTeacher" style="cursor:pointer;">
        <span>Lehrerbereich</span>
      </label>
      <button class="btn-cancel" onclick="window.close()">Schließen</button>
      <button class="btn-print" onclick="window.print()">
        ${ICONS.print}
        Drucken
      </button>
    </div>
  </div>

  <div class="header-spacer no-print"></div>

  <div class="print-container">
    <div class="summary-header">
      <div class="summary-title">ToniLernwelt – Aufgaben</div>
    </div>

    ${tasksHtml}
  </div>

  <script>
    window.focus();

    // Toggle Lehrerbereich
    const checkbox = document.getElementById('showTeacher');
    const style = document.createElement('style');
    style.id = 'teacher-toggle';
    document.head.appendChild(style);

    checkbox.addEventListener('change', function() {
      if (this.checked) {
        style.textContent = '.teacher-section { display: block !important; }';
      } else {
        style.textContent = '@media print { .teacher-section { display: none !important; } }';
      }
    });

    // Initial: Lehrerbereich im Druck ausblenden
    style.textContent = '@media print { .teacher-section { display: none !important; } }';
  </script>
</body>
</html>`;

    // Neues Fenster öffnen
    const previewWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
    if (!previewWindow) {
      alert('Popup blockiert! Bitte erlaube Popups für diese Seite.');
      return;
    }

    previewWindow.document.write(fullHtml);
    previewWindow.document.close();
  },

  /**
   * Einzelne Aufgabe exportieren
   */
  async exportSingleTask(task: TaskSolution): Promise<void> {
    return this.exportToPDF([task]);
  }
};
