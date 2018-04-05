FROM node:8.4.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/src/app

VOLUME /usr/src/api

WORKDIR /usr/src/api
