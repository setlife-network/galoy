FROM node:14

COPY "./package.json" "./tsconfig.json" "./yarn.lock" ./

RUN yarn install

COPY  "./src/" "./src/"

COPY "./*.js" "./"
COPY "./default.yaml" "./"
COPY "./.env" "./.env"

CMD sleep infinity