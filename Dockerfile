FROM node:24.14.0-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN chown -R node:node /usr/src/app

EXPOSE 3000

USER node
CMD ["npm", "start"]
