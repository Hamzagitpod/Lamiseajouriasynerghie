
import { GoogleGenerativeAI } from "@google/generative-ai";

export type AskOpts = {
  apiKey: string;
  modelName?: string;
  systemPrompt: string;
  context?: string;
  query: string;
  profile?: string;
};

export async function askGemini(opts: AskOpts): Promise<string> {
  const { apiKey, modelName = "gemini-1.5-pro", systemPrompt, context = "", query, profile } = opts;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const parts = [
    { text: systemPrompt },
    context ? { text: `Contexte de conversation (résumé des tours précédents):\n${context}` } : null,
    profile ? { text: `Profil utilisateur: ${profile}` } : null,
    { text: `Question: ${query}` }
  ].filter(Boolean) as Array<{text: string}>;

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.4,
      topP: 0.9,
      topK: 32,
      maxOutputTokens: 1024,
    },
    safetySettings: [
      // Keep defaults; can be customized
    ]
  });

  const resp = result.response;
  const text = resp.text?.() ?? "";
  return text;
}
