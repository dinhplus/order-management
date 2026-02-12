FROM node:24-alpine

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy workspace package files
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install all dependencies
RUN npm ci && npm cache clean --force

# Copy entire project
COPY . .

# Build backend workspace
RUN npm run build:backend

EXPOSE 4000

# Run from backend directory
WORKDIR /app/backend
CMD ["node", "dist/src/main.js"]
