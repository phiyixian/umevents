FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --production

# Copy source
COPY . .

# Set env
ENV NODE_ENV=production

# Cloud Run provides PORT
EXPOSE 8080

# Start server
CMD ["node", "server.js"]


