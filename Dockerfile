FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN yarn global add pm2

RUN yarn

COPY . .

CMD ["pm2-runtime", "pm2.config.js"]

