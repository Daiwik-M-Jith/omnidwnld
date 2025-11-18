FROM node:20-bullseye-slim

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production

CMD [ "node", "index.js" ]
