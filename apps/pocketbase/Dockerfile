FROM alpine:latest

ARG PB_VERSION=0.22.0

RUN apk add --no-cache \
    unzip \
    ca-certificates \
    wget

# Baixa e extrai o PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/ && \
    rm /tmp/pb.zip && \
    chmod +x /pb/pocketbase

# Empacota hooks e migrações na imagem, fora dos volumes persistentes
COPY pb_hooks /pb/bundled_hooks
COPY pb_migrations /pb/bundled_migrations

EXPOSE 8080

# Volume persistente somente para os dados do PocketBase
VOLUME ["/pb/pb_data"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080", "--dir=/pb/pb_data", "--hooksDir=/pb/bundled_hooks", "--migrationsDir=/pb/bundled_migrations"]
