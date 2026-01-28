/**
 * Repository Interface für TaskSolution-Persistenz
 * Ermöglicht austauschbare Backend-Implementierungen (IndexedDB, SQLite, PostgreSQL)
 */

import { TaskSolution } from '../../types';

export interface FilterOptions {
    grade?: string;
    subject?: string;
    subSubject?: string;
}

export interface ITaskRepository {
    /**
     * Initialisiert die Datenbank-Verbindung
     */
    init(): Promise<void>;

    /**
     * Holt alle Aufgaben, sortiert nach Zeitstempel (neueste zuerst)
     */
    getAll(): Promise<TaskSolution[]>;

    /**
     * Holt eine einzelne Aufgabe nach ID
     */
    getById(id: string): Promise<TaskSolution | null>;

    /**
     * Speichert eine Aufgabe (Insert oder Update)
     */
    save(task: TaskSolution): Promise<void>;

    /**
     * Speichert mehrere Aufgaben in einer Transaktion
     */
    saveBatch(tasks: TaskSolution[]): Promise<void>;

    /**
     * Löscht eine Aufgabe und zugehörige Audio-Daten
     */
    delete(id: string): Promise<void>;

    /**
     * Löscht alle Aufgaben und Audio-Daten
     */
    clearAll(): Promise<void>;

    /**
     * Findet eine Aufgabe anhand des Datei-Fingerprints (für Deduplizierung)
     */
    findByFingerprint(fingerprint: string): Promise<TaskSolution | null>;

    /**
     * Prüft ob ein Fingerprint bereits existiert
     */
    exists(fingerprint: string): Promise<boolean>;

    /**
     * Filtert Aufgaben nach Hierarchie-Kriterien
     */
    filterByHierarchy(options: FilterOptions): Promise<TaskSolution[]>;

    /**
     * Holt alle einzigartigen Werte für Filter-Dropdowns
     */
    getUniqueGrades(): Promise<string[]>;
    getUniqueSubjects(grade?: string): Promise<string[]>;
    getUniqueSubSubjects(grade?: string, subject?: string): Promise<string[]>;

    // Audio Cache Operationen
    saveAudio(key: string, buffer: AudioBuffer): Promise<void>;
    getAudio(key: string, ctx: AudioContext): Promise<AudioBuffer | null>;
    deleteAudio(key: string): Promise<void>;
}
