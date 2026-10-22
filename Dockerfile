# ---------- Etapa 1: construir la DApp (Node) ----------
FROM node:22-alpine AS build
WORKDIR /app

# Dependencias primero: esta capa se reutiliza mientras no cambien package*.json
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite incrusta las variables VITE_* al compilar, por eso la clave del explorador
# entra como argumento de construcción y NO se copia desde un archivo .env.
ARG VITE_ETHERSCAN_KEY=""
ENV VITE_ETHERSCAN_KEY=$VITE_ETHERSCAN_KEY
RUN npm run build

# ---------- Etapa 2: servir los archivos estáticos (nginx) ----------
FROM nginx:1.27-alpine AS produccion

# nginx sustituye ${PORT} al arrancar (plantillas en /etc/nginx/templates).
# Los servicios cloud (Cloud Run, Render, Railway...) asignan el puerto por PORT.
ENV PORT=80
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/healthz" || exit 1
