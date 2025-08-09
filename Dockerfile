#
# e.g. docker build --build-arg MODULE=daemon
ARG MODULE

FROM node:22-bullseye AS BUILDER
ARG MODULE
ADD . /build
WORKDIR /build
RUN npm install -g ncc @microsoft/rush && \
    rush install -t @m4/${MODULE} && \
    cd m4-${MODULE} && \
    npm run build

FROM node:22-bullseye AS RUNTIME
ARG MODULE
COPY --from=BUILDER /build/m4-${MODULE}/dist/index.js /app/
WORKDIR /app
ENTRYPOINT ["node", "index.js"]