FROM node:22-alpine

WORKDIR /app

COPY backend/prisma ./prisma
COPY bot/package.json ./package.json
RUN npm install
RUN npx prisma generate --schema=./prisma/schema.prisma

COPY bot/bot.js ./bot.js

CMD ["node", "bot.js"]
