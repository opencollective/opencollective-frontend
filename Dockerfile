FROM node:24.21@sha256:64af3819f9275802414d7cdc38c27e9d82bd564dec4d4da87d008255d36c63b4

WORKDIR /usr/src/frontend

# Skip Cypress Install
ENV CYPRESS_INSTALL_BINARY 0

# Install dependencies first
COPY package*.json ./
RUN npm install --unsafe-perm

COPY . .

ARG PORT=3000
ENV PORT $PORT

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

ARG API_URL=https://api-staging.opencollective.com
ENV API_URL $API_URL

ARG INTERNAL_API_URL=https://api-staging-direct.opencollective.com
ENV INTERNAL_API_URL $INTERNAL_API_URL

ARG IMAGES_URL=https://images-staging.opencollective.com
ENV IMAGES_URL $IMAGES_URL

ARG PDF_SERVICE_URL=https://pdf-staging.opencollective.com
ENV PDF_SERVICE_URL $PDF_SERVICE_URL

ARG ML_SERVICE_URL=https://ml.opencollective.com
ENV ML_SERVICE_URL $ML_SERVICE_URL

ARG API_KEY=09u624Pc9F47zoGLlkg1TBSbOl2ydSAq
ENV API_KEY $API_KEY

RUN npm run build

RUN npm prune --production

EXPOSE $PORT

CMD [ "npm", "run", "start" ]
