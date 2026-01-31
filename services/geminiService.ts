
import { GoogleGenAI } from "@google/genai";

// Função segura para obter a chave de API sem quebrar o código em produção
const getApiKey = () => {
  try {
    // Verifica se process e process.env existem antes de acessar
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Ambiente de execução não possui process.env");
  }
  return "";
};

const apiKey = getApiKey();
// Inicializa apenas se houver chave, caso contrário mantém null para evitar erros
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzeFile = async (fileName: string, mimeType: string, fileSize: number) => {
  if (!ai) {
    return "IA indisponível (Chave de API não configurada).";
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
    return "Análise temporariamente indisponível.";
  }
};
