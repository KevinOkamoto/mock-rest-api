# syntax=docker/dockerfile:1
FROM node:12-alpine

WORKDIR /usr/src/app
COPY . .
RUN npm install

CMD [ "npm", "start" ]%         