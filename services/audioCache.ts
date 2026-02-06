/**
 * Audio Cache Service
 * ===================
 * Zweistufiges Caching:
 * 1. In-Memory Cache (sofort) - für schnellen Zugriff während der Session
 * 2. Persistenter Cache (Repository) - für langfristige Speicherung
 *
 * Browser-Konsole:
 *   await AudioCleanup.clearAll()  // Leert Memory + Persistent Cache
 */

import { TaskModel } from '../model/TaskModel';

// In-Memory LRU Cache für schnellen Zugriff
const memoryCache = new Map<string, AudioBuffer>();
const MAX_MEMORY_CACHE_SIZE = 50; // Max 50 Audio-Buffers im RAM

export class AudioCacheService {
  /**
   * Speichert Audio-Buffer (Memory + Persistent)
   */
  static async set(key: string, buffer: AudioBuffer): Promise<void> {
    // 1. In-Memory Cache (sofort verfügbar)
    this.setMemory(key, buffer);
    console.log(`[AudioCache] Memory gespeichert: ${key}`);

    // 2. Persistent Cache (für nächste Session)
    try {
      await TaskModel.saveAudio(key, buffer);
      console.log(`[AudioCache] Persistent gespeichert: ${key}`);
    } catch (err: any) {
      // Nur warnen, nicht werfen - Audio ist im Memory-Cache und funktioniert in der aktuellen Session
      console.warn(`[AudioCache] Persistent-Speicherung fehlgeschlagen für ${key}:`, err?.message || err);
      console.warn('[AudioCache] Audio ist nur im Memory-Cache verfügbar (geht bei F5 verloren)');
    }
  }

  /**
   * Lädt Audio-Buffer (Memory-First, dann Persistent)
   */
  static async get(key: string, ctx: AudioContext): Promise<AudioBuffer | null> {
    console.log(`[AudioCache] Suche nach: ${key}`);

    // 1. Memory Cache prüfen (sofort)
    const memCached = memoryCache.get(key);
    if (memCached) {
      console.log(`[AudioCache] Memory-Hit: ${key}`);
      return memCached;
    }
    console.log(`[AudioCache] Nicht im Memory, prüfe Persistent...`);

    // 2. Persistent Cache prüfen
    try {
      const persisted = await TaskModel.getAudio(key, ctx);
      if (persisted) {
        // In Memory Cache laden für nächsten Zugriff
        this.setMemory(key, persisted);
        console.log(`[AudioCache] Persistent-Hit: ${key} (→ Memory geladen)`);
        return persisted;
      }
      console.log(`[AudioCache] Nicht im Persistent Cache: ${key}`);
    } catch (err: any) {
      console.warn(`[AudioCache] Persistent-Lesen fehlgeschlagen für ${key}:`, err?.message || err);
    }

    console.log(`[AudioCache] Miss: ${key}`);
    return null;
  }

  /**
   * Prüft ob Audio gecacht ist (ohne zu laden)
   */
  static hasInMemory(key: string): boolean {
    return memoryCache.has(key);
  }

  /**
   * Löscht Audio aus beiden Caches
   */
  static async remove(key: string): Promise<void> {
    memoryCache.delete(key);
    // Persistent delete wird über TaskModel.removeTask() erledigt
  }

  /**
   * Leert den Memory-Cache (z.B. bei Speicherdruck)
   */
  static clearMemory(): void {
    memoryCache.clear();
    console.log('[AudioCache] Memory-Cache geleert');
  }

  /**
   * Leert ALLE Audio-Caches (Memory + Persistent)
   * Für komplette Bereinigung/Reset
   */
  static async clearAll(): Promise<void> {
    // 1. Memory Cache leeren
    this.clearMemory();

    // 2. Persistent Cache leeren
    try {
      await TaskModel.clearAllAudio();
      console.log('[AudioCache] Alle Caches geleert (Memory + Persistent)');
    } catch (err: any) {
      console.error('[AudioCache] Fehler beim Leeren des persistenten Cache:', err?.message || err);
    }
  }

  /**
   * Gibt Cache-Statistiken zurück
   */
  static getStats(): { memorySize: number; maxSize: number } {
    return {
      memorySize: memoryCache.size,
      maxSize: MAX_MEMORY_CACHE_SIZE
    };
  }

  /**
   * Interner Helper: Speichert in Memory mit LRU-Eviction
   */
  private static setMemory(key: string, buffer: AudioBuffer): void {
    // LRU: Wenn voll, ältesten Eintrag entfernen
    if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE) {
      const oldestKey = memoryCache.keys().next().value;
      if (oldestKey) {
        memoryCache.delete(oldestKey);
        console.log(`[AudioCache] LRU-Eviction: ${oldestKey}`);
      }
    }

    // Wenn Key schon existiert, entfernen (für LRU-Refresh)
    memoryCache.delete(key);
    memoryCache.set(key, buffer);
  }

  /**
   * Preload: Lädt Audio für mehrere Keys vorab in Memory
   */
  static async preload(keys: string[], ctx: AudioContext): Promise<number> {
    let loaded = 0;
    for (const key of keys) {
      if (!memoryCache.has(key)) {
        const buffer = await this.get(key, ctx);
        if (buffer) loaded++;
      }
    }
    console.log(`[AudioCache] Preload: ${loaded}/${keys.length} geladen`);
    return loaded;
  }
}

// Export für Browser-Konsole
if (typeof window !== 'undefined') {
  (window as any).AudioCleanup = {
    clearAll: () => AudioCacheService.clearAll(),
    clearMemory: () => AudioCacheService.clearMemory(),
    getStats: () => AudioCacheService.getStats()
  };
}
