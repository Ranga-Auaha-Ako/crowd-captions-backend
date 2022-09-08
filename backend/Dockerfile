# Based heavily on https://github.com/docker/awesome-compose/blob/4bbd137d73b5dddfd91e3515d43ef1aa28cc36fe/react-express-mysql/backend/Dockerfile

# Use LTS NodeJS
FROM node:16.17.0

WORKDIR /code

COPY package*.json ./
RUN npm ci

# copy in our source code last, as it changes the most
COPY . /code

CMD [ "node", "src/index.js" ]
