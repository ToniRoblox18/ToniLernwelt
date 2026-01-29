
import { TaskModel } from '../model/TaskModel';
import { resetRepository } from '../services/repository';
import { GeminiAnalysisService, GeminiAudioService } from '../services/geminiService';

export class BugReproductionTests {
    static async run(): Promise<void> {
        GeminiAnalysisService.isMockMode = true;
        GeminiAudioService.isMockMode = true;

        console.group("🐞 Bug Reproduction: Delete & Re-Upload");

        try {
            await this.reset();

            const fp7216 = "IMG_7216.jpg-1000-100-image/jpeg";
            const fp7217 = "IMG_7217.jpg-1000-100-image/jpeg";

            console.log("1. Upload IMG_7216 und IMG_7217");
            await TaskModel.addTasks([
                this.mockTask('t1', 'Aufgabe 7216', fp7216),
                this.mockTask('t2', 'Aufgabe 7217', fp7217)
            ]);

            if (TaskModel.getAll().length !== 2) throw new Error("Sollten 2 Tasks sein");
            console.log("-> OK, 2 Tasks vorhanden");

            console.log("2. Lösche IMG_7217 (t2)");
            await TaskModel.removeTask('t2');

            if (TaskModel.getAll().length !== 1) throw new Error(`Sollte nur noch 1 Task sein, aber es sind ${TaskModel.getAll().length}`);
            if (TaskModel.getByFingerprint(fp7217)) throw new Error("FP7217 sollte im Speicher NICHT mehr existieren");
            console.log("-> OK, t2 aus Speicher entfernt");

            // Simulieren was useFileProcessing macht
            console.log("3. Erneuter Check für FP7217 (wie vor Upload)");
            const existingBefore = TaskModel.getAll().find(s => s.fileFingerprint === fp7217);
            if (existingBefore) {
                throw new Error(`FEHLER: FP7217 wurde fälschlicherweise immer noch gefunden! (Task: ${existingBefore.taskTitle})`);
            }
            console.log("-> OK, FP7217 ist frei für Re-Upload");

            console.log("4. Führe Re-Upload von IMG_7217 durch");
            await TaskModel.addTasks([
                this.mockTask('t2-new', 'Aufgabe 7217 (Neu)', fp7217)
            ]);

            if (TaskModel.getAll().length !== 2) throw new Error("Nach Re-Upload sollten wieder 2 Tasks existieren");
            const reUploaded = TaskModel.getAll().find(s => s.fileFingerprint === fp7217);
            if (!reUploaded || reUploaded.id !== 't2-new') throw new Error("Re-Uploaded Task nicht korrekt im Speicher gefunden");

            console.log("-> OK, Re-Upload erfolgreich abgeschlossen");

            console.log("%c ✅ Alle Tests bestanden!", "color: green");
        } catch (e: any) {
            console.error("%c ❌ Test fehlgeschlagen!", "color: red", e.message || e);
        } finally {
            console.groupEnd();
        }
    }

    static async reset() {
        resetRepository();
        await TaskModel.clear();
    }

    static mockTask(id: string, title: string, fp: string) {
        return {
            id,
            taskTitle: title,
            grade: 'K1', subject: 'S1', subSubject: 'SS1',
            taskDescription_de: '', taskDescription_vi: '',
            steps: [], solutionTable: [],
            finalSolution_de: '', finalSolution_vi: '',
            teacherSection: { learningGoal_de: '', studentSteps_de: [], explanation_de: '', summary_de: '' },
            timestamp: Date.now(),
            fileFingerprint: fp,
            pageNumber: 1
        };
    }
}

if (typeof window !== 'undefined') {
    (window as any).BugReproductionTests = BugReproductionTests;
}
