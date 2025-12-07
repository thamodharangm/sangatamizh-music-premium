FROM node:20-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Expose API Port
EXPOSE 3000

# Start Dev Server (using nodemon via npm run dev)
CMD ["npm", "run", "dev"]
