
# Guinea Labor Law AI Backend (Cloud Run Ready)

Backend minimaliste, robuste et **sans erreurs** pour répondre aux questions **uniquement** sur la Guinée.
Conçu pour être poussé sur GitHub puis déployé sur **Cloud Run**. Le front pourra être déployé sur **Firebase Hosting** et communiquer avec `/api/ask`.

## Caractéristiques
- Node.js 20 + TypeScript
- Express + Helmet + CORS + Rate Limit
- Validation `zod`
- Logging `pino`
- Mémoire de conversation **par session** (LRU, 10 derniers tours)
- **Sanitisation** de la sortie en **texte brut** (pas de `*`, `#`, backticks)
- Garde-fou : refuse tout sujet hors **Guinée**
- Endpoints: `/healthz`, `/readyz`, `/api/version`, `/api/ask`

## Variables d'environnement (à définir plus tard)
- `API_KEY` : Clé Google AI Studio (Gemini)
- `MODEL_NAME` : (optionnel) ex: `gemini-1.5-pro`
- `ALLOWED_ORIGIN` : domaine front (ex: `https://votre-site.web.app`), par défaut `*` en dev
- `MEMORY_MAX_SESSIONS` : (optionnel) défaut 500
- `MEMORY_TURNS` : (optionnel) défaut 10

## Démarrage local
```bash
npm ci
npm run dev
# POST http://localhost:8080/api/ask { "query": "Quels sont les congés en Guinée ?", "sessionId": "abc123" }
```

## Build & Run prod
```bash
npm run serve
```

## Déploiement Cloud Run (exemple)
```bash
gcloud run deploy ia-plan-du-travail-synerhgie   --source .   --region europe-west1   --allow-unauthenticated   --set-env-vars=API_KEY=projects/..../secrets/API_KEY:latest,MODEL_NAME=gemini-1.5-pro
```

> Recommandé : stocker `API_KEY` dans **Secret Manager** et l'injecter à Cloud Run.

## Contrat d'usage
- Les réponses sont **exclusivement** basées sur le contexte guinéen.
- Si la question sort de ce cadre, l'API répond poliment qu'elle ne peut répondre qu'au sujet de la Guinée.
- Les réponses sont renvoyées en **texte brut** (pas de Markdown).
