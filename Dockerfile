FROM node:18-alpine

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the app source code
COPY . .

EXPOSE 3000

CMD ["node", "index.js"]