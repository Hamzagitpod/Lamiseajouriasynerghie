import { GoogleGenerativeAI } from "@google/generative-ai";
import { Storage } from "@google-cloud/storage";
import * as pdf from "pdf-parse";

const storage = new Storage();

/**
 * Lit le PDF du Code du Travail depuis Cloud Storage et extrait le texte.
 */
async function readLaborCodeFromBucket(): Promise<string> {
  try {
    const bucketName = "synerhgie-labor-laws" ;
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
        `Tu es un assistant juridique expert du droit du travail guinéen.
        Tu dois répondre en t’appuyant avant tout sur le contenu du Code du Travail de Guinée (fourni dans le contexte ci-dessous).
        Si la question n’a pas de lien direct avec le travail, la loi, ou les droits du salarié, tu peux répondre brièvement
        en disant que ta spécialité concerne le droit du travail guinéen.
        Si la question est vague mais que tu peux la relier à une notion juridique (ex: congé, contrat, sécurité, employeur, etc.),
        tente de formuler une réponse utile basée sur le texte fourni.`
    }); // <-- fermeture correcte ici

    // Lecture du Code du Travail depuis ton bucket
    const codeText = await readLaborCodeFromBucket();

    // ✅ Ajoute ce log ici
    console.log("✅ Texte extrait du PDF chargé, longueur:", codeText.length);

    // Construction du prompt final
    const userPrompt = `
Contexte (extrait du Code du Travail de Guinée):
${codeText.slice(0, 15000)}

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
