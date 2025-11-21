import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, FilterType } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeImageStyle = async (base64Image: string): Promise<AnalysisResult> => {
  if (!apiKey) {
    console.warn("API Key not found");
    return {
      suggestedFilter: FilterType.KODAK_GOLD,
      reasoning: "Clave API no configurada. Se sugiere Kodak Gold por defecto.",
      caption: "Recuerdos dorados."
    };
  }

  try {
    const cleanBase64 = base64Image.split(',')[1];

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        suggestedFilter: {
          type: Type.STRING,
          enum: [FilterType.KODAK_GOLD, FilterType.FUJI_PRO_400H],
          description: "The best filter for this image.",
        },
        reasoning: {
          type: Type.STRING,
          description: "Short explanation in Spanish.",
        },
        caption: {
          type: Type.STRING,
          description: "Minimalist caption in Spanish.",
        },
      },
      required: ["suggestedFilter", "reasoning", "caption"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: `Eres un colorista de cine experto. Analiza la imagen y elige:
            1. KODAK GOLD 80: Para calidez, nostalgia, suavidad, pieles brillantes, atardeceres. Característica: Negros lavados (grisáceos) y desenfoque sutil.
            2. FUJIFILM PRO 400H: Para naturaleza, verdes profundos, luz de día, alto contraste nítido. Característica: Verdes azulados y sombras profundas.
            Responde JSON.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const result = JSON.parse(text) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Error analyzing image:", error);
    return {
      suggestedFilter: FilterType.KODAK_GOLD,
      reasoning: "Análisis no disponible.",
      caption: "Momento capturado."
    };
  }
};