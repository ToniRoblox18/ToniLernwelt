# Datenbank-Migrations-Strategie: SQLite vs PostgreSQL

## 📊 Executive Summary

| Kriterium | SQLite | PostgreSQL |
|-----------|--------|------------|
| **Deployment** | ⭐⭐⭐⭐⭐ Zero-Config | ⭐⭐⭐ Server-Setup erforderlich |
| **Offline-Fähigkeit** | ⭐⭐⭐⭐⭐ Vollständig | ⭐⭐ Nur mit Sync-Layer |
| **Multi-User** | ⭐⭐ Begrenzt | ⭐⭐⭐⭐⭐ Native |
| **Skalierung** | ⭐⭐⭐ Einzelbenutzer | ⭐⭐⭐⭐⭐ Enterprise |
| **Cloud-Integration** | ⭐⭐⭐ Mit Turso/libSQL | ⭐⭐⭐⭐⭐ Native |
| **Kosten (Start)** | ⭐⭐⭐⭐⭐ Kostenlos | ⭐⭐⭐⭐ Free Tier verfügbar |

---

## 🎯 Empfehlung für LernBegleiter Pro

### **Phase 1-2 (MVP + Single-User): SQLite mit sql.js**

**Begründung:**
- Funktioniert direkt im Browser (WASM-basiert)
- Keine Backend-Infrastruktur nötig
- Perfekt für den aktuellen lokalen Anwendungsfall
- Einfache Migration von IndexedDB

### **Phase 3+ (Multi-User Cloud): PostgreSQL mit Supabase**

**Begründung:**
- Native Real-Time Sync für Multi-User
- Integrierte Auth (Google OAuth, Email/Passwort)
- Row-Level Security für `ownerId`
- Free Tier für Small Teams

---

## 📐 Vorgeschlagenes Schema

### Core Tables

```sql
-- Users (für Phase 3+)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    auth_provider VARCHAR(50), -- 'google' | 'email'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Hierarchie: Grades (Klassen)
CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- 'Klasse 1', 'Klasse 2', etc.
    display_order INT DEFAULT 0
);

-- Hierarchie: Subjects (Fächer)
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- 'Deutsch', 'Mathe', etc.
    icon VARCHAR(50), -- Optional: Lucide icon name
    color VARCHAR(7)  -- Optional: Hex color
);

-- Hierarchie: Sub-Subjects (Themen)
CREATE TABLE sub_subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE(name, subject_id)
);

-- Core: Tasks (Aufgaben)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Hierarchie (FK für Normalisierung)
    grade_id INT REFERENCES grades(id),
    subject_id INT REFERENCES subjects(id),
    sub_subject_id INT REFERENCES sub_subjects(id),
    
    -- Denormalisierte Strings (für Gemini-Output)
    grade_text VARCHAR(50),
    subject_text VARCHAR(100),
    sub_subject_text VARCHAR(200),
    
    -- Kerndaten
    page_number INT,
    task_title VARCHAR(500) NOT NULL,
    task_description_de TEXT,
    task_description_vi TEXT,
    final_solution_de TEXT,
    final_solution_vi TEXT,
    
    -- Strukturierte Daten (JSONB für Flexibilität)
    steps JSONB DEFAULT '[]',
    solution_table JSONB DEFAULT '[]',
    teacher_section JSONB,
    
    -- Medien
    image_preview TEXT, -- Base64 oder URL
    
    -- Metadaten
    file_fingerprint VARCHAR(64) UNIQUE,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audio Cache (separate für Performance)
CREATE TABLE audio_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    audio_data BYTEA NOT NULL, -- PCM Buffer
    sample_rate INT DEFAULT 24000,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes für Performance
CREATE INDEX idx_tasks_grade ON tasks(grade_id);
CREATE INDEX idx_tasks_subject ON tasks(subject_id);
CREATE INDEX idx_tasks_owner ON tasks(owner_id);
CREATE INDEX idx_tasks_fingerprint ON tasks(file_fingerprint);
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);
```

### Row-Level Security (PostgreSQL/Supabase)

```sql
-- Redaktionsmodus nur für Owner
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own tasks" ON tasks
    FOR ALL
    USING (owner_id = auth.uid() OR owner_id IS NULL);

CREATE POLICY "Everyone can view in Stage mode" ON tasks
    FOR SELECT
    USING (true);
```

---

## 🔄 Migrations-Strategie

### Schritt 1: Repository-Pattern einführen

```typescript
// services/repository/ITaskRepository.ts
export interface ITaskRepository {
  getAll(): Promise<TaskSolution[]>;
  getById(id: string): Promise<TaskSolution | null>;
  save(task: TaskSolution): Promise<void>;
  delete(id: string): Promise<void>;
  findByFingerprint(fp: string): Promise<TaskSolution | null>;
  filterByGradeAndSubject(grade?: string, subject?: string): Promise<TaskSolution[]>;
}

// services/repository/IndexedDBRepository.ts (aktuell)
export class IndexedDBRepository implements ITaskRepository { ... }

// services/repository/SQLiteRepository.ts (Phase 2)
export class SQLiteRepository implements ITaskRepository { ... }

// services/repository/SupabaseRepository.ts (Phase 3)
export class SupabaseRepository implements ITaskRepository { ... }
```

### Schritt 2: Dependency Injection

```typescript
// services/repository/index.ts
import { IndexedDBRepository } from './IndexedDBRepository';
import { SQLiteRepository } from './SQLiteRepository';
import { SupabaseRepository } from './SupabaseRepository';

type RepositoryType = 'indexeddb' | 'sqlite' | 'supabase';

export function createRepository(type: RepositoryType = 'indexeddb'): ITaskRepository {
  switch (type) {
    case 'sqlite':
      return new SQLiteRepository();
    case 'supabase':
      return new SupabaseRepository(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
    default:
      return new IndexedDBRepository();
  }
}
```

### Schritt 3: IndexedDB → SQLite Migration

```typescript
// utils/migrate.ts
export async function migrateIndexedDBToSQLite(): Promise<void> {
  const oldRepo = new IndexedDBRepository();
  const newRepo = new SQLiteRepository();
  
  const tasks = await oldRepo.getAll();
  for (const task of tasks) {
    await newRepo.save(task);
  }
  
  console.log(`Migrated ${tasks.length} tasks to SQLite`);
}
```

---

## 📦 Technologie-Stack pro Phase

### Phase 1: IndexedDB (Aktuell) ✅

```json
{
  "dependencies": {
    // Bereits vorhanden
  }
}
```

### Phase 2: SQLite (Browser)

```json
{
  "dependencies": {
    "sql.js": "^1.10.0",
    "@libsql/client": "^0.6.0"  // Option: Turso Cloud-Sync
  }
}
```

### Phase 3: PostgreSQL (Cloud)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0"
  }
}
```

---

## 🏗️ SQLite Browser-Implementation (sql.js)

```typescript
// services/repository/SQLiteRepository.ts
import initSqlJs, { Database } from 'sql.js';

export class SQLiteRepository implements ITaskRepository {
  private db: Database | null = null;
  
  async init(): Promise<void> {
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
    
    // Load from IndexedDB or create new
    const savedData = localStorage.getItem('lernbegleiter_db');
    if (savedData) {
      this.db = new SQL.Database(Uint8Array.from(atob(savedData), c => c.charCodeAt(0)));
    } else {
      this.db = new SQL.Database();
      this.createSchema();
    }
  }
  
  private createSchema(): void {
    this.db!.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        grade TEXT,
        subject TEXT,
        sub_subject TEXT,
        task_title TEXT,
        task_data TEXT, -- JSON für komplexe Felder
        file_fingerprint TEXT UNIQUE,
        created_at INTEGER
      )
    `);
  }
  
  persist(): void {
    const data = this.db!.export();
    const base64 = btoa(String.fromCharCode(...data));
    localStorage.setItem('lernbegleiter_db', base64);
  }
  
  // ... ITaskRepository implementations
}
```

---

## ⚖️ Detaillierter Vergleich

### SQLite Vorteile

| Vorteil | Impact für LernBegleiter |
|---------|-------------------------|
| **Zero Server** | Keine Hosting-Kosten für Phase 1-2 |
| **File-basiert** | Einfaches Backup/Export |
| **SQL-Ready** | Komplexe Filter (Grade + Subject + Date) |
| **Offline-first** | Funktioniert ohne Internet |
| **WASM** | Läuft im Browser via sql.js |

### SQLite Nachteile

| Nachteil | Mitigation |
|----------|-----------|
| **Single-Writer** | Für Einzelnutzer akzeptabel |
| **Kein Real-Time** | Polling oder Upgrade zu Turso |
| **Blob-Limits** | Audio separat in IndexedDB cachen |

### PostgreSQL Vorteile

| Vorteil | Impact für LernBegleiter |
|---------|-------------------------|
| **Multi-User** | Lehrer-Team Collaboration |
| **Real-Time** | Sofortige Sync über Geräte |
| **Full-Text-Search** | Aufgaben durchsuchen |
| **Supabase Auth** | OAuth/Email out-of-box |

### PostgreSQL Nachteile

| Nachteil | Mitigation |
|----------|-----------|
| **Server nötig** | Supabase Free Tier nutzen |
| **Latenz** | Caching-Layer einbauen |
| **Komplexer** | Schrittweise Migration |

---

## 🎬 Empfohlener Aktionsplan

### Woche 1-2: Vorbereitung

1. ✅ Repository-Interface definieren
2. ✅ IndexedDBRepository als erste Implementierung
3. ✅ Unit-Tests für Repository-Pattern

### Woche 3-4: SQLite Integration

1. sql.js installieren und initialisieren
2. SQLiteRepository implementieren
3. Migrations-Utility IndexedDB → SQLite
4. Filter-Funktionen (Grade + Subject)

### Woche 5-6: Cloud-Ready (Optional)

1. Supabase-Projekt erstellen
2. Schema in Supabase deployen
3. SupabaseRepository implementieren
4. Auth-Integration (Google OAuth)

---

## 📎 Referenzen

- [sql.js Dokumentation](https://sql.js.org/)
- [Turso (libSQL Cloud)](https://turso.tech/)
- [Supabase](https://supabase.com/)
- [IndexedDB → SQLite Pattern](https://example.com)
