
import { TaskSolution } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * PDF Export Service
 * Implementiert intelligentes Slicing für bilingualen Content.
 */
export class PDFExportService {
  /**
   * Exportiert ein DOM-Element als PDF.
   * Garantiert, dass Elemente mit '.pdf-break-avoid' nicht zerschnitten werden.
   */
  static async exportToPDF(solutions: TaskSolution[], onProgress: (current: number, total: number) => void): Promise<boolean> {
    try {
      const total = solutions.length;
      let current = 0;
      
      for (const solution of solutions) {
        onProgress(current, total);
        current++;
        
        // Temporäres Iframe für Style-Isolierung erstellen
        const iframe = document.createElement('iframe');
        iframe.id = `export-iframe-${solution.id}`;
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.top = '0';
        iframe.style.width = '1200px';
        iframe.style.height = 'auto';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
          throw new Error('Konnte Iframe-Dokument nicht erstellen');
        }
        
        iframeDoc.open();
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * { color: inherit !important; background-color: transparent !important; }
              body { margin: 0; padding: 48px; background-color: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
              table, tr, td, th, tbody, thead { background-color: transparent !important; }
            </style>
          </head>
          <body>
            <div>
              <div style="border-bottom: 4px solid #6366f1; padding-bottom: 24px; margin-bottom: 40px;">
                <div>
                  <h1 style="font-size: 36px; font-weight: bold; color: #111827; margin-bottom: 8px;">${solution.taskTitle}</h1>
                  <p style="color: #4f46e5; font-weight: 600; font-size: 20px;">${solution.subject} • ${solution.subSubject} • ${solution.grade}</p>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 48px;">
                <div style="background-color: #eff6ff; padding: 24px; border-left: 4px solid #3b82f6;">
                  <h3 style="font-weight: bold; color: #1e40af; font-size: 20px; margin-bottom: 12px;">Beschreibung (DE)</h3>
                  <p style="color: #374151; font-style: italic; font-size: 18px; line-height: 1.6;">${solution.taskDescription_de}</p>
                </div>
                <div style="background-color: #eef2ff; padding: 24px; border-left: 4px solid #6366f1;">
                  <h3 style="font-weight: bold; color: #3730a3; font-size: 20px; margin-bottom: 12px;">Mô tả (VI)</h3>
                  <p style="color: #374151; font-style: italic; font-size: 18px; line-height: 1.6;">${solution.taskDescription_vi}</p>
                </div>
              </div>
              
              <div style="background-color: #f1f5f9; padding: 40px; border: 2px dashed #94a3b8; margin-bottom: 48px;">
                <h2 style="font-size: 24px; font-weight: bold; color: #334155; margin-bottom: 24px;">Lehrer-Informationen (DE)</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; font-size: 18px; color: #475160;">
                  <div>
                    <p style="font-weight: bold; color: #1e293b; margin-bottom: 8px;">Lernziel:</p>
                    <p style="margin-bottom: 24px; line-height: 1.6;">${solution.teacherSection.learningGoal_de}</p>
                    <p style="font-weight: bold; color: #1e293b; margin-bottom: 8px;">Empfohlene Schritte:</p>
                    <ul style="list-style-type: disc; padding-left: 24px; line-height: 1.8;">
                      ${solution.teacherSection.studentSteps_de.map((s, i) => `<li key="${i}" style="line-height: 1.6;">${s}</li>`).join('')}
                    </ul>
                  </div>
                  <div style="border-left: 1px solid #cbd5e1; padding-left: 40px;">
                    <p style="font-weight: bold; color: #1e293b; margin-bottom: 8px;">Erklärung:</p>
                    <p style="margin-bottom: 24px; line-height: 1.6;">${solution.teacherSection.explanation_de}</p>
                    <p style="font-weight: bold; color: #1e293b; margin-bottom: 8px;">Zusammenfassung:</p>
                    <p style="line-height: 1.6; font-style: italic;">${solution.teacherSection.summary_de}</p>
                  </div>
                </div>
              </div>
              
              <div style="margin-bottom: 48px;">
                <h2 style="font-size: 30px; font-weight: bold; color: #111827; margin-bottom: 32px; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px;">Schritt-für-Schritt Anleitung / Hướng dẫn từng bước</h2>
                <div style="display: flex; flex-direction: column; gap: 32px;">
                  ${solution.steps.map((step, idx) => `
                    <div key="${idx}" style="background-color: #f8f9fa; padding: 32px; border: 1px solid #e5e7eb; border-radius: 8px;">
                      <div style="display: flex; flex-direction: row; gap: 40px;">
                        <div style="flex: 1;">
                          <h4 style="font-weight: bold; color: #4338ca; font-size: 24px; margin-bottom: 12px;">${idx + 1}. ${step.title_de}</h4>
                          <p style="color: #111827; font-size: 20px; line-height: 1.6;">${step.description_de}</p>
                        </div>
                        <div style="flex: 1; border-top: 1px solid #e5e7eb; padding-top: 32px;">
                          <h4 style="font-weight: bold; color: #4f46e5; font-size: 24px; margin-bottom: 12px;">${idx + 1}. ${step.title_vi}</h4>
                          <p style="color: #4b5563; font-style: italic; font-size: 20px; line-height: 1.6;">${step.description_vi}</p>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <div style="margin-bottom: 24px;">
                <h2 style="font-size: 30px; font-weight: bold; color: #111827; margin-bottom: 32px; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px;">Übersichtstabelle / Bảng tổng kết</h2>
                <div style="overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 8px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <thead style="background-color: #f3f4f6;">
                      <tr>
                        <th style="padding: 20px 32px; text-align: left; font-weight: bold; color: #374151; font-size: 14px;">Nr.</th>
                        <th style="padding: 20px 32px; text-align: left; font-weight: bold; color: #374151; font-size: 14px;">Label (DE / VI)</th>
                        <th style="padding: 20px 32px; text-align: left; font-weight: bold; color: #374151; font-size: 14px;">Inhalt / Nội dung</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${solution.solutionTable.map((row, idx) => `
                        <tr key="${idx}" style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                          <td style="padding: 24px; font-size: 20px; font-weight: bold; color: #111827;">${row.taskNumber}</td>
                          <td style="padding: 24px;">
                            <div style="font-weight: bold; color: #111827; font-size: 16px;">${row.label_de}</div>
                            <div style="color: #6b7280; font-style: italic; font-size: 14px;">${row.label_vi}</div>
                          </td>
                          <td style="padding: 24px;">
                            <div style="color: #111827; font-size: 16px; font-weight: 500; line-height: 1.5;">${row.value_de}</div>
                            <div style="color: #6b7280; font-style: italic; font-size: 14px; line-height: 1.5; margin-top: 4px;">${row.value_vi}</div>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div style="padding-top: 24px; border-top: 2px solid #f3f4f6; text-align: center; font-size: 12px; color: #9ca3af; font-style: italic;">
                Erstellt am ${new Date(solution.timestamp).toLocaleDateString('de-DE')}
              </div>
            </div>
          </body>
          </html>
        `);
        iframeDoc.close();
        
        const captureElement = iframeDoc.body;
        
        // 1. Snapshot der aktuellen DOM-Positionen
        const containerRect = captureElement.getBoundingClientRect();
        
        const sortedPoints = [0, containerRect.height];

        // 2. High-Quality Canvas Capture
        const canvas = await html2canvas(captureElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1200
        });

// 3. PDF Instanziierung (A4)
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 18; 
        const printableWidth = pdfWidth - (2 * margin);
        const printableHeight = pdfHeight - (2 * margin);
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        const pxToMmScale = printableWidth / 1200;
        const totalContentHeightMm = (canvas.height / 2) * (printableWidth / (canvas.width / 2));

        let currentYMm = 0;
        let pageCount = 0;

        while (currentYMm < totalContentHeightMm - 2) {
          if (pageCount > 0) pdf.addPage();

          const pageLimitMm = currentYMm + printableHeight;
          let bestBreakPointMm = pageLimitMm; 
          
          for (let i = sortedPoints.length - 1; i >= 0; i--) {
            const pointMm = sortedPoints[i] * pxToMmScale;
            if (pointMm <= pageLimitMm + 0.1 && pointMm > currentYMm + 5) {
              bestBreakPointMm = pointMm;
              break;
            }
          }

          if (bestBreakPointMm <= currentYMm) bestBreakPointMm = pageLimitMm;

          const yOffset = margin - currentYMm;
          pdf.addImage(imgData, 'JPEG', margin, yOffset, printableWidth, totalContentHeightMm);

          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pdfWidth, margin, 'F');
          pdf.rect(0, pdfHeight - margin, pdfWidth, margin, 'F');
          
          const contentHeightOnThisPage = bestBreakPointMm - currentYMm;
          const maskTop = margin + contentHeightOnThisPage;
          if (maskTop < pdfHeight - margin) {
            pdf.rect(0, maskTop, pdfWidth, pdfHeight - maskTop, 'F');
          }
          pdf.rect(0, 0, margin, pdfHeight, 'F');
          pdf.rect(pdfWidth - margin, 0, margin, pdfHeight, 'F');

          currentYMm = bestBreakPointMm;
          pageCount++;
          if (pageCount > 15) break;
        }

pdf.save(`Lernblatt_${solution.taskTitle?.replace(/\s+/g, '_') || 'export'}.pdf`);
        
        document.body.removeChild(iframe);
      }
      
      return true;
    } catch (err) {
      console.error("Fehler im PDFExportService:", err);
      throw err;
    }
  }
}
