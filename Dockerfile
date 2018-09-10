FROM node:10

RUN apt-get update -y && apt-get install -y graphicsmagick

WORKDIR /usr/src/frontend

COPY package*.json ./

RUN npm install

COPY . .

ARG PORT=3000
ENV PORT $PORT

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

ARG API_URL=https://api-staging.opencollective.com
ENV API_URL $API_URL

ARG API_KEY=09u624Pc9F47zoGLlkg1TBSbOl2ydSAq
ENV API_KEY $API_KEY

RUN npm run build

EXPOSE ${PORT}

CMD [ "npm", "run", "start" ]
