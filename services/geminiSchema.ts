import { Type } from "@google/genai";

export const RESPONSE_SCHEMA = {
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
