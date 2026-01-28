
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TaskSolution } from "../types";
import { AudioCacheService } from "./audioCache";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  const prompt = `Analysiere diese Buchseite. Bestimme Klasse, Fach und Thema. Erstelle Hilfen für Eltern (DE/VI) und Lehrerin-Erklärung (DE).`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { 
      parts: [
        { inlineData: { mimeType, data: base64Data } }, 
        { text: prompt }
      ] 
    },
    config: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA }
  });
  
  const data = JSON.parse(response.text);
  return { 
    ...data, 
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
    pageNumber, 
    timestamp: Date.now(),
    imagePreview: `data:${mimeType};base64,${base64Data}` 
  };
}

export async function speakText(text: string, cacheKey: string): Promise<AudioBuffer> {
  const ctx = getSharedAudioContext();
  const cached = await AudioCacheService.get(cacheKey, ctx);
  if (cached) return cached;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Sprich als freundliche Lehrerin: ${text}` }] }],
    config: { 
      responseModalities: [Modality.AUDIO], 
      speechConfig: { 
        voiceConfig: { 
          prebuiltVoiceConfig: { voiceName: 'Kore' } 
        } 
      } 
    }
  });

  const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64) throw new Error("Audio generation failed");
  
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  buffer.getChannelData(0).set(Array.from(dataInt16).map(v => v / 32768.0));
  
  await AudioCacheService.set(cacheKey, buffer);
  return buffer;
}
