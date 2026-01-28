
import { TaskSolution } from '../types';

const DB_NAME = 'LernBegleiter_Full_Storage';
const TASK_STORE = 'tasks';
const AUDIO_STORE = 'audio_buffers';
const VERSION = 2;

export class DBService {
  private static db: IDBDatabase | null = null;

  private static async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, VERSION);
      request.onupgradeneeded = (e: any) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(TASK_STORE)) {
          db.createObjectStore(TASK_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(AUDIO_STORE)) {
          db.createObjectStore(AUDIO_STORE);
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Task Operations
  static async saveTask(task: TaskSolution): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(TASK_STORE, 'readwrite');
    await tx.objectStore(TASK_STORE).put(task);
  }

  static async getAllTasks(): Promise<TaskSolution[]> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(TASK_STORE, 'readonly');
      const request = tx.objectStore(TASK_STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  static async deleteTask(id: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction([TASK_STORE, AUDIO_STORE], 'readwrite');
    tx.objectStore(TASK_STORE).delete(id);
    tx.objectStore(AUDIO_STORE).delete(id);
  }

  static async clearAll(): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction([TASK_STORE, AUDIO_STORE], 'readwrite');
    tx.objectStore(TASK_STORE).clear();
    tx.objectStore(AUDIO_STORE).clear();
  }

  // Audio Operations
  static async saveAudio(key: string, buffer: AudioBuffer): Promise<void> {
    const db = await this.getDB();
    const channelData = buffer.getChannelData(0);
    const tx = db.transaction(AUDIO_STORE, 'readwrite');
    tx.objectStore(AUDIO_STORE).put(channelData, key);
  }

  static async getAudio(key: string, ctx: AudioContext): Promise<AudioBuffer | null> {
    const db = await this.getDB();
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
}
