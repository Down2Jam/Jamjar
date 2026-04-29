ARG NODE_VERSION=24.14.0

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /usr/src/app
EXPOSE 3000

FROM base AS deps
COPY package*.json ./
COPY packages/bioloom-ui/package.json packages/bioloom-ui/package.json
COPY packages/bioloom-miniplayer/package.json packages/bioloom-miniplayer/package.json
RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM deps AS builder
COPY . .
ENV VITE_PUBLIC_MODE=PROD
ENV NEXT_PUBLIC_MODE=PROD
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
COPY --from=builder /usr/src/app/package.json /usr/src/app/package-lock.json ./
COPY --from=builder /usr/src/app/packages ./packages
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/server.mjs ./server.mjs
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev \
    && npm cache clean --force \
    && chown -R node:node /usr/src/app

USER node
CMD ["npm", "start"]
