
FROM node:20-alpine3.19

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN chmod +x entrypoint.sh || true

EXPOSE 3000

ENTRYPOINT ["sh", "./entrypoint.sh"]