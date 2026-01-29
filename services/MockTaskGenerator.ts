import { TaskSolution } from '../types';

export class MockTaskGenerator {
    private static subjects = [
        { name: 'Mathematik', topics: ['Addition', 'Subtraktion', 'Geometrie', 'Maßeinheiten'] },
        { name: 'Deutsch', topics: ['Grammatik', 'Rechtschreibung', 'Leseverständnis', 'Aufsatz'] },
        { name: 'Sachunterricht', topics: ['Natur', 'Heimatkunde', 'Vekehrserziehung', 'Tiere'] }
    ];

    static generateTasks(count: number): TaskSolution[] {
        const tasks: TaskSolution[] = [];
        const now = Date.now();

        for (let i = 0; i < count; i++) {
            const subjectIdx = Math.floor(Math.random() * this.subjects.length);
            const subject = this.subjects[subjectIdx];
            const topic = subject.topics[Math.floor(Math.random() * subject.topics.length)];
            const id = `mock-${now}-${i}-${Math.random().toString(36).substr(2, 5)}`;

            tasks.push({
                id,
                isTestData: true,
                timestamp: now,
                pageNumber: Math.floor(Math.random() * 100) + 1,
                grade: 'Klasse 2',
                subject: subject.name,
                subSubject: topic,
                taskTitle: `Simulierte ${subject.name} Aufgabe #${i + 1}`,
                taskDescription_de: `Dies ist eine automatisch generierte Test-Aufgabe zum Thema ${topic}.`,
                taskDescription_vi: `Đây là một bài tập kiểm tra được tạo tự động về chủ đề ${topic}.`,
                finalSolution_de: 'Das ist die simulierte Lösung der Aufgabe.',
                finalSolution_vi: 'Đây ist lời giải mô phỏng của bài tập.',
                fileFingerprint: `fp-mock-${id}`,
                steps: [
                    {
                        title_de: 'Schritt 1: Vorbereitung',
                        title_vi: 'Bước 1: Chuẩn bị',
                        description_de: 'Lies dir die Aufgabe genau durch.',
                        description_vi: 'Hãy đọc kỹ bài tập.'
                    },
                    {
                        title_de: 'Schritt 2: Durchführung',
                        title_vi: 'Bước 2: Thực hiện',
                        description_de: 'Berechne das Ergebnis im Kopf.',
                        description_vi: 'Hãy tính kết quả trong đầu.'
                    }
                ],
                solutionTable: [
                    { taskNumber: '1', label_de: 'Ergebnis', label_vi: 'Kết quả', value_de: '42', value_vi: '42' }
                ],
                teacherSection: {
                    learningGoal_de: `Die Kinder sollen Sicherheit im Bereich ${topic} gewinnen.`,
                    explanation_de: 'Nutzen Sie zur Veranschaulichung Rechenstäbchen oder andere Hilfsmittel.',
                    summary_de: 'Eine typische Übung für diese Klassenstufe.',
                    studentSteps_de: [
                        'Die Aufgabe laut vorlesen.',
                        'Bekannte Werte markieren.',
                        'Lösungsweg skizzieren.'
                    ]
                },
                imagePreview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzY0NzQ4YiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2ltdWxhdGlvbi1CaWxkPC90ZXh0Pjwvc3ZnPg=='
            });
        }

        return tasks;
    }
}
