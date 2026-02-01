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

    // Automatische Migration von Lokal zu Cloud wenn nötig
    if (this.repo.constructor.name === 'SupabaseRepository') {
      await this.migrateLocalToCloud();
    }

    const all = await this.repo.getAll();

    // Check for fingerprint duplicates in the database (Ghost-Check)
    const seenFp = new Set<string>();
    const unique = [];
    const duplicates = [];

    for (const t of all) {
      if (t.fileFingerprint && seenFp.has(t.fileFingerprint)) {
        duplicates.push(t);
      } else {
        if (t.fileFingerprint) seenFp.add(t.fileFingerprint);
        unique.push(t);
      }
    }

    if (duplicates.length > 0) {
      console.warn(`Gefundene Duplikate in der DB (${duplicates.length}), bereinige...`);
      for (const d of duplicates) {
        await this.repo.delete(d.id);
      }
    }

    this.tasks = unique;
    return this.tasks;
  }

  /**
   * Einmalige Migration von SQLite zu Supabase
   */
  private static async migrateLocalToCloud(): Promise<void> {
    if (localStorage.getItem('toni_migration_done') === 'true') return;

    try {
      const cloudRepo = this.repo!;
      const cloudTasks = await cloudRepo.getAll();

      // Wenn Cloud schon Daten hat, markieren wir es als erledigt
      if (cloudTasks.length > 0) {
        localStorage.setItem('toni_migration_done', 'true');
        return;
      }

      console.log('[Migration] Starte automatische Migration von SQLite zu Supabase...');

      // Lokales Repository explizit öffnen
      const localRepo = await getRepository('sqlite', true);
      const localTasks = await localRepo.getAll();

      if (localTasks.length === 0) {
        console.log('[Migration] Keine lokalen Daten zum Migrieren gefunden.');
        return;
      }

      console.log(`[Migration] Migriere ${localTasks.length} Aufgaben...`);

      for (const task of localTasks) {
        // 1. Task + Struktur
        await cloudRepo.save(task);

        // 2. Audio (falls vorhanden)
        // Hinweis: Wir nutzen einen Standard-AudioContext für den Download/Upload
        // Da wir hier im Browser sind, ist 'window.AudioContext' verfügbar.
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audio = await localRepo.getAudio(task.id, ctx);
        if (audio) {
          await cloudRepo.saveAudio(task.id, audio);
        }
        await ctx.close();

        console.log(`[Migration] Aufgabe '${task.taskTitle}' erfolgreich übertragen.`);
      }

      console.log('[Migration] Migration erfolgreich abgeschlossen.');
      localStorage.setItem('toni_migration_done', 'true');

      // Wir schalten zurück auf das Cloud-Repo für den weiteren Betrieb
      this.repo = cloudRepo;
    } catch (err) {
      console.error('[Migration] Kritischer Fehler während der Migration:', err);
    }
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

    let subjectCode = 'SON'; // Sonstiges
    for (const [key, val] of Object.entries(subjectMap)) {
      if (task.subject && task.subject.toLowerCase().includes(key.toLowerCase())) {
        subjectCode = val;
        break;
      }
    }

    // 3. Count (How many Kx_SUB exist?)
    const prefix = `${gradeCode}_${subjectCode}`;
    const existing = allTasks.filter(t => t.displayId && t.displayId.startsWith(prefix));

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
    const currentTasks = [...this.tasks];

    for (const task of newTasks) {
      // 1. Check current memory
      if (task.fileFingerprint && this.tasks.some(t => t.fileFingerprint === task.fileFingerprint)) {
        console.warn(`Task mit FP ${task.fileFingerprint} bereits im Speicher (Batch-Skip).`);
        continue;
      }

      // 2. Check repository
      if (task.fileFingerprint && await this.repo!.exists(task.fileFingerprint)) {
        console.warn(`Task mit FP ${task.fileFingerprint} existiert bereits in DB (Skip).`);
        continue;
      }

      // Generate ID if missing
      if (!task.displayId) {
        task.displayId = this.generateId(task, currentTasks);
        currentTasks.push(task);
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

    const taskToRemove = this.tasks.find(t => t.id === id);
    if (!taskToRemove) {
      console.warn(`removeTask: ID ${id} nicht gefunden.`);
      return this.tasks;
    }

    console.log(`Lösche Aufgabe: ${taskToRemove.taskTitle} (ID: ${id}, FP: ${taskToRemove.fileFingerprint})`);

    await this.repo!.delete(id);

    // Zusätzliche Sicherheit: Falls wir Dubletten haben, filtern wir nach ID
    // (In Zukunft könnten wir hier auch nach FP löschen, falls gewünscht)
    this.tasks = this.tasks.filter(t => t.id !== id);

    return this.tasks;
  }

  /**
   * Löscht Aufgaben. Wenn onlyTestData true ist, werden nur Simulationsdaten gelöscht.
   */
  static async clear(onlyTestData: boolean = false): Promise<TaskSolution[]> {
    console.log(`[TaskModel] clear(onlyTestData=${onlyTestData}) - Start. Cache-Size: ${this.tasks.length}`);
    if (!this.repo) await this.load();

    await this.repo!.clearAll(onlyTestData);

    // Cache radikal neu laden statt manuell zu filtern (verhindert Inkonsistenzen)
    const fresh = await this.repo!.getAll();
    this.tasks = fresh;

    console.log(`[TaskModel] clear - Fertig. Neue Cache-Size: ${this.tasks.length}`);
    return this.tasks;
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

  /**
   * Findet Aufgabe nach Fingerprint (Memory Check)
   */
  static getByFingerprint(fingerprint: string): TaskSolution | undefined {
    return this.tasks.find(t => t.fileFingerprint === fingerprint);
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
