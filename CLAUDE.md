# LernBegleiter Pro

KI-gestützte Lernplattform für deutsche Grundschulkinder. Analysiert Schulbuchseiten via Google Gemini und generiert zweisprachige (DE/VI) Lösungen mit Schritt-für-Schritt-Anleitungen.

## Befehle

```bash
npm run dev      # Entwicklungsserver http://localhost:3000
npm run build    # Produktions-Build
npm run preview  # Build-Vorschau
```

## Umgebungsvariablen (.env)

```
VITE_GEMINI_API_KEY=<api_key>
VITE_GEMINI_MODEL=gemini-2.0-flash
VITE_GEMINI_AUDIO_MODEL=gemini-2.0-flash-audio
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
```

## Tech-Stack

- **Frontend:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4
- **KI:** Google Gemini (Bildanalyse + TTS)
- **Storage:** IndexedDB (Standard), SQLite WASM, Supabase (Cloud)
- **PDF:** html2canvas, jsPDF

## Architektur

```
App.tsx                      # Haupt-State-Management
├── components/
│   ├── Sidebar.tsx          # Navigation, Filter
│   ├── EditorialView.tsx    # Redaktions-Modus
│   ├── EditorialDashboard.tsx # Aufgaben-Verwaltung
│   ├── SolutionView.tsx     # Stage-Modus (Lernansicht)
│   ├── StudentGuide.tsx     # Kindgerechte Anleitung
│   └── ParentGuide.tsx      # Eltern-Hilfe (zweisprachig)
├── model/
│   └── TaskModel.ts         # Business-Logik, CRUD
├── services/
│   ├── geminiService.ts     # Gemini API (Analyse + Audio)
│   ├── geminiSchema.ts      # Response-Schema
│   └── repository/          # Storage-Abstraktion
│       ├── ITaskRepository.ts
│       ├── IndexedDBRepository.ts
│       └── SupabaseRepository.ts
└── hooks/
    ├── useFileProcessing.ts # Upload + Analyse
    └── useAudioStatus.ts    # Audio-Status
```

## Datenmodell

```typescript
interface TaskSolution {
  id: string;
  pageNumber: number;
  grade: string;              // "Klasse 2"
  subject: string;            // "Deutsch"
  subSubject: string;         // "Grammatik"
  taskTitle: string;
  taskDescription_de/vi: string;
  steps: Step[];              // Eltern-Hilfe Schritte
  solutionTable: TableRow[];  // Lösungstabelle
  finalSolution_de/vi: string;
  teacherSection: {
    learningGoal_de: string;
    studentSteps_de: string[];
    explanation_de: string;
    summary_de: string;
  };
  fileFingerprint?: string;   // Deduplizierung
  displayId?: string;         // z.B. "K2_DEU_1"
}
```

## Modi

- **Editorial:** Content-Management, Upload, PDF-Export
- **Stage:** Kindgerechte Lernansicht mit TTS

## Tests

```javascript
// Browser-Konsole auf localhost:3000
await TaskModelTests.runAll();
```

## Konventionen

- Zweisprachige Felder: `*_de` und `*_vi` Suffixe
- Deduplizierung via `fileFingerprint`
- Audio-Caching in IndexedDB
- Dark Mode via Tailwind `dark:` Klassen
