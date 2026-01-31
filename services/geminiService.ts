
import { GoogleGenAI } from "@google/genai";

// Proteção para evitar que o app quebre em produção (Netlify/GitHub Pages)
// onde o objeto 'process' pode não estar definido globalmente.
const getApiKey = () => {
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzeFile = async (fileName: string, mimeType: string, fileSize: number) => {
  if (!ai) {
    console.warn("Gemini API Key não configurada. IA desativada.");
    return "IA não configurada.";
  }

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

    return response.text || "Sem análise disponível.";
  } catch (error) {
    console.error("Erro ao analisar arquivo:", error);
    return "Análise indisponível.";
  }
};
