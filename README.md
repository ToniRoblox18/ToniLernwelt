<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# LernBegleiter Pro - AI Educator Platform

Eine React-Anwendung (ESM), die Lehrmaterialien hierarchisch organisiert, per Gemini AI analysiert und interaktiv aufbereitet.

**Hierarchie-Pfad:** Jede Aufgabe ist verankert in: `Klasse (Grade) > Fach (Subject) > Thema (Sub-Subject)`

**Modi:** 
- 🖊️ **Redaktion** - Inhaltsverwaltung für Lehrer/Eltern
- 🎭 **Stage** - Kind-Interaktion mit TTS-Unterstützung

---

## 🚀 Quick Start

### Voraussetzungen
- **Node.js** ≥ 18.x
- **Gemini API Key** von [Google AI Studio](https://aistudio.google.com/)

### Installation & Start

```bash
# 1. Repository klonen
git clone <repository-url>
cd ToniLernwelt

# 2. Abhängigkeiten installieren
npm install

# 3. Environment-Variablen konfigurieren
# Erstelle eine .env Datei im Projektverzeichnis:
copy .env.example .env

# Öffne .env und trage deinen Gemini API-Key ein:
# GEMINI_API_KEY=dein_echter_api_key_hier

# 4. Entwicklungsserver starten
npm run dev
```

**Gemini API-Key erhalten:**
1. Besuche [Google AI Studio](https://aistudio.google.com/apikey)
2. Melde dich mit deinem Google-Konto an
3. Klicke auf "Create API Key"
4. Kopiere den Key und füge ihn in die `.env` Datei ein

Die App ist nun erreichbar unter: `http://localhost:3000`

### Tests ausführen

Öffne im Browser: `http://localhost:3000/test.html`

Oder in der Browser-Konsole der Haupt-App:
```javascript
import { TaskModelTests } from './tests/TaskModel.test.ts';
TaskModelTests.runAll();
```

### Production Build

```bash
# Build erstellen
npm run build

# Preview des Builds
npm run preview
```

---

## 📁 Projektstruktur

```
ToniLernwelt/
├── App.tsx                 # Haupt-App mit State-Management
├── types.ts                # TypeScript-Definitionen (TaskSolution, etc.)
├── components/
│   ├── Sidebar.tsx         # Navigation & Filter
│   ├── EditorialView.tsx   # Redaktionsmodus UI
│   ├── SolutionView.tsx    # Stage-Modus für Kinder
│   ├── UploadZone.tsx      # Drag & Drop Upload
│   └── ...
├── hooks/
│   ├── useFileProcessing.ts # Dateiverarbeitung + AI-Analyse
│   └── useAudioStatus.ts    # TTS Audio-Status
├── model/
│   └── TaskModel.ts        # Business-Logic & State
├── services/
│   ├── dbService.ts        # IndexedDB Persistenz
│   ├── geminiService.ts    # Gemini AI Integration
│   └── audioCache.ts       # Audio-Buffer Caching
└── tests/
    └── TaskModel.test.ts   # Mock-Test-Suite
```

---

## 🔧 Architektur

### MVC & Clean Code
- **View (Components):** React-Komponenten für UI
- **Model (TaskModel):** Business-Logik, Zustandsverwaltung
- **Data (Services):** Persistenz (IndexedDB), API-Aufrufe

### Daten-Modell

```typescript
interface TaskSolution {
  id: string;
  grade: string;       // Klasse (z.B. "Klasse 2")
  subject: string;     // Fach (z.B. "Deutsch")
  subSubject: string;  // Thema (z.B. "Leseverständnis")
  taskTitle: string;
  taskDescription_de: string;
  taskDescription_vi: string;
  steps: Step[];
  solutionTable: TableRow[];
  teacherSection: TeacherSection;
  fileFingerprint?: string;
  timestamp: number;
}
```

---

## 🧪 Tests ausführen

Die Mock-Test-Suite kann über die Browser-Konsole ausgeführt werden:

```javascript
import { TaskModelTests } from './tests/TaskModel.test.ts';
TaskModelTests.runAll();
```

---

## 🔮 Roadmap & Nächste Schritte

### Phase 1: Datenbank-Migration (Aktuell)
- [ ] Schema-Design für SQLite/PostgreSQL
- [ ] Repository-Pattern für DB-Abstraktion
- [ ] Migrations-Skripte

### Phase 2: Multi-User & Auth
- [ ] Google OAuth / Username-Passwort Login
- [ ] `ownerId` für Zugriffskontrolle im Redaktionsmodus
- [ ] Cloud-Synchronisation

### Phase 3: Enhanced Features
- [ ] Filter-Bar in Sidebar (Klasse/Fach)
- [ ] Bulk-Import/Export
- [ ] Fortschritts-Tracking für Schüler

---

## 📊 Datenbank-Migrations-Strategie

Siehe [docs/DATABASE_MIGRATION.md](docs/DATABASE_MIGRATION.md) für detaillierte Analyse von SQLite vs PostgreSQL.

---

## 🔗 Links

- **AI Studio App:** https://ai.studio/apps/drive/1PVTvdGl40tJQEyOs8ZUOHxN8KUZXJPNR
- **Gemini API Docs:** https://ai.google.dev/docs
