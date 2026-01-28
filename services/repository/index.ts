/**
 * Repository Factory
 * Zentrale Stelle für Dependency Injection der Datenbank-Implementierung
 */

import type { ITaskRepository } from './ITaskRepository';
import { IndexedDBRepository } from './IndexedDBRepository';

export type RepositoryType = 'indexeddb' | 'sqlite' | 'supabase';

// Singleton Instance für konsistenten Zustand
let repositoryInstance: ITaskRepository | null = null;
let currentType: RepositoryType | null = null;

/**
 * Erstellt oder gibt die aktuelle Repository-Instanz zurück
 * 
 * @param type - Der gewünschte Repository-Typ (default: 'indexeddb')
 * @param forceNew - Erzwingt eine neue Instanz (für Tests/Migration)
 */
export async function getRepository(
    type: RepositoryType = 'indexeddb',
    forceNew: boolean = false
): Promise<ITaskRepository> {

    // Wiederverwende existierende Instanz wenn möglich
    if (repositoryInstance && currentType === type && !forceNew) {
        return repositoryInstance;
    }

    // Erstelle neue Instanz basierend auf Typ
    switch (type) {
        case 'sqlite':
            // TODO: Phase 2 - sql.js Integration
            throw new Error('SQLite Repository not yet implemented. Coming in Phase 2.');

        case 'supabase':
            // TODO: Phase 3 - Supabase Integration
            throw new Error('Supabase Repository not yet implemented. Coming in Phase 3.');

        case 'indexeddb':
        default:
            repositoryInstance = new IndexedDBRepository();
            break;
    }

    currentType = type;
    await repositoryInstance.init();
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
