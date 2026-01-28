
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TaskSolution } from "../types";
import { AudioCacheService } from "./audioCache";

let aiInstance: GoogleGenAI | null = null;
const DEFAULT_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-3-flash-preview";
const AUDIO_MODEL = import.meta.env.VITE_GEMINI_AUDIO_MODEL || "gemini-2.5-flash-preview-tts";
function getAI() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error("GEMINI_API_KEY fehlt! Bitte trage deinen API-Key in die .env Datei ein.");
  }
  if (!apiKey.startsWith('AIza')) {
    throw new Error("Der API-Key in der .env scheint ungültig zu sein (er muss mit 'AIza' beginnen). Bitte prüfe den Key unter https://aistudio.google.com/apikey");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1beta'
    });
  }
  return aiInstance;
}

let sharedAudioCtx: AudioContext | null = null;
export function getSharedAudioContext() {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return sharedAudioCtx;
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    grade: { type: Type.STRING, description: "Die Klassenstufe, z.B. Klasse 2" },
    subject: { type: Type.STRING, description: "Das Schulfach, z.B. Deutsch" },
    subSubject: { type: Type.STRING, description: "Das Thema, z.B. Leseverständnis oder Grammatik" },
    taskTitle: { type: Type.STRING },
    taskDescription_de: { type: Type.STRING },
    taskDescription_vi: { type: Type.STRING },
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title_de: { type: Type.STRING }, title_vi: { type: Type.STRING },
          description_de: { type: Type.STRING }, description_vi: { type: Type.STRING },
        },
        required: ["title_de", "title_vi", "description_de", "description_vi"]
      }
    },
    solutionTable: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          taskNumber: { type: Type.STRING },
          label_de: { type: Type.STRING }, label_vi: { type: Type.STRING },
          value_de: { type: Type.STRING }, value_vi: { type: Type.STRING }
        },
        required: ["taskNumber", "label_de", "label_vi", "value_de", "value_vi"]
      }
    },
    finalSolution_de: { type: Type.STRING }, finalSolution_vi: { type: Type.STRING },
    teacherSection: {
      type: Type.OBJECT,
      properties: {
        learningGoal_de: { type: Type.STRING },
        studentSteps_de: { type: Type.ARRAY, items: { type: Type.STRING } },
        explanation_de: { type: Type.STRING },
        summary_de: { type: Type.STRING }
      },
      required: ["learningGoal_de", "studentSteps_de", "explanation_de", "summary_de"]
    }
  },
  required: ["grade", "subject", "subSubject", "taskTitle", "taskDescription_de", "taskDescription_vi", "steps", "solutionTable", "finalSolution_de", "finalSolution_vi", "teacherSection"]
};

export async function analyzeTaskImage(base64Data: string, pageNumber: number, mimeType: string = "image/jpeg"): Promise<TaskSolution> {
  const prompt = `Analysiere diese Buchseite. Bestimme Klasse, Fach und Thema. Erstelle Hilfen für Eltern (DE/VI) und Lehrerin-Erklärung (DE).
  WICHTIG: Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt, das dem Schema entspricht. Keine Erklärungen vor oder nach dem JSON.`;

  try {
    console.log(`Starte Analyse für Seite ${pageNumber} (${mimeType})...`);
    const result = await getAI().models.generateContent({
      model: DEFAULT_MODEL,
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    // In many SDK versions, result.text is a getter for the first candidate's text
    let text = result.text;

    // Fallback if structure is different
    if (!text && (result as any).response) {
      text = await (result as any).response.text();
    }

    if (!text) throw new Error("Keine Text-Antwort von Gemini erhalten.");

    // Clean text from markdown code blocks if present
    const cleanText = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();

    const data = JSON.parse(cleanText);
    console.log("Analyse erfolgreich:", data.taskTitle);

    return {
      ...data,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      pageNumber,
      timestamp: Date.now(),
      imagePreview: `data:${mimeType};base64,${base64Data}`
    };
  } catch (err: any) {
    console.error("Gemini Analyse Fehler Details:", err);
    throw new Error(err.message || "Unbekannter Fehler bei der KI-Analyse");
  }
}

export async function speakText(text: string, cacheKey: string): Promise<AudioBuffer> {
  const ctx = getSharedAudioContext();
  const cached = await AudioCacheService.get(cacheKey, ctx);
  if (cached) return cached;

  console.log(`Generiere Audio mit Modell ${AUDIO_MODEL} für: "${text.substring(0, 30)}..."`);

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: AUDIO_MODEL,
      contents: [{ parts: [{ text: `Lies bitte kurz vor: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }
          }
        }
      }
    });

    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64) {
      console.error("Gemini Antwort ohne Audio-Daten:", JSON.stringify(response, null, 2));
      throw new Error("Audio generation failed: No audio data in response");
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    buffer.getChannelData(0).set(Array.from(dataInt16).map(v => v / 32768.0));

    await AudioCacheService.set(cacheKey, buffer);
    return buffer;
  } catch (err: any) {
    console.error("Fehler bei Audio-Generierung:", err);
    throw err;
  }
}
