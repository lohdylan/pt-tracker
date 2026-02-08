FROM node:22-alpine

WORKDIR /app

# Copy package.json only (for caching)
COPY package.json ./

# Install all dependencies including dev (need typescript for build)
RUN npm install --include=dev

# Copy source code
COPY . .

# Build TypeScript and copy migrations
RUN npx tsc --project ./tsconfig.json && cp -r src/migrations dist/migrations

# Remove dev dependencies for smaller image
RUN npm prune --omit=dev

EXPOSE 3000

CMD ["node", "--import", "./dist/instrument.js", "dist/index.js"]
