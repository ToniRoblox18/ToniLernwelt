/**
 * Supabase Repository
 * ===================
 * Cloud-Implementierung für ToniLernwelt.
 * Speichert Aufgaben in PostgreSQL und Medien in Supabase Storage.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Mp3Encoder } from '@breezystack/lamejs';
import { ITaskRepository, FilterOptions } from './ITaskRepository';
import { TaskSolution, Step, TableRow } from '../../types';

export class SupabaseRepository implements ITaskRepository {
    private client: SupabaseClient;
    private readonly BUCKET_NAME = 'tasks-media';

    constructor() {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!url || !key || url.includes('projekt-id')) {
            console.warn('[Supabase] Fehlende Zugangsdaten in .env - Repository wird nicht korrekt funktionieren.');
        }

        this.client = createClient(url, key);
    }

    async init(): Promise<void> {
        console.log('[Supabase] Initialisiert.');
    }

    private mapToLocal(task: any, steps: any[], solutions: any[], tsSteps: any[]): TaskSolution {
        return {
            id: task.id,
            pageNumber: task.page_number,
            grade: task.grade,
            subject: task.subject,
            subSubject: task.sub_subject,
            taskTitle: task.task_title,
            taskDescription_de: task.task_description_de,
            taskDescription_vi: task.task_description_vi,
            finalSolution_de: task.final_solution_de,
            finalSolution_vi: task.final_solution_vi,
            fileFingerprint: task.file_fingerprint,
            imagePreview: task.image_preview,
            displayId: task.display_id,
            timestamp: task.timestamp,
            isTestData: task.is_test_data,
            steps: steps?.map(s => ({
                title_de: s.title_de || '',
                title_vi: s.title_vi || '',
                description_de: s.description_de || '',
                description_vi: s.description_vi || ''
            })) || [],
            solutionTable: solutions?.map(r => ({
                taskNumber: r.task_number || '',
                label_de: r.label_de || '',
                label_vi: r.label_vi || '',
                value_de: r.value_de || '',
                value_vi: r.value_vi || ''
            })) || [],
            teacherSection: {
                learningGoal_de: task.learning_goal_de || '',
                explanation_de: task.explanation_de || '',
                summary_de: task.summary_de || '',
                studentSteps_de: tsSteps?.map(ts => ts.step_text) || []
            }
        };
    }

    async getAll(): Promise<TaskSolution[]> {
        const { data: tasks, error } = await this.client
            .from('tasks')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error || !tasks) return [];

        return await Promise.all(tasks.map(async (task) => {
            const [steps, solutions, ts] = await Promise.all([
                this.client.from('task_steps').select('*').eq('task_id', task.id).order('position'),
                this.client.from('task_solution_rows').select('*').eq('task_id', task.id).order('position'),
                this.client.from('teacher_student_steps').select('*').eq('task_id', task.id).order('position')
            ]);
            return this.mapToLocal(task, steps.data || [], solutions.data || [], ts.data || []);
        }));
    }

    async getById(id: string): Promise<TaskSolution | null> {
        const { data: task, error } = await this.client.from('tasks').select('*').eq('id', id).maybeSingle();
        if (error || !task) return null;

        const [steps, solutions, ts] = await Promise.all([
            this.client.from('task_steps').select('*').eq('task_id', id).order('position'),
            this.client.from('task_solution_rows').select('*').eq('task_id', id).order('position'),
            this.client.from('teacher_student_steps').select('*').eq('task_id', id).order('position')
        ]);

        return this.mapToLocal(task, steps.data || [], solutions.data || [], ts.data || []);
    }

    private async uploadImage(taskId: string, base64Data: string): Promise<string> {
        const parts = base64Data.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);

        const fileName = `previews/${taskId}.${mime.split('/')[1]}`;
        const { error } = await this.client.storage
            .from(this.BUCKET_NAME)
            .upload(fileName, u8arr, { contentType: mime, upsert: true });

        if (error) throw error;

        // Public URL generieren
        const { data } = this.client.storage.from(this.BUCKET_NAME).getPublicUrl(fileName);
        return data.publicUrl;
    }

    async save(solution: TaskSolution): Promise<void> {
        // Falls imagePreview ein Base64 ist, in Storage hochladen
        let finalImageUrl = solution.imagePreview;
        if (solution.imagePreview && solution.imagePreview.startsWith('data:image')) {
            try {
                finalImageUrl = await this.uploadImage(solution.id, solution.imagePreview);
            } catch (e) {
                console.error('[Supabase] Image Upload Fehler:', e);
            }
        }

        const taskData = {
            id: solution.id,
            display_id: solution.displayId,
            page_number: solution.pageNumber,
            grade: solution.grade,
            subject: solution.subject,
            sub_subject: solution.subSubject,
            task_title: solution.taskTitle,
            task_description_de: solution.taskDescription_de,
            task_description_vi: solution.taskDescription_vi,
            final_solution_de: solution.finalSolution_de,
            final_solution_vi: solution.finalSolution_vi,
            learning_goal_de: solution.teacherSection.learningGoal_de,
            explanation_de: solution.teacherSection.explanation_de,
            summary_de: solution.teacherSection.summary_de,
            file_fingerprint: solution.fileFingerprint,
            timestamp: solution.timestamp,
            image_preview: finalImageUrl,
            is_test_data: solution.isTestData || false
        };

        const { error: taskError } = await this.client.from('tasks').upsert(taskData);
        if (taskError) throw taskError;

        await Promise.all([
            this.client.from('task_steps').delete().eq('task_id', solution.id),
            this.client.from('task_solution_rows').delete().eq('task_id', solution.id),
            this.client.from('teacher_student_steps').delete().eq('task_id', solution.id)
        ]);

        if (solution.steps.length > 0) {
            await this.client.from('task_steps').insert(solution.steps.map((s, i) => ({
                task_id: solution.id, position: i, title_de: s.title_de, title_vi: s.title_vi, description_de: s.description_de, description_vi: s.description_vi
            })));
        }

        if (solution.solutionTable.length > 0) {
            await this.client.from('task_solution_rows').insert(solution.solutionTable.map((r, i) => ({
                task_id: solution.id, position: i, task_number: r.taskNumber, label_de: r.label_de, label_vi: r.label_vi, value_de: r.value_de, value_vi: r.value_vi
            })));
        }

        if (solution.teacherSection.studentSteps_de.length > 0) {
            await this.client.from('teacher_student_steps').insert(solution.teacherSection.studentSteps_de.map((text, i) => ({
                task_id: solution.id, position: i, step_text: text
            })));
        }
    }

    async saveBatch(tasks: TaskSolution[]): Promise<void> {
        for (const task of tasks) {
            await this.save(task);
        }
    }

    async delete(id: string): Promise<void> {
        await this.client.from('tasks').delete().eq('id', id);
        await this.deleteAudio(id);
    }

    async clearAll(onlyTestData: boolean = false): Promise<void> {
        if (onlyTestData) {
            await this.client.from('tasks').delete().eq('is_test_data', true);
        } else {
            const { data } = await this.client.from('tasks').select('id');
            if (data) {
                for (const row of data) {
                    await this.delete(row.id);
                }
            }
        }
    }

    async findByFingerprint(fingerprint: string): Promise<TaskSolution | null> {
        const { data, error } = await this.client.from('tasks').select('id').eq('file_fingerprint', fingerprint).maybeSingle();
        if (error || !data) return null;
        return this.getById(data.id);
    }

    async exists(fingerprint: string): Promise<boolean> {
        const { data } = await this.client.from('tasks').select('id').eq('file_fingerprint', fingerprint).maybeSingle();
        return !!data;
    }

    async filterByHierarchy(options: FilterOptions): Promise<TaskSolution[]> {
        let query = this.client.from('tasks').select('*');
        if (options.grade) query = query.eq('grade', options.grade);
        if (options.subject) query = query.eq('subject', options.subject);
        if (options.subSubject) query = query.eq('sub_subject', options.subSubject);

        const { data, error } = await query.order('timestamp', { ascending: false });
        if (error || !data) return [];

        return await Promise.all(data.map(t => this.getById(t.id))) as TaskSolution[];
    }

    async getUniqueGrades(): Promise<string[]> {
        const { data } = await this.client.from('tasks').select('grade');
        const grades = data?.map(d => d.grade) || [];
        return Array.from(new Set(grades)).sort();
    }

    async getUniqueSubjects(grade?: string): Promise<string[]> {
        let query = this.client.from('tasks').select('subject');
        if (grade) query = query.eq('grade', grade);
        const { data } = await query;
        const subjects = data?.map(d => d.subject) || [];
        return Array.from(new Set(subjects)).sort();
    }

    async getUniqueSubSubjects(grade?: string, subject?: string): Promise<string[]> {
        let query = this.client.from('tasks').select('sub_subject');
        if (grade) query = query.eq('grade', grade);
        if (subject) query = query.eq('subject', subject);
        const { data } = await query;
        const items = data?.map(d => d.sub_subject).filter(Boolean) || [];
        return Array.from(new Set(items)).sort();
    }

    async saveAudio(key: string, buffer: AudioBuffer): Promise<void> {
        const mp3Blob = await this.audioBufferToMp3(buffer);
        const filePath = `audio/${key}.mp3`;

        console.log(`[Supabase] Audio speichern (MP3): ${filePath} (${mp3Blob.size} bytes)`);

        const { error } = await this.client.storage
            .from(this.BUCKET_NAME)
            .upload(filePath, mp3Blob, { contentType: 'audio/mpeg', upsert: true });

        if (error) {
            console.error('[Supabase] Audio Save Fehler:', error.message);

            if (error.message.includes('Bucket not found') || error.message.includes('not found')) {
                console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  SUPABASE STORAGE BUCKET FEHLT!                                  ║
║                                                                  ║
║  1. Öffne: Supabase Dashboard → Storage                          ║
║  2. Klicke: "New Bucket"                                         ║
║  3. Name: tasks-media                                            ║
║  4. ✓ Public bucket                                              ║
║  5. Speichern + F5                                               ║
║                                                                  ║
║  WICHTIG: Storage Policies müssen auch gesetzt werden!           ║
║  → Bucket anklicken → Policies → New Policy                      ║
║  → "Allow public access for all operations" oder:                ║
║    INSERT/SELECT/UPDATE/DELETE für authenticated + anon          ║
╚══════════════════════════════════════════════════════════════════╝
                `);
            }

            // Nicht werfen - Audio bleibt im Memory-Cache
            return;
        }

        console.log(`[Supabase] Audio erfolgreich gespeichert: ${filePath}`);
    }

    async getAudio(key: string, ctx: AudioContext): Promise<AudioBuffer | null> {
        // Versuche zuerst MP3 (neues Format)
        const mp3Path = `audio/${key}.mp3`;
        console.log(`[Supabase] Audio laden: ${mp3Path}`);

        let { data, error } = await this.client.storage
            .from(this.BUCKET_NAME)
            .download(mp3Path);

        if (error || !data) {
            console.log(`[Supabase] Audio nicht gefunden: ${key}`);
            return null;
        }

        try {
            const arrayBuffer = await data.arrayBuffer();
            console.log(`[Supabase] Audio geladen: ${key} (${arrayBuffer.byteLength} bytes), decodiere...`);
            const buffer = await ctx.decodeAudioData(arrayBuffer);
            console.log(`[Supabase] Audio erfolgreich decodiert: ${key}`);
            return buffer;
        } catch (e: any) {
            console.error(`[Supabase] Audio Decode Fehler für ${key}:`, e?.message || e);
            return null;
        }
    }

    async deleteAudio(key: string): Promise<void> {
        await this.client.storage.from(this.BUCKET_NAME).remove([`audio/${key}.mp3`]);
    }

    async clearAllAudio(): Promise<void> {
        console.log('[Supabase] Lösche alle Audio-Dateien...');

        // Liste alle Dateien im audio/ Ordner
        const { data: files, error: listError } = await this.client.storage
            .from(this.BUCKET_NAME)
            .list('audio');

        if (listError) {
            console.error('[Supabase] Fehler beim Auflisten der Audio-Dateien:', listError.message);
            return;
        }

        if (!files || files.length === 0) {
            console.log('[Supabase] Keine Audio-Dateien gefunden');
            return;
        }

        // Lösche alle gefundenen Dateien
        const filePaths = files.map(f => `audio/${f.name}`);
        console.log(`[Supabase] Lösche ${filePaths.length} Audio-Dateien...`);

        const { error: deleteError } = await this.client.storage
            .from(this.BUCKET_NAME)
            .remove(filePaths);

        if (deleteError) {
            console.error('[Supabase] Fehler beim Löschen:', deleteError.message);
        } else {
            console.log(`[Supabase] ${filePaths.length} Audio-Dateien gelöscht`);
        }
    }

    /**
     * Konvertiert AudioBuffer zu MP3 (ca. 10x kleiner als WAV)
     * Verwendet lamejs für Browser-seitige Encodierung
     *
     * WICHTIG: Gemini generiert Mono-Audio mit 24kHz
     */
    private async audioBufferToMp3(buffer: AudioBuffer): Promise<Blob> {
        const channels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const kbps = 64; // 64kbps ist gut für Sprache

        console.log(`[MP3 Encoder] Start: ${channels} Kanäle, ${sampleRate}Hz, ${buffer.length} Samples`);

        // Hole Audiodaten als Float32
        const leftChannel = buffer.getChannelData(0);

        // Konvertiere Float32 (-1 bis 1) zu Int16 (-32768 bis 32767)
        const samples = new Int16Array(leftChannel.length);
        for (let i = 0; i < leftChannel.length; i++) {
            samples[i] = Math.max(-32768, Math.min(32767, Math.round(leftChannel[i] * 32767)));
        }

        // MP3 Encoder - IMMER Mono (1 Kanal) da Gemini Mono liefert
        const encoder = new Mp3Encoder(1, sampleRate, kbps);
        const mp3Data: Int8Array[] = [];

        // In Chunks encodieren
        const blockSize = 1152;
        for (let i = 0; i < samples.length; i += blockSize) {
            const chunk = samples.subarray(i, i + blockSize);
            // Für Mono: nur ein Array übergeben
            const mp3buf = encoder.encodeBuffer(chunk);
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
        }

        // Finalisieren
        const mp3End = encoder.flush();
        if (mp3End.length > 0) {
            mp3Data.push(mp3End);
        }

        const blob = new Blob(mp3Data, { type: 'audio/mpeg' });
        console.log(`[MP3 Encoder] Fertig: ${blob.size} bytes`);
        return blob;
    }
}
