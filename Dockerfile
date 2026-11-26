FROM node:22-alpine

# Set node environment to production
ENV NODE_ENV=production

# Create app directory inside the container
WORKDIR /usr/src/app

# Copy dependency files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source files
COPY src/ ./src/
COPY index.js ./
COPY config.yml.example ./
COPY LICENSE ./

# Expose the default server port
EXPOSE 3000

# Run the server
CMD ["node", "index.js"]
