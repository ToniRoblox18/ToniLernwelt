/**
 * IndexedDB Implementation des Repository-Patterns
 * Erste und aktuelle Persistenz-Schicht für LernBegleiter Pro
 */

import { TaskSolution } from '../../types';
import type { ITaskRepository, FilterOptions } from './ITaskRepository';

const DB_NAME = 'LernBegleiter_Full_Storage';
const TASK_STORE = 'tasks';
const AUDIO_STORE = 'audio_buffers';
const VERSION = 3; // Bumped for new indexes

export class IndexedDBRepository implements ITaskRepository {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        if (this.db) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, VERSION);

            request.onupgradeneeded = (event) => {
                const db = request.result;

                // Tasks Store mit Indexes
                if (!db.objectStoreNames.contains(TASK_STORE)) {
                    const taskStore = db.createObjectStore(TASK_STORE, { keyPath: 'id' });
                    taskStore.createIndex('fingerprint', 'fileFingerprint', { unique: true });
                    taskStore.createIndex('grade', 'grade', { unique: false });
                    taskStore.createIndex('subject', 'subject', { unique: false });
                    taskStore.createIndex('timestamp', 'timestamp', { unique: false });
                } else {
                    // Upgrade existing store with new indexes
                    const tx = (event.target as IDBOpenDBRequest).transaction!;
                    const taskStore = tx.objectStore(TASK_STORE);

                    if (!taskStore.indexNames.contains('fingerprint')) {
                        taskStore.createIndex('fingerprint', 'fileFingerprint', { unique: true });
                    }
                    if (!taskStore.indexNames.contains('grade')) {
                        taskStore.createIndex('grade', 'grade', { unique: false });
                    }
                    if (!taskStore.indexNames.contains('subject')) {
                        taskStore.createIndex('subject', 'subject', { unique: false });
                    }
                    if (!taskStore.indexNames.contains('timestamp')) {
                        taskStore.createIndex('timestamp', 'timestamp', { unique: false });
                    }
                }

                // Audio Store
                if (!db.objectStoreNames.contains(AUDIO_STORE)) {
                    db.createObjectStore(AUDIO_STORE);
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }

    private async ensureDB(): Promise<IDBDatabase> {
        if (!this.db) await this.init();
        return this.db!;
    }

    async getAll(): Promise<TaskSolution[]> {
        const db = await this.ensureDB();
        return new Promise((resolve) => {
            const tx = db.transaction(TASK_STORE, 'readonly');
            const request = tx.objectStore(TASK_STORE).getAll();
            request.onsuccess = () => {
                const tasks = (request.result || []) as TaskSolution[];
                resolve(tasks.sort((a, b) => b.timestamp - a.timestamp));
            };
            request.onerror = () => resolve([]);
        });
    }

    async getById(id: string): Promise<TaskSolution | null> {
        const db = await this.ensureDB();
        return new Promise((resolve) => {
            const tx = db.transaction(TASK_STORE, 'readonly');
            const request = tx.objectStore(TASK_STORE).get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        });
    }

    async save(task: TaskSolution): Promise<void> {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(TASK_STORE, 'readwrite');
            tx.objectStore(TASK_STORE).put(task);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async saveBatch(tasks: TaskSolution[]): Promise<void> {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(TASK_STORE, 'readwrite');
            const store = tx.objectStore(TASK_STORE);

            for (const task of tasks) {
                store.put(task);
            }

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async delete(id: string): Promise<void> {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([TASK_STORE, AUDIO_STORE], 'readwrite');
            tx.objectStore(TASK_STORE).delete(id);
            tx.objectStore(AUDIO_STORE).delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async clearAll(onlyTestData: boolean = false): Promise<void> {
        const db = await this.ensureDB();

        if (onlyTestData) {
            const all = await this.getAll();
            const toDelete = all.filter(t => t.isTestData);
            if (toDelete.length === 0) return;

            return new Promise((resolve, reject) => {
                const tx = db.transaction([TASK_STORE, AUDIO_STORE], 'readwrite');
                const store = tx.objectStore(TASK_STORE);
                const audioStore = tx.objectStore(AUDIO_STORE);

                for (const t of toDelete) {
                    store.delete(t.id);
                    audioStore.delete(t.id);
                }

                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        }

        return new Promise((resolve, reject) => {
            const tx = db.transaction([TASK_STORE, AUDIO_STORE], 'readwrite');
            tx.objectStore(TASK_STORE).clear();
            tx.objectStore(AUDIO_STORE).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async findByFingerprint(fingerprint: string): Promise<TaskSolution | null> {
        const db = await this.ensureDB();
        return new Promise((resolve) => {
            const tx = db.transaction(TASK_STORE, 'readonly');
            const index = tx.objectStore(TASK_STORE).index('fingerprint');
            const request = index.get(fingerprint);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        });
    }

    async exists(fingerprint: string): Promise<boolean> {
        const task = await this.findByFingerprint(fingerprint);
        return task !== null;
    }

    async filterByHierarchy(options: FilterOptions): Promise<TaskSolution[]> {
        const all = await this.getAll();

        return all.filter(task => {
            if (options.grade && task.grade !== options.grade) return false;
            if (options.subject && task.subject !== options.subject) return false;
            if (options.subSubject && task.subSubject !== options.subSubject) return false;
            return true;
        });
    }

    async getUniqueGrades(): Promise<string[]> {
        const all = await this.getAll();
        return [...new Set(all.map(t => t.grade).filter(Boolean))].sort();
    }

    async getUniqueSubjects(grade?: string): Promise<string[]> {
        let tasks = await this.getAll();
        if (grade) {
            tasks = tasks.filter(t => t.grade === grade);
        }
        return [...new Set(tasks.map(t => t.subject).filter(Boolean))].sort();
    }

    async getUniqueSubSubjects(grade?: string, subject?: string): Promise<string[]> {
        let tasks = await this.getAll();
        if (grade) tasks = tasks.filter(t => t.grade === grade);
        if (subject) tasks = tasks.filter(t => t.subject === subject);
        return [...new Set(tasks.map(t => t.subSubject).filter(Boolean))].sort();
    }

    // Audio Operations
    async saveAudio(key: string, buffer: AudioBuffer): Promise<void> {
        const db = await this.ensureDB();
        const channelData = buffer.getChannelData(0);
        return new Promise((resolve, reject) => {
            const tx = db.transaction(AUDIO_STORE, 'readwrite');
            tx.objectStore(AUDIO_STORE).put(channelData, key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async getAudio(key: string, ctx: AudioContext): Promise<AudioBuffer | null> {
        const db = await this.ensureDB();
        return new Promise((resolve) => {
            const tx = db.transaction(AUDIO_STORE, 'readonly');
            const request = tx.objectStore(AUDIO_STORE).get(key);
            request.onsuccess = () => {
                const data = request.result as Float32Array;
                if (!data) return resolve(null);
                const buffer = ctx.createBuffer(1, data.length, 24000);
                buffer.getChannelData(0).set(data);
                resolve(buffer);
            };
            request.onerror = () => resolve(null);
        });
    }

    async deleteAudio(key: string): Promise<void> {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(AUDIO_STORE, 'readwrite');
            tx.objectStore(AUDIO_STORE).delete(key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
}
