FROM node:24-alpine AS build

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy workspace package files (before npm ci so they're available)
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install all dependencies (workspace aware)
RUN npm ci && npm cache clean --force

# Copy entire project
COPY . .

# Build frontend workspace
RUN npm run build:frontend

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built frontend to nginx
COPY --from=build /app/frontend/dist /usr/share/nginx/html

# Copy nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
