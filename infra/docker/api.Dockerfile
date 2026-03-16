FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install

COPY apps/api apps/api
COPY packages/shared packages/shared

RUN npm run build -w @commonplace/shared && npm run build -w @commonplace/api

EXPOSE 4000

CMD ["npm", "run", "start", "-w", "@commonplace/api"]
