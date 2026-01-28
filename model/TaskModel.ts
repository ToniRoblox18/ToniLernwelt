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
   * Fügt neue Aufgaben hinzu (mit Deduplizierung via Fingerprint)
   */
  static async addTasks(newTasks: TaskSolution[]): Promise<TaskSolution[]> {
    if (!this.repo) await this.load();

    const validTasks: TaskSolution[] = [];

    for (const task of newTasks) {
      // Skip duplicates based on fingerprint
      if (task.fileFingerprint && await this.repo!.exists(task.fileFingerprint)) {
        console.warn(`Task mit Fingerprint ${task.fileFingerprint} existiert bereits, übersprungen.`);
        continue;
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
