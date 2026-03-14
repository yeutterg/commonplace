FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install

COPY apps/web apps/web
COPY packages/shared packages/shared

RUN npm run build -w @obsidian-comments/shared && npm run build -w @obsidian-comments/web

EXPOSE 3000

CMD ["npm", "run", "start", "-w", "@obsidian-comments/web"]
