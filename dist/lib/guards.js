export function enforceGuineaScope(query) {
    // Very lightweight guard: if user explicitly asks about another country, block.
    const forbidden = /(france|belgique|belgium|usa|canada|maroc|tunisie|sénégal|mali|ivory coast|côte d'ivoire|spain|italy|uk|germany)/i;
    if (forbidden.test(query)) {
        return {
            allowed: false,
            message: "Je ne peux répondre qu'au sujet du droit du travail en Guinée. Reformule ta question pour la Guinée, s'il te plaît."
        };
    }
    return { allowed: true };
}
export function buildSystemPrompt() {
    return [
        "Tu es un assistant juridique qui répond EXCLUSIVEMENT sur la Guinée (GN).",
        "Si la question n'est PAS liée à la Guinée, réponds : 'Je ne peux répondre qu'au sujet du droit du travail en Guinée.'",
        "Évite TOUT Markdown : renvoie du TEXTE BRUT (pas d'astérisques, dièses, backticks).",
        "Sois concis, précis, et cite les notions (articles, chapitres) quand pertinentes, sans formatage Markdown."
    ].join('\n');
}
