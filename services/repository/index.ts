/**
 * Repository Factory
 * Zentrale Stelle für Dependency Injection der Datenbank-Implementierung
 */

import type { ITaskRepository } from './ITaskRepository';
import { IndexedDBRepository } from './IndexedDBRepository';
import { getSQLiteRepository } from '../database/sqliteRepository';

export type RepositoryType = 'indexeddb' | 'sqlite' | 'supabase';

// Singleton Instance für konsistenten Zustand
let repositoryInstance: ITaskRepository | null = null;
let currentType: RepositoryType | null = null;

/**
 * Erstellt oder gibt die aktuelle Repository-Instanz zurück
 * 
 * @param type - Der gewünschte Repository-Typ (default: 'sqlite')
 * @param forceNew - Erzwingt eine neue Instanz (für Tests/Migration)
 */
export async function getRepository(
    type: RepositoryType = 'sqlite',
    forceNew: boolean = false
): Promise<ITaskRepository> {

    // Wiederverwende existierende Instanz wenn möglich
    if (repositoryInstance && currentType === type && !forceNew) {
        return repositoryInstance;
    }

    // Erstelle neue Instanz basierend auf Typ
    switch (type) {
        case 'sqlite':
            try {
                repositoryInstance = await getSQLiteRepository() as unknown as ITaskRepository;
                console.log("[Repository] SQLite aktiv.");
            } catch (err) {
                console.warn("[Repository] SQLite (OPFS) nicht verfügbar. Nutze IndexedDB als Fallback für Persistenz.", err);
                repositoryInstance = new IndexedDBRepository();
                await repositoryInstance.init();
                console.log("[Repository] IndexedDB als Fallback aktiv.");
            }
            break;

        case 'supabase':
            // TODO: Phase 3 - Supabase Integration
            throw new Error('Supabase Repository not yet implemented. Coming in Phase 3.');

        case 'indexeddb':
        default:
            repositoryInstance = new IndexedDBRepository();
            await repositoryInstance.init();
            break;
    }

    currentType = type;
    return repositoryInstance;
}

/**
 * Setzt die Repository-Instanz zurück (für Tests)
 */
export function resetRepository(): void {
    repositoryInstance = null;
    currentType = null;
}

// Re-exports für einfachen Import
export type { ITaskRepository, FilterOptions } from './ITaskRepository';
export { IndexedDBRepository } from './IndexedDBRepository';
