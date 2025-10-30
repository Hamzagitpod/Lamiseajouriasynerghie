import { GoogleGenerativeAI } from "@google/generative-ai";
import { Storage } from "@google-cloud/storage";
import * as pdf from "pdf-parse";

const storage = new Storage();

/**
 * Lit le PDF du Code du Travail depuis Cloud Storage et extrait le texte.
 */
async function readLaborCodeFromBucket(): Promise<string> {
  try {
    const bucketName = "synerh-labor-laws";
    const fileName = "CODE DU TRAVAIL GUINEE.pdf";
    const file = storage.bucket(bucketName).file(fileName);

    const [buffer] = await file.download();
    const data = await (pdf as any)(buffer);
    console.log("✅ PDF du Code du Travail chargé depuis GCS.");
    return data.text;
  } catch (error) {
    console.error("❌ Erreur lors de la lecture du PDF depuis GCS:", error);
    return "";
  }
}

/**
 * Appelle l'API Gemini avec la question et le contexte issu du Code du Travail.
 */
export async function askGemini({
  apiKey,
  query,
  profile,
  systemPrompt,
  modelName = "gemini-2.5-pro",
}: {
  apiKey: string;
  query: string;
  profile?: string;
  systemPrompt?: string;
  modelName?: string;
}) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction:
        systemPrompt ||
        "Tu es un assistant juridique spécialisé dans le Code du Travail de Guinée. Réponds uniquement sur la base du texte officiel du Code du Travail guinéen.",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 8192,
      },
    });

    // Lecture du Code du Travail depuis ton bucket
    const codeText = await readLaborCodeFromBucket();

    // Construction du prompt final
    const userPrompt = `
Contexte (extrait du Code du Travail de Guinée):
${codeText.slice(0, 15000)}  // pour éviter la limite de tokens

Profil: ${profile || "non spécifié"}

Question: ${query}
`;

    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    if (!text) return "Aucune réponse textuelle n'a été générée.";
    return text;
  } catch (error) {
    console.error("❌ Erreur Gemini:", error);
    return "Erreur lors de la génération de la réponse.";
  }
}
