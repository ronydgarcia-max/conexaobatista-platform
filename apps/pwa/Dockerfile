# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o código fonte
COPY . .

# Build de produção
RUN npm run build

# Production stage - serve com nginx
FROM nginx:alpine

# Copia o build para o nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia configuração do nginx para SPA (opcional mas recomendado)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe porta 80
EXPOSE 80

# Comando padrão do nginx
CMD ["nginx", "-g", "daemon off;"]
