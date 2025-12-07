FROM node:20-alpine

WORKDIR /app

# Install dependencies (only for dev, including devDependencies)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Expose Vite Port
EXPOSE 5173

# Start Dev Server
CMD ["npm", "run", "dev", "--", "--host"]
