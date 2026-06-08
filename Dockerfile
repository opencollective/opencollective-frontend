FROM node:24.16@sha256:8530f76a96d88820d288761f022e318970dda93d01536919fbc16076b7983e63

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
