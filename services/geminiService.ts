
import { GoogleGenAI } from "@google/genai";

// Função ultra-segura para extrair a chave sem causar erro de referência
const safeGetApiKey = (): string => {
  try {
    return process?.env?.API_KEY || "";
  } catch {
    return "";
  }
};

const apiKey = safeGetApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzeFile = async (fileName: string, mimeType: string, fileSize: number) => {
  if (!ai) return "IA desativada (Sem chave configurada).";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise este arquivo: ${fileName} (${mimeType}). Resumo de 10 palavras sobre sua utilidade.`,
      config: {
        systemInstruction: "Você é um organizador de arquivos direto.",
        temperature: 0.1,
      },
    });

    return response.text || "Sem análise.";
  } catch (error) {
    console.error("Erro IA:", error);
    return "Análise indisponível no momento.";
  }
};
