-- ToniLernwelt - Supabase Schema
-- ===============================
-- Kopiere diesen Inhalt in den Supabase SQL Editor

-- 1. Tasks Tabelle
CREATE TABLE IF NOT EXISTS public.tasks (
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
    timestamp BIGINT NOT NULL,
    image_preview TEXT, -- URL zum Storage Bucket
    is_test_data BOOLEAN DEFAULT FALSE
);

-- 2. Lösungsschritte
CREATE TABLE IF NOT EXISTS public.task_steps (
    id BIGSERIAL PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    title_de TEXT,
    title_vi TEXT,
    description_de TEXT,
    description_vi TEXT
);

-- 3. Lösungstabellen
CREATE TABLE IF NOT EXISTS public.task_solution_rows (
    id BIGSERIAL PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    task_number TEXT,
    label_de TEXT,
    label_vi TEXT,
    value_de TEXT,
    value_vi TEXT
);

-- 4. Lehrer-Schüler-Schritte
CREATE TABLE IF NOT EXISTS public.teacher_student_steps (
    id BIGSERIAL PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    step_text TEXT NOT NULL
);

-- 5. RLS (Row Level Security) - Zunächst einfach für alle lesbar
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_solution_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_student_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.task_steps FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.task_solution_rows FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.teacher_student_steps FOR SELECT USING (true);

-- Für Schreibzugriff (in der Redaktion) - Hier sollte später Auth folgen
CREATE POLICY "Allow public insert" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON public.task_steps FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON public.task_solution_rows FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON public.teacher_student_steps FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete" ON public.tasks FOR DELETE USING (true);

-- 6. Storage Bucket für Medien
-- Manueller Schritt in Supabase: Erstelle einen public Bucket namens 'tasks-media'
