
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client using the environment variable as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFile = async (fileName: string, mimeType: string, fileSize: number) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise este arquivo e forneça um resumo curto (máximo 15 palavras) sobre o que ele provavelmente é ou para que serve baseado no nome e tipo. 
      Arquivo: ${fileName}
      Tipo: ${mimeType}
      Tamanho: ${(fileSize / 1024).toFixed(2)} KB`,
      config: {
        systemInstruction: "Você é um assistente de organização de arquivos eficiente e direto.",
        temperature: 0.2,
      },
    });

    // Access the .text property directly as per the latest SDK guidelines.
    return response.text || "Sem análise disponível.";
  } catch (error) {
    console.error("Erro ao analisar arquivo:", error);
    return "Análise indisponível.";
  }
};
