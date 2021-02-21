FROM node:10.15.3 as source
WORKDIR /src/build-your-own-radar
COPY package.json ./
RUN npm install
COPY . ./
RUN npm run build


FROM nginx:1.19.7-alpine
ENV PORT 8080
ENV HOST 0.0.0.0
WORKDIR /opt/build-your-own-radar
COPY --from=source /src/build-your-own-radar/dist .
COPY default.template /etc/nginx/conf.d/default.conf
ENTRYPOINT ["nginx", "-g", "daemon off;"]