/**
 * ToniLernwelt - SQLite Repository
 * ================================
 * Ersetzt IndexedDB durch SQLite-Wasm für robustere Datenhaltung.
 * Nutzt OPFS für persistenten Speicher im Browser.
 */

import sqlite3InitModule, { Sqlite3Static, Database } from '@sqlite.org/sqlite-wasm';
import { TaskSolution, Step, TableRow } from '../../types';

// Schema als String (wird beim ersten Start ausgeführt)
const SCHEMA_SQL = `
-- Haupttabelle: Aufgaben
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    display_id TEXT,
    page_number INTEGER NOT NULL,
    grade TEXT NOT NULL,
    subject TEXT NOT NULL,
    sub_subject TEXT,
    task_title TEXT NOT NULL,
    task_description_de TEXT,
    task_description_vi TEXT,
    final_solution_de TEXT,
    final_solution_vi TEXT,
    learning_goal_de TEXT,
    explanation_de TEXT,
    summary_de TEXT,
    file_fingerprint TEXT UNIQUE,
    timestamp INTEGER NOT NULL,
    image_preview TEXT,
    is_test_data INTEGER DEFAULT 0
);

-- Lösungsschritte
CREATE TABLE IF NOT EXISTS task_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    title_de TEXT,
    title_vi TEXT,
    description_de TEXT,
    description_vi TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Lösungstabelle
CREATE TABLE IF NOT EXISTS task_solution_rows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    task_number TEXT,
    label_de TEXT,
    label_vi TEXT,
    value_de TEXT,
    value_vi TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Lehrer-Schüler-Schritte
CREATE TABLE IF NOT EXISTS teacher_student_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    step_text TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_tasks_grade ON tasks(grade);
CREATE INDEX IF NOT EXISTS idx_tasks_subject ON tasks(subject);
CREATE INDEX IF NOT EXISTS idx_tasks_fingerprint ON tasks(file_fingerprint);

-- Metadaten
CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Audio Buffers Tabelle
CREATE TABLE IF NOT EXISTS audio_buffers (
    task_id TEXT PRIMARY KEY,
    buffer BLOB NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

INSERT OR REPLACE INTO app_metadata (key, value) VALUES ('schema_version', '1.1.0');
`;

let sqlite3: Sqlite3Static | null = null;
let db: Database | null = null;

/**
 * Initialisiert die SQLite-Datenbank.
 * Nutzt OPFS für persistenten Speicher.
 */
export async function initSQLite(): Promise<Database> {
    if (db) return db;

    console.log('[SQLite] Initialisiere SQLite-WASM...');

    // @ts-expect-error - sqlite3InitModule accepts config object at runtime
    sqlite3 = await sqlite3InitModule({
        print: console.log,
        printErr: console.error,
    });

    console.log(`[SQLite] Version: ${sqlite3.version.libVersion}`);

    // Versuche OPFS, FALL NICHT auf in-memory zurück sondern werfe Fehler 
    // damit der Factory-Fallback zu IndexedDB greifen kann
    if (sqlite3.oo1.OpfsDb) {
        console.log('[SQLite] Nutze OPFS für persistenten Speicher');
        try {
            db = new sqlite3.oo1.OpfsDb('toni-lernwelt-v3.sqlite3');
            console.log('[SQLite] Persistente Datenbank erfolgreich geöffnet');
        } catch (err) {
            console.error('[SQLite] Fehler beim Öffnen der OPFS-Datenbank:', err);
            throw new Error('OPFS_INIT_FAILED');
        }
    } else {
        throw new Error('OPFS_UNAVAILABLE');
    }

    // Schema anwenden
    db.exec(SCHEMA_SQL);

    // Performance & Robustheit
    db.exec(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA foreign_keys = ON;
    `);

    console.log('[SQLite] Schema initialisiert und Foreign Keys aktiviert');

    return db;
}

/**
 * SQLite Repository - implementiert das Repository Interface
 */
export class SQLiteRepository {
    private db: Database;

    constructor(database: Database) {
        this.db = database;
    }

    async init(): Promise<void> {
        // Bereits initialisiert via Constructor/getSQLiteRepository
    }

    /**
     * Alle Aufgaben laden
     */
    async getAll(): Promise<TaskSolution[]> {
        const rows = this.db.exec({
            sql: 'SELECT * FROM tasks ORDER BY timestamp DESC, id DESC',
            returnValue: 'resultRows',
            rowMode: 'object'
        }) as any[];

        const tasks: TaskSolution[] = [];

        for (const row of rows) {
            const task = await this.hydrateTask(row);
            tasks.push(task);
        }

        return tasks;
    }

    /**
     * Einzelne Aufgabe laden
     */
    async getById(id: string): Promise<TaskSolution | null> {
        const rows = this.db.exec({
            sql: 'SELECT * FROM tasks WHERE id = ?',
            bind: [id],
            returnValue: 'resultRows',
            rowMode: 'object'
        }) as any[];

        if (rows.length === 0) return null;
        return this.hydrateTask(rows[0]);
    }

    /**
     * Mehrere Aufgaben speichern
     */
    async saveBatch(tasks: TaskSolution[]): Promise<void> {
        for (const task of tasks) {
            await this.save(task);
        }
    }

    /**
     * Aufgabe speichern (INSERT oder UPDATE)
     */
    async save(task: TaskSolution): Promise<void> {
        // Hauptdaten speichern
        this.db.exec({
            sql: `INSERT OR REPLACE INTO tasks 
            (id, display_id, page_number, grade, subject, sub_subject, task_title,
             task_description_de, task_description_vi, final_solution_de, final_solution_vi,
             learning_goal_de, explanation_de, summary_de, file_fingerprint, timestamp, image_preview, is_test_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            bind: [
                task.id,
                task.displayId || null,
                task.pageNumber,
                task.grade,
                task.subject,
                task.subSubject || null,
                task.taskTitle,
                task.taskDescription_de || null,
                task.taskDescription_vi || null,
                task.finalSolution_de || null,
                task.finalSolution_vi || null,
                task.teacherSection?.learningGoal_de || null,
                task.teacherSection?.explanation_de || null,
                task.teacherSection?.summary_de || null,
                task.fileFingerprint || null,
                task.timestamp,
                task.imagePreview || null,
                task.isTestData ? 1 : 0
            ]
        });

        // Alte verknüpfte Daten löschen (Cascade delete fängt das meiste ab, aber zur Sicherheit)
        this.db.exec({ sql: 'DELETE FROM task_steps WHERE task_id = ?', bind: [task.id] });
        this.db.exec({ sql: 'DELETE FROM task_solution_rows WHERE task_id = ?', bind: [task.id] });
        this.db.exec({ sql: 'DELETE FROM teacher_student_steps WHERE task_id = ?', bind: [task.id] });

        // Steps speichern
        if (task.steps) {
            task.steps.forEach((step, idx) => {
                this.db.exec({
                    sql: `INSERT INTO task_steps (task_id, position, title_de, title_vi, description_de, description_vi)
                VALUES (?, ?, ?, ?, ?, ?)`,
                    bind: [task.id, idx, step.title_de, step.title_vi, step.description_de, step.description_vi]
                });
            });
        }

        // Solution rows speichern
        if (task.solutionTable) {
            task.solutionTable.forEach((row, idx) => {
                this.db.exec({
                    sql: `INSERT INTO task_solution_rows (task_id, position, task_number, label_de, label_vi, value_de, value_vi)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    bind: [task.id, idx, row.taskNumber, row.label_de, row.label_vi, row.value_de, row.value_vi]
                });
            });
        }

        // Teacher student steps speichern
        if (task.teacherSection?.studentSteps_de) {
            task.teacherSection.studentSteps_de.forEach((step, idx) => {
                this.db.exec({
                    sql: `INSERT INTO teacher_student_steps (task_id, position, step_text) VALUES (?, ?, ?)`,
                    bind: [task.id, idx, step]
                });
            });
        }
    }

    /**
     * Aufgabe löschen
     */
    async delete(id: string): Promise<void> {
        this.db.exec({ sql: 'DELETE FROM tasks WHERE id = ?', bind: [id] });
    }

    /**
     * Alle Aufgaben löschen. Wenn onlyTestData true ist, werden nur Simulationsdaten gelöscht.
     */
    async clearAll(onlyTestData: boolean = false): Promise<void> {
        console.log(`[SQLite] clearAll(onlyTestData=${onlyTestData}) aufgerufen.`);
        if (onlyTestData) {
            this.db.exec('DELETE FROM tasks WHERE is_test_data = 1');
            console.log('[SQLite] Nur Testdaten gelöscht');
        } else {
            this.db.exec('DELETE FROM tasks');
            console.log('[SQLite] Alle Aufgaben gelöscht');
        }
    }

    /**
     * Findet eine Aufgabe anhand des Fingerprints
     */
    async findByFingerprint(fingerprint: string): Promise<TaskSolution | null> {
        const rows = this.db.exec({
            sql: 'SELECT * FROM tasks WHERE file_fingerprint = ?',
            bind: [fingerprint],
            returnValue: 'resultRows',
            rowMode: 'object'
        }) as any[];

        if (rows.length === 0) return null;
        return this.hydrateTask(rows[0]);
    }

    /**
     * Prüft ob Fingerprint existiert
     */
    async exists(fingerprint: string): Promise<boolean> {
        const task = await this.findByFingerprint(fingerprint);
        return task !== null;
    }

    /**
     * Filtert Aufgaben nach Hierarchie
     */
    async filterByHierarchy(options: { grade?: string; subject?: string; subSubject?: string }): Promise<TaskSolution[]> {
        let sql = 'SELECT * FROM tasks WHERE 1=1';
        const params: any[] = [];

        if (options.grade) {
            sql += ' AND grade = ?';
            params.push(options.grade);
        }
        if (options.subject) {
            sql += ' AND subject = ?';
            params.push(options.subject);
        }
        if (options.subSubject) {
            sql += ' AND sub_subject = ?';
            params.push(options.subSubject);
        }

        sql += ' ORDER BY timestamp DESC';

        const rows = this.db.exec({
            sql,
            bind: params,
            returnValue: 'resultRows',
            rowMode: 'object'
        }) as any[];

        const tasks: TaskSolution[] = [];
        for (const row of rows) {
            tasks.push(await this.hydrateTask(row));
        }
        return tasks;
    }

    /**
     * Einzigartige Werte für Filter holen
     */
    async getUniqueGrades(): Promise<string[]> {
        const rows = this.db.exec({ sql: 'SELECT DISTINCT grade FROM tasks ORDER BY grade', returnValue: 'resultRows' });
        return rows.map(r => r[0] as string).filter(Boolean);
    }

    async getUniqueSubjects(grade?: string): Promise<string[]> {
        const sql = grade ? 'SELECT DISTINCT subject FROM tasks WHERE grade = ? ORDER BY subject' : 'SELECT DISTINCT subject FROM tasks ORDER BY subject';
        const rows = this.db.exec({ sql, bind: grade ? [grade] : [], returnValue: 'resultRows' });
        return rows.map(r => r[0] as string).filter(Boolean);
    }

    async getUniqueSubSubjects(grade?: string, subject?: string): Promise<string[]> {
        let sql = 'SELECT DISTINCT sub_subject FROM tasks WHERE 1=1';
        const params: any[] = [];
        if (grade) { sql += ' AND grade = ?'; params.push(grade); }
        if (subject) { sql += ' AND subject = ?'; params.push(subject); }
        sql += ' ORDER BY sub_subject';

        const rows = this.db.exec({ sql, bind: params, returnValue: 'resultRows' });
        return rows.map(r => r[0] as string).filter(Boolean);
    }

    // === Audio-Schnittstelle ===

    async saveAudio(taskId: string, buffer: AudioBuffer): Promise<void> {
        const channelData = buffer.getChannelData(0);
        // Float32Array in Uint8Array konvertieren (SQLite BLOB)
        const bytes = new Uint8Array(channelData.buffer);
        this.db.exec({
            sql: 'INSERT OR REPLACE INTO audio_buffers (task_id, buffer) VALUES (?, ?)',
            bind: [taskId, bytes]
        });
    }

    async getAudio(taskId: string, ctx: AudioContext): Promise<AudioBuffer | null> {
        const rows = this.db.exec({
            sql: 'SELECT buffer FROM audio_buffers WHERE task_id = ?',
            bind: [taskId],
            returnValue: 'resultRows'
        });

        if (rows.length === 0) return null;

        const bytes = rows[0][0] as Uint8Array;
        const floats = new Float32Array(bytes.buffer);
        const buffer = ctx.createBuffer(1, floats.length, 24000);
        buffer.getChannelData(0).set(floats);
        return buffer;
    }

    async deleteAudio(taskId: string): Promise<void> {
        this.db.exec({ sql: 'DELETE FROM audio_buffers WHERE task_id = ?', bind: [taskId] });
    }

    /**
     * Datenbank als Blob exportieren (für Backup)
     */
    async exportDatabase(): Promise<Uint8Array> {
        return (this.db as any).serialize();
    }

    /**
     * Lädt die verknüpften Daten zu einer Aufgabe
     */
    private async hydrateTask(row: any): Promise<TaskSolution> {
        // Steps laden
        const steps = this.db.exec({
            sql: 'SELECT * FROM task_steps WHERE task_id = ? ORDER BY position',
            bind: [row.id],
            returnValue: 'resultRows',
            rowMode: 'object'
        }) as any[];

        // Solution rows laden
        const solutionRows = this.db.exec({
            sql: 'SELECT * FROM task_solution_rows WHERE task_id = ? ORDER BY position',
            bind: [row.id],
            returnValue: 'resultRows',
            rowMode: 'object'
        }) as any[];

        // Teacher steps laden
        const teacherSteps = this.db.exec({
            sql: 'SELECT step_text FROM teacher_student_steps WHERE task_id = ? ORDER BY position',
            bind: [row.id],
            returnValue: 'resultRows',
            rowMode: 'array'
        }) as any[];

        return {
            id: row.id,
            displayId: row.display_id,
            pageNumber: row.page_number,
            grade: row.grade,
            subject: row.subject,
            subSubject: row.sub_subject,
            taskTitle: row.task_title,
            taskDescription_de: row.task_description_de,
            taskDescription_vi: row.task_description_vi,
            finalSolution_de: row.final_solution_de,
            finalSolution_vi: row.final_solution_vi,
            fileFingerprint: row.file_fingerprint,
            timestamp: row.timestamp,
            isTestData: row.is_test_data === 1,
            imagePreview: row.image_preview,
            steps: steps.map(s => ({
                title_de: s.title_de,
                title_vi: s.title_vi,
                description_de: s.description_de,
                description_vi: s.description_vi
            })) as Step[],
            solutionTable: solutionRows.map(r => ({
                taskNumber: r.task_number,
                label_de: r.label_de,
                label_vi: r.label_vi,
                value_de: r.value_de,
                value_vi: r.value_vi
            })) as TableRow[],
            teacherSection: {
                learningGoal_de: row.learning_goal_de || '',
                explanation_de: row.explanation_de || '',
                summary_de: row.summary_de || '',
                studentSteps_de: teacherSteps.map(s => s[0])
            }
        };
    }
}

// Singleton-Instanz
let repositoryInstance: SQLiteRepository | null = null;

/**
 * Gibt das SQLite-Repository zurück (lazy initialization)
 */
export async function getSQLiteRepository(): Promise<SQLiteRepository> {
    if (repositoryInstance) return repositoryInstance;

    const database = await initSQLite();
    repositoryInstance = new SQLiteRepository(database);
    return repositoryInstance;
}
