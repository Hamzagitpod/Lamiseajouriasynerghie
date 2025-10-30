FROM node:20-alpine

WORKDIR /app

# Copie les manifestes et tsconfig (meilleur cache Docker)
COPY package*.json ./
COPY tsconfig.json ./

# Installe toutes les dépendances (y compris dev pour compiler TypeScript)
RUN npm install

# Copie le code source complet
COPY . .

# Compile TypeScript -> dist/
RUN npm run build

# Supprime les dépendances de dev pour alléger l'image
RUN npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/index.js"]
