
import { TaskSolution } from '../types';
import { DBService } from '../services/dbService';

export class TaskModel {
  private static tasks: TaskSolution[] = [];

  static async load(): Promise<TaskSolution[]> {
    this.tasks = (await DBService.getAllTasks()).sort((a, b) => b.timestamp - a.timestamp);
    return this.tasks;
  }

  static async addTasks(newTasks: TaskSolution[]): Promise<TaskSolution[]> {
    for (const task of newTasks) {
      await DBService.saveTask(task);
    }
    this.tasks = [...this.tasks, ...newTasks].sort((a, b) => b.timestamp - a.timestamp);
    return this.tasks;
  }

  static async removeTask(id: string): Promise<TaskSolution[]> {
    await DBService.deleteTask(id);
    this.tasks = this.tasks.filter(t => t.id !== id);
    return this.tasks;
  }

  static async clear(): Promise<TaskSolution[]> {
    await DBService.clearAll();
    this.tasks = [];
    return [];
  }

  static getAll(): TaskSolution[] {
    return this.tasks;
  }

  static exists(fingerprint: string): boolean {
    return this.tasks.some(t => t.fileFingerprint === fingerprint);
  }
}
