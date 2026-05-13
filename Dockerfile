# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

# Install dependencies first (cached layer)
COPY frontend/package*.json ./
RUN npm install

# Copy source code and build
COPY frontend/ ./

# Force fresh build by adding a cache-busting ARG
ARG CACHEBUST=1
RUN npm run build

# Stage 2: Final Production Image
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies including FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg curl && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the freshly-built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/out ./frontend/out

# Copy backend source code
COPY backend/ ./backend/

# Set working directory to backend
WORKDIR /app/backend

# Expose port
EXPOSE 8000

# Start command with dynamic port support
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
