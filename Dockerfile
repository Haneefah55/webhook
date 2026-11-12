# lightweight Node image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies first (for layer caching)
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Expose application port
EXPOSE 3000

# Start the application in production mode
CMD ["node", "dist/main.js"]
