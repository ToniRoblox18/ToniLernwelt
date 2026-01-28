/**
 * TaskModel - Business Logic Layer
 * Verwendet das Repository-Pattern für persistente Datenhaltung
 */

import { TaskSolution } from '../types';
import { getRepository } from '../services/repository';
import type { ITaskRepository, FilterOptions } from '../services/repository';

export class TaskModel {
  private static tasks: TaskSolution[] = [];
  private static repo: ITaskRepository | null = null;

  /**
   * Initialisiert das Repository und lädt alle Aufgaben
   */
  static async load(): Promise<TaskSolution[]> {
    this.repo = await getRepository();
    this.tasks = await this.repo.getAll();
    return this.tasks;
  }

  /**
   * Generiert eine fachliche Unique ID (z.B. K3_MAT_5)
   */
  private static generateId(task: TaskSolution, allTasks: TaskSolution[]): string {
    // 1. Grade (Klasse 2 -> K2)
    const gradeNum = task.grade.match(/\d+/)?.[0] || '0';
    const gradeCode = `K${gradeNum}`;

    // 2. Subject (Mathematik -> MAT)
    const subjectMap: Record<string, string> = {
      'Deutsch': 'DEU', 'Mathematik': 'MAT', 'Sachkunde': 'SAC',
      'Englisch': 'ENG', 'Kunst': 'KUN', 'Musik': 'MUS',
      'Sport': 'SPO', 'Religion': 'REL', 'Ethik': 'ETH',
      'Physik': 'PHY', 'Chemie': 'CHE', 'Biologie': 'BIO',
      'Geschichte': 'GES', 'Geografie': 'GEO'
    };
    // Fuzzy search or substring check could be added, but simple map for now
    let subjectCode = 'SON'; // Sonstiges
    for (const [key, val] of Object.entries(subjectMap)) {
      if (task.subject && task.subject.includes(key)) {
        subjectCode = val;
        break;
      }
    }

    // 3. Count (How many Kx_SUB exist?)
    // Filter existing tasks that match this pattern to find the max number
    const prefix = `${gradeCode}_${subjectCode}`;
    const existing = allTasks.filter(t => t.displayId && t.displayId.startsWith(prefix));

    // Find max number
    let maxNum = 0;
    existing.forEach(t => {
      const parts = t.displayId?.split('_');
      if (parts && parts.length === 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });

    return `${prefix}_${maxNum + 1}`;
  }

  /**
   * Fügt neue Aufgaben hinzu (mit Deduplizierung via Fingerprint)
   */
  static async addTasks(newTasks: TaskSolution[]): Promise<TaskSolution[]> {
    if (!this.repo) await this.load();

    const validTasks: TaskSolution[] = [];

    // Working copoy of current tasks to count correctly within this batch
    const currentTasks = [...this.tasks];

    for (const task of newTasks) {
      // Skip duplicates based on fingerprint
      if (task.fileFingerprint && await this.repo!.exists(task.fileFingerprint)) {
        console.warn(`Task mit Fingerprint ${task.fileFingerprint} existiert bereits, übersprungen.`);
        continue;
      }

      // Generate ID if missing
      if (!task.displayId) {
        task.displayId = this.generateId(task, currentTasks);
        currentTasks.push(task); // Add to temp list so next one counts up correctly
      }

      await this.repo!.save(task);
      validTasks.push(task);
    }

    // Update local cache
    this.tasks = [...this.tasks, ...validTasks].sort((a, b) => b.timestamp - a.timestamp);
    return this.tasks;
  }

  /**
   * Entfernt eine Aufgabe (inkl. zugehöriger Audio-Daten)
   */
  static async removeTask(id: string): Promise<TaskSolution[]> {
    if (!this.repo) await this.load();

    await this.repo!.delete(id);
    this.tasks = this.tasks.filter(t => t.id !== id);
    return this.tasks;
  }

  /**
   * Löscht alle Aufgaben und Audio-Daten
   */
  static async clear(): Promise<TaskSolution[]> {
    if (!this.repo) await this.load();

    await this.repo!.clearAll();
    this.tasks = [];
    return [];
  }

  /**
   * Gibt alle geladenen Aufgaben zurück (cached)
   */
  static getAll(): TaskSolution[] {
    return this.tasks;
  }

  /**
   * Prüft ob ein Fingerprint bereits existiert (für Deduplizierung)
   */
  static exists(fingerprint: string): boolean {
    return this.tasks.some(t => t.fileFingerprint === fingerprint);
  }

  /**
   * Findet eine Aufgabe nach ID
   */
  static getById(id: string): TaskSolution | undefined {
    return this.tasks.find(t => t.id === id);
  }

  // === Filter-Funktionen ===

  /**
   * Filtert Aufgaben nach Hierarchie
   */
  static async filter(options: FilterOptions): Promise<TaskSolution[]> {
    if (!this.repo) await this.load();
    return this.repo!.filterByHierarchy(options);
  }

  /**
   * Gibt alle einzigartigen Klassen zurück
   */
  static getUniqueGrades(): string[] {
    return [...new Set(this.tasks.map(t => t.grade).filter(Boolean))].sort();
  }

  /**
   * Gibt alle einzigartigen Fächer zurück (optional gefiltert nach Klasse)
   */
  static getUniqueSubjects(grade?: string): string[] {
    let filtered = this.tasks;
    if (grade) filtered = filtered.filter(t => t.grade === grade);
    return [...new Set(filtered.map(t => t.subject).filter(Boolean))].sort();
  }

  /**
   * Gibt alle einzigartigen Themen zurück (optional gefiltert)
   */
  static getUniqueSubSubjects(grade?: string, subject?: string): string[] {
    let filtered = this.tasks;
    if (grade) filtered = filtered.filter(t => t.grade === grade);
    if (subject) filtered = filtered.filter(t => t.subject === subject);
    return [...new Set(filtered.map(t => t.subSubject).filter(Boolean))].sort();
  }

  /**
   * Filtert Aufgaben lokal (ohne DB-Zugriff, für Performance)
   */
  static filterLocal(options: FilterOptions): TaskSolution[] {
    return this.tasks.filter(task => {
      if (options.grade && task.grade !== options.grade) return false;
      if (options.subject && task.subject !== options.subject) return false;
      if (options.subSubject && task.subSubject !== options.subSubject) return false;
      return true;
    });
  }

  // === Audio-Helpers ===

  /**
   * Speichert Audio-Buffer für eine Aufgabe
   */
  static async saveAudio(taskId: string, buffer: AudioBuffer): Promise<void> {
    if (!this.repo) await this.load();
    await this.repo!.saveAudio(taskId, buffer);
  }

  /**
   * Lädt Audio-Buffer für eine Aufgabe
   */
  static async getAudio(taskId: string, ctx: AudioContext): Promise<AudioBuffer | null> {
    if (!this.repo) await this.load();
    return this.repo!.getAudio(taskId, ctx);
  }
}
