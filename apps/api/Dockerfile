# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copia package.json
COPY package*.json ./

# Instala dependências
RUN npm ci --only=production

# Copia o código fonte
COPY . .

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copia dependências e código
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

# Cria usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Muda permissões
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expõe porta
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando para rodar
CMD ["node", "src/main.js"]
