
import { TaskModel } from '../model/TaskModel';
import { TaskSolution } from '../types';

export class TaskModelTests {
  static async runAll() {
    console.group("%c LernBegleiter - TDD Suite ", "background: #2563eb; color: white; font-weight: bold; padding: 2px 4px; border-radius: 4px;");
    await this.testHierarchyIntegrity();
    await this.testCleanupOnDelete();
    await this.testDeduplication();
    console.groupEnd();
  }

  private static async testHierarchyIntegrity() {
    await TaskModel.clear();
    const task = { 
      id: 'h1', 
      grade: 'Klasse 2', 
      subject: 'Deutsch', 
      subSubject: 'Grammatik',
      timestamp: Date.now() 
    } as TaskSolution;
    
    await TaskModel.addTasks([task]);
    const all = TaskModel.getAll();
    
    console.assert(all[0].grade === 'Klasse 2', "Grade sollte 'Klasse 2' sein");
    console.assert(all[0].subject === 'Deutsch', "Subject sollte 'Deutsch' sein");
    console.log("Hierarchie-Test: Bestanden ✅");
  }

  private static async testCleanupOnDelete() {
    await TaskModel.clear();
    const id = 'del-123';
    await TaskModel.addTasks([{ id, taskTitle: 'Zu löschen', timestamp: Date.now() } as TaskSolution]);
    
    console.assert(TaskModel.getAll().length === 1, "Aufgabe sollte hinzugefügt worden sein");
    
    await TaskModel.removeTask(id);
    console.assert(TaskModel.getAll().length === 0, "Aufgabe sollte gelöscht worden sein");
    console.log("Cleanup-Test: Bestanden ✅");
  }

  private static async testDeduplication() {
    await TaskModel.clear();
    const fingerprint = "finger-abc-123";
    await TaskModel.addTasks([{ id: '1', fileFingerprint: fingerprint, timestamp: Date.now() } as TaskSolution]);
    
    const exists = TaskModel.exists(fingerprint);
    console.assert(exists === true, "Fingerprint sollte erkannt werden");
    console.log("Deduplizierungstest: Bestanden ✅");
  }
}
