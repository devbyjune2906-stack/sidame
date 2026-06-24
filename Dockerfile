# ---------- Builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install semua dependency (termasuk devDependencies untuk build, drizzle-kit, tsx)
COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# ---------- Runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Salin seluruh aplikasi (node_modules tetap berisi drizzle-kit & tsx untuk migrasi + seed)
COPY --from=builder /app ./

EXPOSE 3000
CMD ["sh", "entrypoint.sh"]
