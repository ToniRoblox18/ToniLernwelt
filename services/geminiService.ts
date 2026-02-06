
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TaskSolution } from "../types";
import { AudioCacheService } from "./audioCache";

let aiInstance: GoogleGenAI | null = null;

// Removed fallbacks as requested
export const DEFAULT_MODEL = import.meta.env.VITE_GEMINI_MODEL;
export const AUDIO_MODEL = import.meta.env.VITE_GEMINI_AUDIO_MODEL;

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
export function getSharedAudioContext(): AudioContext {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  // Resume falls suspended (nach Browser-Policy)
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(e => console.warn('[AudioContext] Resume fehlgeschlagen:', e));
  }
  return sharedAudioCtx;
}

// Helper for Gemini SDK calls with retry logic for 429 quota errors
async function callGeminiWithRetry<T>(call: () => Promise<any>, maxRetries = 3): Promise<any> {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await call();
    } catch (err: any) {
      // Check for 429 error (Quota)
      // The SDK error object often has a status or message
      const isQuotaError =
        err.status === 429 ||
        (err.message && err.message.toLowerCase().includes("quota")) ||
        (err.message && err.message.includes("429"));

      if (isQuotaError && retries < maxRetries - 1) {
        retries++;
        // Attempt to extract wait time or use user's suggested 20s
        // SDK might not expose headers directly easily, so we use a robust fallback
        const waitTime = 20000 * retries; // Exponential or fixed 20s base
        console.warn(`[Gemini] Quota erreicht (429). Versuch ${retries}/${maxRetries}. Warte ${waitTime / 1000}s...`);
        await new Promise(r => setTimeout(r, waitTime));
        continue;
      }
      throw err;
    }
  }
}

// Schema imported from shared definition
import { RESPONSE_SCHEMA } from "./geminiSchema";

export class GeminiAnalysisService {
  public static isMockMode = false;

  static async analyzeTaskImage(base64Data: string, pageNumber: number, mimeType: string = "image/jpeg"): Promise<TaskSolution> {
    if (this.isMockMode) {
      console.log("GeminiAnalysisService: MOCK MODE ACTIVE");
      return {
        id: `mock-${Date.now()}`,
        pageNumber,
        grade: 'Klasse 2',
        subject: 'Mathematik',
        subSubject: 'Test',
        taskTitle: 'Mock Aufgabe',
        taskDescription_de: 'Berschreibung',
        taskDescription_vi: 'Descriptive',
        steps: [],
        solutionTable: [{ taskNumber: '1', label_de: 'A', label_vi: 'B', value_de: '1', value_vi: '1' }],
        finalSolution_de: 'Lösung',
        finalSolution_vi: 'Solution',
        teacherSection: { learningGoal_de: 'Test', studentSteps_de: [], explanation_de: 'Test', summary_de: 'Test' },
        timestamp: Date.now(),
        imagePreview: `data:${mimeType};base64,${base64Data}`
      };
    }

    const prompt = `Analysiere diese Buchseite extrem gründlich. Dein Ziel ist es, KEINE Aufgabe zu übersehen.
    1. Scanne die Seite von oben nach unten und links nach rechts.
    2. Identifiziere JEDE Aufgabe, die durch eine Nummer (1, 2, 3...), einen Buchstaben (a, b, c...) oder ein Symbol gekennzeichnet ist. Achte besonders auf Aufgaben am Seitenrand, in Fußnoten oder in separaten Kästen.
    3. Bestimme Klasse, Fach und Thema. (HINWEIS: Bei Unsicherheit, nutze Bereiche wie "Klasse 2/3").
    4. Fülle die 'solutionTable' für JEDE einzelne Teilaufgabe aus. Wenn eine Aufgabe 1a, 1b, 1c hat, müssen 1a, 1b und 1c als separate Einträge in der Tabelle erscheinen.
    5. Erstelle umfassende Hilfen für Eltern und Lehrer, die sich auf ALLE gefundenen Aufgaben beziehen.
    
    WICHTIG: Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt gemäß Schema.`;

    try {
      console.log(`Starte Analyse für Seite ${pageNumber} (${mimeType})...`);
      const result = await callGeminiWithRetry(() => getAI().models.generateContent({
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
      }));

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
}

export class GeminiAudioService {
  public static isMockMode = false;

  static async speakText(text: string, cacheKey: string): Promise<AudioBuffer> {
    const ctx = getSharedAudioContext();
    const cached = await AudioCacheService.get(cacheKey, ctx);
    if (cached) return cached;

    if (this.isMockMode) {
      console.log("GeminiAudioService: MOCK MODE ACTIVE");
      const buffer = ctx.createBuffer(1, 24000, 24000); // 1s silence
      await AudioCacheService.set(cacheKey, buffer);
      return buffer;
    }

    console.log(`Generiere Audio mit Modell ${AUDIO_MODEL} für: "${text.substring(0, 30)}..."`);

    try {
      const ai = getAI();
      const response = await callGeminiWithRetry(() => ai.models.generateContent({
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
      }));

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
}
