FROM node:18.18

WORKDIR /www/app

COPY . .
ARG SITE_API_HOST
ENV SITE_API_HOST ${SITE_API_HOST}

RUN yarn
RUN yarn prisma generate
RUN yarn build:prod
RUN rm -Rf ./src
RUN rm -Rf ./client/src

EXPOSE 8080
CMD [ "yarn", "start:prod" ]