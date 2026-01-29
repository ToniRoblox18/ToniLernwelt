-- =========================================================
-- ToniLernwelt SQLite Schema (Phase 2)
-- Version: 1.0.0
-- =========================================================

-- Haupttabelle: Aufgaben
-- Speichert alle Metadaten und Texte einer Aufgabe
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,                    -- Eindeutige ID (z.B. "task-1738112345-abc12")
    display_id TEXT,                        -- Kurz-ID für Anzeige (z.B. "K2_DEU_1")
    page_number INTEGER NOT NULL,           -- Seitennummer im Buch
    grade TEXT NOT NULL,                    -- Klasse (z.B. "Klasse 2")
    subject TEXT NOT NULL,                  -- Fach (z.B. "Deutsch")
    sub_subject TEXT,                       -- Thema (z.B. "Grammatik")
    task_title TEXT NOT NULL,               -- Titel der Aufgabe
    
    -- Beschreibungen (zweisprachig)
    task_description_de TEXT,
    task_description_vi TEXT,
    
    -- Endlösung (zweisprachig)
    final_solution_de TEXT,
    final_solution_vi TEXT,
    
    -- Lehrer-Bereich (1:1, daher flach in Haupttabelle)
    learning_goal_de TEXT,                  -- Lernziel
    explanation_de TEXT,                    -- Erklärung für Eltern
    summary_de TEXT,                        -- Zusammenfassung
    
    -- Metadaten
    file_fingerprint TEXT,                  -- Hash zur Duplikat-Erkennung
    timestamp INTEGER NOT NULL,             -- Erstellungszeit (Unix)
    image_preview TEXT,                     -- Base64-Vorschaubild
    is_test_data INTEGER DEFAULT 0,         -- Kennung für Testdaten (0=Nein, 1=Ja)
    
    -- Indizes für schnelle Filterung
    UNIQUE(file_fingerprint)
);

-- Lösungsschritte (1:n zu tasks)
-- Für den Schritt-für-Schritt-Bereich
CREATE TABLE IF NOT EXISTS task_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    position INTEGER NOT NULL,              -- Reihenfolge
    title_de TEXT,
    title_vi TEXT,
    description_de TEXT,
    description_vi TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Lösungstabelle (1:n zu tasks)
-- Für die strukturierte Ergebnistabelle
CREATE TABLE IF NOT EXISTS task_solution_rows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    position INTEGER NOT NULL,              -- Reihenfolge
    task_number TEXT,                       -- z.B. "1a", "2b"
    label_de TEXT,
    label_vi TEXT,
    value_de TEXT,
    value_vi TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Lehrer-Schüler-Schritte (1:n zu tasks)
-- studentSteps_de ist ein Array von Strings
CREATE TABLE IF NOT EXISTS teacher_student_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    position INTEGER NOT NULL,              -- Reihenfolge
    step_text TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- =========================================================
-- Indizes für Performance
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_tasks_grade ON tasks(grade);
CREATE INDEX IF NOT EXISTS idx_tasks_subject ON tasks(subject);
CREATE INDEX IF NOT EXISTS idx_tasks_fingerprint ON tasks(file_fingerprint);
CREATE INDEX IF NOT EXISTS idx_task_steps_task_id ON task_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_solution_rows_task_id ON task_solution_rows(task_id);
CREATE INDEX IF NOT EXISTS idx_teacher_steps_task_id ON teacher_student_steps(task_id);

-- =========================================================
-- Metadaten-Tabelle (für App-Einstellungen)
-- =========================================================
CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Schema-Version speichern
INSERT OR REPLACE INTO app_metadata (key, value) VALUES ('schema_version', '1.0.0');
