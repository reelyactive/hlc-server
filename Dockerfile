FROM node:10-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

EXPOSE 3001
EXPOSE 50000/udp
EXPOSE 50001/udp

CMD [ "node", "bin/hlc-server" ]
