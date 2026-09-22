# Imagen donde corre el agente. Deliberadamente flaca:
# tiene lo necesario para construir y correr el repo, y nada más.
# No tiene credenciales: se le pasan por env solo las que el paso declara.
FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      git ca-certificates ripgrep jq curl \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable

# CLI del agente. Fijá la versión cuando tengas una que te sirva.
ARG CLAUDE_CLI_VERSION=latest
RUN npm install -g "@anthropic-ai/claude-code@${CLAUDE_CLI_VERSION}" \
    && claude --version || true

# El repo se monta en /work desde el host. No se copia nada acá dentro.
WORKDIR /work

# Sin root: los archivos que el agente escriba quedan con el uid que le pasemos
# por --user, así el worker los puede leer después.
ENV HOME=/tmp
ENTRYPOINT []
CMD ["bash"]
