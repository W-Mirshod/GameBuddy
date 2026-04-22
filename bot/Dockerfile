FROM node:22-alpine

WORKDIR /app

COPY backend/prisma ./prisma
COPY bot/package.json ./package.json
RUN npm install

COPY bot/bot.js ./bot.js

CMD ["node", "bot.js"]
