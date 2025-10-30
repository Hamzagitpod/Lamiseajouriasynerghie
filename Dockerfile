
# Use Node.js 20 LTS (Cloud Run supported)
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies separately for better caching
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy compiled files (build expected before image build in Cloud Build) if present
# But also allow building inside container
COPY tsconfig.json ./
COPY src ./src

# Build (if dist not present)
RUN npm run build

# Runtime env
ENV NODE_ENV=production
ENV PORT=8080

# Expose Cloud Run port
EXPOSE 8080

CMD ["npm", "start"]
