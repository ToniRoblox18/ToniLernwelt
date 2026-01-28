/**
 * LernBegleiter Pro - TDD Suite
 * Testet Hierarchie-Integrität, Repository-Pattern und Cleanup-Verhalten
 */

import { TaskModel } from '../model/TaskModel';
import type { TaskSolution } from '../types';
import { resetRepository } from '../services/repository';

export class TaskModelTests {
  static async runAll(): Promise<void> {
    console.group("%c 🧪 LernBegleiter Pro - TDD Suite ", "background: #2563eb; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;");

    const results: { name: string; passed: boolean; error?: Error }[] = [];

    try {
      await this.reset();
      results.push(await this.runTest("Hierarchie-Integrität", this.testHierarchyIntegrity));

      await this.reset();
      results.push(await this.runTest("Cleanup bei Löschung", this.testCleanupOnDelete));

      await this.reset();
      results.push(await this.runTest("Deduplizierung via Fingerprint", this.testDeduplication));

      await this.reset();
      results.push(await this.runTest("Filter nach Klasse", this.testFilterByGrade));

      await this.reset();
      results.push(await this.runTest("Filter nach Fach", this.testFilterBySubject));

      await this.reset();
      results.push(await this.runTest("Batch-Speicherung", this.testBatchSave));

    } finally {
      await this.reset();
      this.printSummary(results);
      console.groupEnd();
    }
  }

  private static async runTest(
    name: string,
    testFn: () => Promise<void>
  ): Promise<{ name: string; passed: boolean; error?: Error }> {
    try {
      await testFn();
      console.log(`%c ✅ ${name} `, "color: #10b981;");
      return { name, passed: true };
    } catch (error) {
      console.error(`%c ❌ ${name} `, "color: #ef4444;", error);
      return { name, passed: false, error: error as Error };
    }
  }

  private static async reset(): Promise<void> {
    resetRepository();
    await TaskModel.clear();
  }

  private static printSummary(results: { name: string; passed: boolean }[]): void {
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const emoji = passed === total ? '🎉' : '⚠️';

    console.log(`\n%c ${emoji} Tests bestanden: ${passed}/${total} `,
      passed === total
        ? "background: #10b981; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;"
        : "background: #f59e0b; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;"
    );
  }

  // === Test Cases ===

  private static async testHierarchyIntegrity(): Promise<void> {
    const task = createMockTask({
      id: 'hier-1',
      grade: 'Klasse 2',
      subject: 'Deutsch',
      subSubject: 'Leseverständnis'
    });

    await TaskModel.addTasks([task]);
    const all = TaskModel.getAll();

    assertThat(all.length === 1, "Eine Aufgabe sollte existieren");
    assertThat(all[0].grade === 'Klasse 2', "Grade sollte 'Klasse 2' sein");
    assertThat(all[0].subject === 'Deutsch', "Subject sollte 'Deutsch' sein");
    assertThat(all[0].subSubject === 'Leseverständnis', "SubSubject sollte 'Leseverständnis' sein");
  }

  private static async testCleanupOnDelete(): Promise<void> {
    const id = 'del-123';
    await TaskModel.addTasks([createMockTask({ id, taskTitle: 'Zu löschen' })]);

    assertThat(TaskModel.getAll().length === 1, "Aufgabe sollte hinzugefügt sein");

    await TaskModel.removeTask(id);

    assertThat(TaskModel.getAll().length === 0, "Aufgabe sollte gelöscht sein");
    assertThat(TaskModel.getById(id) === undefined, "GetById sollte undefined zurückgeben");
  }

  private static async testDeduplication(): Promise<void> {
    const fingerprint = "unique-fp-abc-123";

    await TaskModel.addTasks([
      createMockTask({ id: 'dup-1', fileFingerprint: fingerprint })
    ]);

    assertThat(TaskModel.exists(fingerprint), "Fingerprint sollte existieren");

    // Versuch, Duplikat hinzuzufügen
    const before = TaskModel.getAll().length;
    await TaskModel.addTasks([
      createMockTask({ id: 'dup-2', fileFingerprint: fingerprint })
    ]);
    const after = TaskModel.getAll().length;

    assertThat(before === after, "Duplikat sollte nicht hinzugefügt werden");
  }

  private static async testFilterByGrade(): Promise<void> {
    await TaskModel.addTasks([
      createMockTask({ id: 'f1', grade: 'Klasse 1', subject: 'Mathe' }),
      createMockTask({ id: 'f2', grade: 'Klasse 2', subject: 'Deutsch' }),
      createMockTask({ id: 'f3', grade: 'Klasse 2', subject: 'Mathe' })
    ]);

    const filtered = TaskModel.filterLocal({ grade: 'Klasse 2' });

    assertThat(filtered.length === 2, "2 Aufgaben sollten gefiltert werden");
    assertThat(filtered.every(t => t.grade === 'Klasse 2'), "Alle sollten Klasse 2 sein");
  }

  private static async testFilterBySubject(): Promise<void> {
    await TaskModel.addTasks([
      createMockTask({ id: 's1', grade: 'Klasse 2', subject: 'Deutsch' }),
      createMockTask({ id: 's2', grade: 'Klasse 2', subject: 'Mathe' }),
      createMockTask({ id: 's3', grade: 'Klasse 3', subject: 'Deutsch' })
    ]);

    const filtered = TaskModel.filterLocal({ grade: 'Klasse 2', subject: 'Deutsch' });

    assertThat(filtered.length === 1, "1 Aufgabe sollte gefiltert werden");
    assertThat(filtered[0].subject === 'Deutsch', "Subject sollte Deutsch sein");
  }

  private static async testBatchSave(): Promise<void> {
    const tasks = [
      createMockTask({ id: 'b1', taskTitle: 'Batch 1' }),
      createMockTask({ id: 'b2', taskTitle: 'Batch 2' }),
      createMockTask({ id: 'b3', taskTitle: 'Batch 3' })
    ];

    await TaskModel.addTasks(tasks);

    assertThat(TaskModel.getAll().length === 3, "Alle 3 Aufgaben sollten gespeichert sein");
  }
}

// === Helper Functions ===

function createMockTask(overrides: Partial<TaskSolution>): TaskSolution {
  return {
    id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    pageNumber: 1,
    grade: 'Klasse 2',
    subject: 'Deutsch',
    subSubject: 'Test',
    taskTitle: 'Mock Task',
    taskDescription_de: 'Test Beschreibung',
    taskDescription_vi: 'Mô tả thử nghiệm',
    steps: [],
    solutionTable: [],
    finalSolution_de: '',
    finalSolution_vi: '',
    teacherSection: {
      learningGoal_de: '',
      studentSteps_de: [],
      explanation_de: '',
      summary_de: ''
    },
    timestamp: Date.now(),
    ...overrides
  };
}

function assertThat(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Export for browser console access
if (typeof window !== 'undefined') {
  (window as any).TaskModelTests = TaskModelTests;
}
