# Use Node.js Base Image
FROM node:20-slim

# Install system dependencies: Python3, FFmpeg, and build tools for yt-dlp
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set Working Directory
WORKDIR /app

# Install App Dependencies
COPY package*.json ./
RUN npm install

# Generate Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy App Source
COPY . .

# Expose Port (Render usually defaults to 10000)
EXPOSE 10000

# Start Command
CMD [ "npm", "start" ]
