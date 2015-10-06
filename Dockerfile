FROM mhart/alpine-node:0.10.40

WORKDIR /src
ADD . .

# If you have native dependencies, you'll need extra tools
RUN apk update && apk add make gcc g++ python

# If you need npm, use mhart/alpine-node or mhart/alpine-iojs
RUN npm install

# If you had native dependencies you can now remove build tools
RUN apk del make gcc g++ python && \
   rm -rf /tmp/* /root/.npm /root/.node-gyp

EXPOSE 3001
EXPOSE 50000/udp
CMD npm start
