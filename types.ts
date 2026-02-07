
export interface Step {
  title_de: string;
  title_vi: string;
  description_de: string;
  description_vi: string;
}

export interface TableRow {
  taskNumber: string;
  label_de: string;
  label_vi: string;
  value_de: string;
  value_vi: string;
}

export interface TeacherSection {
  learningGoal_de: string;
  studentSteps_de: string[];
  explanation_de: string;
  summary_de: string;
}

export interface TaskSolution {
  id: string;
  pageNumber: number;
  grade: string;       // Neu: Klasse (z.B. Klasse 2)
  subject: string;     // Neu: Fach (z.B. Deutsch)
  subSubject: string;  // Neu: Thema (z.B. Grammatik)
  taskTitle: string;
  taskDescription_de: string;
  taskDescription_vi: string;
  steps: Step[];
  solutionTable: TableRow[];
  finalSolution_de: string;
  finalSolution_vi: string;
  teacherSection: TeacherSection;
  imagePreview?: string;
  fileFingerprint?: string;
  displayId?: string; // e.g. K2_DEU_1
  timestamp: number;
  isTestData?: boolean; // Kennung für Test-Datensätze
}

export type Language = 'de' | 'vi';
export type AppMode = 'editorial' | 'stage';

export interface AppState {
  solutions: TaskSolution[];
  currentSolutionId: string | null;
  uiLanguage: Language;
  isProcessing: boolean;
  progress: number;
  darkMode: boolean;
  mode: AppMode;
  notification: { message: string; type: 'info' | 'error' | 'success' } | null;
  filters: {
    grade: string | null;
    subject: string | null;
  };
}
