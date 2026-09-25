FROM node:20-bookworm-slim AS deps
WORKDIR /app
# Ausgehender Port 80 ist in manchen Netzwerken (auch auf der NAS) blockiert; HTTPS-Spiegel erzwingen.
RUN sed -i 's|http://|https://|g' /etc/apt/sources.list.d/*.sources /etc/apt/sources.list 2>/dev/null || true
# Bootstrap: ca-certificates fehlt im schlanken Basis-Image, daher HTTPS-Zertifikatspruefung
# nur fuer diesen einen Schritt deaktivieren; danach laeuft apt normal verifiziert weiter.
RUN apt-get update -o Acquire::https::Verify-Peer=false -o Acquire::https::Verify-Host=false \
  && apt-get install -y --no-install-recommends --allow-unauthenticated ca-certificates \
  -o Acquire::https::Verify-Peer=false -o Acquire::https::Verify-Host=false \
  && apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# ca-certificates wird hier zur LAUFZEIT gebraucht, anders als bei Kochkiste: Der Server holt
# Metadaten und Cover von Google Books und Open Library. Ohne das Paket scheitert jeder
# HTTPS-fetch mit "unable to get local issuer certificate", und zwar erst beim ersten Scan.
RUN sed -i 's|http://|https://|g' /etc/apt/sources.list.d/*.sources /etc/apt/sources.list 2>/dev/null || true
RUN apt-get update -o Acquire::https::Verify-Peer=false -o Acquire::https::Verify-Host=false \
  && apt-get install -y --no-install-recommends --allow-unauthenticated ca-certificates \
  -o Acquire::https::Verify-Peer=false -o Acquire::https::Verify-Host=false \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# In public/ liegen das Fuchs-Logo und die Manifest-Icons. Die Rechte kommen aus dem
# Build-Kontext, und nach `tar -xf` auf der NAS steht der Ordner auf 700: root darf hinein,
# der Nutzer `nextjs` nicht -- jede Datei darin antwortet dann mit 500, und am Handy steht
# ein Fragezeichen statt des Logos. Deshalb Leserechte fuer alle erzwingen.
COPY --from=builder /app/public ./public
RUN chmod -R a+rX ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# data/ traegt die SQLite-Datei, cover/ die heruntergeladenen und selbst fotografierten
# Buchcover. Beide liegen als Volume auf demselben Synology-Datentraeger und werden damit
# gemeinsam von Hyper Backup gesichert.
RUN mkdir -p /app/data /app/cover && chown nextjs:nodejs /app/data /app/cover

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV DB_PATH=/app/data/app.db
ENV COVER_DIR=/app/cover

CMD ["node", "server.js"]
