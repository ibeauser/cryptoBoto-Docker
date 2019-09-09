FROM node:11.4.0

WORKDIR /app

RUN npm install express-generator -g
RUN yes | express --view=pug

EXPOSE 4000