FROM node:20-alpine AS build-stage

ARG VITE_RPC_URL
ARG VITE_PROTOCOL_ADDRESS
ARG VITE_READER_ADDRESS
ARG VITE_BACKEND_URL

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN echo "VITE_RPC_URL=${VITE_RPC_URL}" > .env.production && \
    echo "VITE_PROTOCOL_ADDRESS=${VITE_PROTOCOL_ADDRESS}" >> .env.production && \
    echo "VITE_READER_ADDRESS=${VITE_READER_ADDRESS}" >> .env.production && \
    echo "VITE_BACKEND_URL=${VITE_BACKEND_URL}" >> .env.production

RUN npm run build

FROM nginx:stable-alpine AS production-stage

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build-stage /app/dist /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


# docker build \
#   --build-arg VITE_RPC_URL=https://hardhat.devmindtan.uk/ \
#   --build-arg VITE_PROTOCOL_ADDRESS=0x4631BCAbD6dF18D94796344963cB60d44a4136b6 \
#   --build-arg VITE_READER_ADDRESS=0x86A2EE8FAf9A840F7a2c64CA3d51209F9A02081D \
#   --build-arg VITE_BACKEND_URL=http://100.86.141.119:3000 \
#   -t devmindtan/dev-repo:verzik-sandbox-app-v1.0.3 .