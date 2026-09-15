# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copia package.json
COPY package*.json ./

# Instala dependências
RUN npm ci

# Copia o código fonte
COPY . .

# Build de produção
RUN npm run build

# Production stage - serve com nginx
FROM nginx:alpine

# Remove config padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia o build para o nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe porta 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Comando padrão do nginx
CMD ["nginx", "-g", "daemon off;"]
