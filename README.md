# openpro/openpro

{ Banner }

{ Badges and links }

{ Description}

Find us at:

{ linkedin }
{ discord }

## Supported Architectures

{ do we need this? }

## Application Setup

{ setup }

## Usage

To help you get started creating a container from this image you can either use docker-compose or the docker cli.

### docker-compose (development)

```yaml
---
version: "3.8"

networks:
  internal:

volumes:
  uploads:
  pgdata:
  backend_node_modules:
  frontend_node_modules:

x-minio-env-variables: &minio-env-variables
  MINIO_PORT: 9000
  MINIO_HOST: openpro-minio
  MINIO_ROOT_USER: access-key
  MINIO_ROOT_PASSWORD: secret-key

services:
  ntfy:
    image: binwiederhier/ntfy
    container_name: ntfy
    command:
      - serve
    environment:
      TZ: UTC # optional: set desired timezone
      NTFY_BASE_URL: http://localhost:8093
      NTFY_CACHE_FILE: /var/lib/ntfy/cache.db
      NTFY_AUTH_FILE: /var/lib/ntfy/auth.db
      NTFY_AUTH_DEFAULT_ACCESS: read-write
      NTFY_BEHIND_PROXY: true
      NTFY_ATTACHMENT_CACHE_DIR: /var/lib/ntfy/attachments
      NTFY_ENABLE_LOGIN: true
      NTFY_VISITOR_REQUEST_LIMIT_BURST: 180
      NTFY_VISITOR_SUBSCRIPTION_LIMIT: 50
    #user: UID:GID # optional: replace with your own user/group or uid/gid
    volumes:
      - ./nfty:/var/lib/ntfy
    ports:
      - "8093:80"
    networks:
      - internal
    healthcheck: # optional: remember to adapt the host:port to your environment
      test:
        [
          "CMD-SHELL",
          "wget -q --tries=1 http://localhost:80/v1/health -O - | grep -Eo '\"healthy\"\\s*:\\s*true' || exit 1",
        ]
      interval: 60s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

  postgresql-db:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    networks:
      - internal
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  openpro-minio:
    image: minio/minio
    container_name: openpro-minio
    environment:
      <<: *minio-env-variables
    pull_policy: always
    restart: unless-stopped
    networks:
      - internal
    command: server /uploads --console-address ":9090"
    volumes:
      - uploads:/uploads
    ports:
      - "9000:9000"
      - "9090:9090"

  createbuckets:
    image: minio/mc
    environment:
      <<: *minio-env-variables
      BUCKET_NAME: uploads
    pull_policy: always
    networks:
      - internal
    entrypoint: >
      /bin/sh -c " /usr/bin/mc config host add openpro-minio http://\$MINIO_HOST:\$MINIO_PORT \$MINIO_ROOT_USER \$MINIO_ROOT_PASSWORD; /usr/bin/mc mb openpro-minio/\$BUCKET_NAME; /usr/bin/mc anonymous set download openpro-minio/\$BUCKET_NAME; exit 0; "
    depends_on:
      - openpro-minio

  backend:
    container_name: backend
    build:
      context: ./backend
      dockerfile: ./Dockerfile.local
      args:
        DOCKER_BUILDKIT: 1
    environment:
      SQL_URI: postgres://postgres:postgres@postgresql-db:5432/postgres
      BUCKET_NAME: uploads
      # Assets
      ASSET_PATH: /app/assets
      ASSET_PROVIDER: minio
      # Minio
      USE_MINIO: 1
      <<: *minio-env-variables
    networks:
      - internal
    volumes:
      - ./backend:/app
      - backend_node_modules:/app/node_modules
    depends_on:
      - postgresql-db
      - createbuckets

  frontend:
    container_name: frontend
    build:
      context: ./frontend
      dockerfile: ./Dockerfile.local
      args:
        DOCKER_BUILDKIT: 1
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8080
      NEXT_PUBLIC_DEFAULT_LOGIN_PROVIDER: <keycloak|github>
      NEXTAUTH_URL: http://localhost:3000
      NEXTAUTH_SECRET: <secret>
      NEXT_PUBLIC_NEXTAUTH_URL: http://localhost:3000
      # Keycloak - optional if using keycloak
      AUTH_KEYCLOAK_ID: <kecloack-id>
      AUTH_KEYCLOAK_SECRET: <secret>
      AUTH_KEYCLOAK_ISSUER: <issuer>
      NEXT_PUBLIC_KEYCLOAK_CLIENT_ID:
      NEXT_PUBLIC_KEYCLOAK_URL:
      NEXT_PUBLIC_KEYCLOAK_REALM:
      # GitHub - optional if using GitHub
      GITHUB_CLIENT_ID: <client-id>
      GITHUB_CLIENT_SECRET: <client-secret>
      # OpenAi - Optional
      #OPENAI_API_BASE: "https://api.openai.com/v1" # change if using a custom endpoint
      #OPENAI_API_KEY: "sk-" # add your openai key here
      #GPT_ENGINE: "gpt-3.5-turbo" # use "gpt-4" if you have access
      # Nfty
      NFTY_WS_HOST: localhost:8093
      NFTY_WS_SSL: false
      PUBLIC_NFTY_HTTP_SSL: false
    networks:
      - internal
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - frontend_node_modules:/app/node_modules
    depends_on:
      - backend
      - ntfy
```

### docker cli ([click here for more info](https://docs.docker.com/engine/reference/commandline/cli/))å

## Parameters

| Parameter | Function |
| :-------: | -------- |
|           |          |
