FROM node:8.4.0

RUN echo 'deb http://ftp.debian.org/debian jessie-backports main' > \
    /etc/apt/sources.list.d/jessie-backports.list

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5=9.6.6-0+deb9u1~bpo8+1 postgresql-client-9.6 && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/src/app

VOLUME /usr/src/api

WORKDIR /usr/src/api
