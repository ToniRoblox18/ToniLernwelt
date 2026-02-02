/**
 * PDF Export Test für Vietnamese Text
 * Testet den Export von vietnamesischen Inhalten in einer Tabelle
 */

import { PDFExportService } from '../services/pdfExportService';
import type { TaskSolution } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class PDFExportTests {
  static async runAll(): Promise<void> {
    console.group("%c 📄 PDF Export Test Suite ", "background: #8b5cf6; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;");

    const results: { name: string; passed: boolean; error?: Error; pdfPath?: string }[] = [];

    try {
      results.push(await this.runTest("Vietnamese Text in Tabelle", this.testVietnameseTableExport));
    } finally {
      this.printSummary(results);
      console.groupEnd();
    }
  }

  private static async runTest(
    name: string,
    testFn: () => Promise<{ pdfPath?: string }>
  ): Promise<{ name: string; passed: boolean; error?: Error; pdfPath?: string }> {
    try {
      const result = await testFn();
      console.log(`%c ✅ ${name} `, "color: #10b981;");
      if (result.pdfPath) {
        console.log(`%c 📁 PDF gespeichert: ${result.pdfPath} `, "color: #3b82f6;");
      }
      return { name, passed: true, pdfPath: result.pdfPath };
    } catch (error) {
      console.error(`%c ❌ ${name} `, "color: #ef4444;", error);
      return { name, passed: false, error: error as Error };
    }
  }

  private static printSummary(results: { name: string; passed: boolean; pdfPath?: string }[]): void {
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const emoji = passed === total ? '🎉' : '⚠️';

    console.log(`\n%c ${emoji} Tests bestanden: ${passed}/${total} `,
      passed === total
        ? "background: #10b981; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;"
        : "background: #f59e0b; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;"
    );

    // PDF Pfade ausgeben
    results.forEach(r => {
      if (r.pdfPath) {
        console.log(`%c 📄 ${r.name}: ${r.pdfPath} `, "color: #6366f1;");
      }
    });
  }

  // === Test Cases ===

  private static async testVietnameseTableExport(): Promise<{ pdfPath?: string }> {
    const testTask = createVietnameseTableTask();
    
    // Erstelle Test-Output-Verzeichnis
    const outputDir = path.join(process.cwd(), 'test-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Exportiere zu PDF
    await PDFExportService.exportToPDF([testTask], (current, total) => {
      console.log(`Export Fortschritt: ${current}/${total}`);
    });

    const expectedFileName = 'das_dass_Ubung.pdf';
    const pdfPath = path.join(process.cwd(), expectedFileName);
    
    // Prüfe ob PDF erstellt wurde
    assertThat(fs.existsSync(pdfPath), `PDF sollte erstellt werden: ${pdfPath}`);

    // Verschiebe zu test-output
    const finalPath = path.join(outputDir, expectedFileName);
    if (fs.existsSync(finalPath)) {
      fs.unlinkSync(finalPath);
    }
    fs.renameSync(pdfPath, finalPath);

    return { pdfPath: finalPath };
  }
}

// === Helper Functions ===

function createVietnameseTableTask(): TaskSolution {
  return {
    id: `vietnamese-test-${Date.now()}`,
    pageNumber: 1,
    grade: 'Klasse 5',
    subject: 'Deutsch',
    subSubject: 'Grammatik',
    taskTitle: 'das/dass Übung',
    taskDescription_de: 'Übung zu das/dass mit vietnamesischen Erklärungen',
    taskDescription_vi: 'Bài tập về das/dass với giải thích tiếng Việt',
    steps: [
      {
        title_de: 'Lerne die Ersetzungsmethode',
        title_vi: 'Học cách thử thay thế',
        description_de: 'Verwende "das" mit einem s, wenn du es durch "dieses", "jenes" oder "welches" ersetzen kannst.',
        description_vi: "Sử dụng 'das' với một chữ 's' khi bạn có thể thay thế nó bằng 'dieses', 'jenes' hoặc 'welches'."
      },
      {
        title_de: 'Erkenne die Konjunktion',
        title_vi: 'Nhận biết liên từ',
        description_de: 'Schreibe "dass" mit zwei s, wenn es einen Nebensatz einleitet und nicht ersetzt werden kann.',
        description_vi: "Viết 'dass' với hai chữ 's' khi nó bắt đầu một mệnh đề phụ và không thể thay thế được."
      },
      {
        title_de: 'Korrigiere den Text',
        title_vi: 'Sửa lỗi đoạn văn',
        description_de: 'Lies den Text sorgfältig und prüfe jedes "das/dass", ob die Regel eingehalten wurde.',
        description_vi: 'Đọc kỹ đoạn văn và kiểm tra từng từ "das/dass" xem quy tắc đã được tuân thủ chưa.'
      }
    ],
    solutionTable: [
      {
        taskNumber: '1',
        label_de: 'Unterstützung',
        label_vi: 'Hỗ trợ',
        value_de: 'Lerne die Ersetzungsmethode',
        value_vi: 'Học cách thử thay thế'
      },
      {
        taskNumber: '2',
        label_de: 'Regel "das"',
        label_vi: 'Quy tắc "das"',
        value_de: 'Verwende "das" mit einem s, wenn du es durch "dieses", "jenes" oder "welches" ersetzen kannst.',
        value_vi: "Sử dụng 'das' với một chữ 's' khi bạn có thể thay thế nó bằng 'dieses', 'jenes' hoặc 'welches'."
      },
      {
        taskNumber: '3',
        label_de: 'Regel "dass"',
        label_vi: 'Quy tắc "dass"',
        value_de: 'Schreibe "dass" mit zwei s, wenn es einen Nebensatz einleitet und nicht ersetzt werden kann.',
        value_vi: "Viết 'dass' với hai chữ 's' khi nó bắt đầu một mệnh đề phụ và không thể thay thế được."
      },
      {
        taskNumber: '4',
        label_de: 'Aufgabe',
        label_vi: 'Nhiệm vụ',
        value_de: 'Lies den Text sorgfältig und prüfe jedes "das/dass", ob die Regel eingehalten wurde.',
        value_vi: 'Đọc kỹ đoạn văn và kiểm tra từng từ "das/dass" xem quy tắc đã được tuân thủ chưa.'
      },
      {
        taskNumber: '5',
        label_de: 'Aktion',
        label_vi: 'Hành động',
        value_de: 'Lege los',
        value_vi: 'lege los'
      }
    ],
    finalSolution_de: 'Die Übung testet das Verständnis der das/dass Regel.',
    finalSolution_vi: 'Bài tập kiểm tra sự hiểu biết về quy tắc das/dass.',
    teacherSection: {
      learningGoal_de: 'Schüler können zwischen "das" und "dass" unterscheiden',
      studentSteps_de: [
        'Ersetzungsmethode anwenden',
        'Konjunktion erkennen',
        'Text korrigieren'
      ],
      explanation_de: 'Diese Übung hilft beim Verständnis der das/dass Unterscheidung',
      summary_de: 'Wichtige Rechtschreibregel für deutsche Grammatik'
    },
    timestamp: Date.now(),
    isTestData: true
  };
}

function assertThat(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Export für Browser-Konsolenzugriff
if (typeof window !== 'undefined') {
  (window as any).PDFExportTests = PDFExportTests;
}
