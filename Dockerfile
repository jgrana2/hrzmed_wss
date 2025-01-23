# docker/node/Dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

COPY app.js .

RUN npm install ws

CMD ["node", "app.js"]
