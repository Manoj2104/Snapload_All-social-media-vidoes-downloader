# SnapLoad — Single Container: FastAPI (backend) + Next.js static (frontend)
# Stage 1: Build the Next.js frontend
FROM node:20-slim AS frontend-builder
WORKDIR /frontend

# Copy frontend source
COPY frontend/package*.json ./
RUN npm install

# Copy rest of frontend
COPY frontend/ ./

# Build as static export
# NEXT_PUBLIC_API_URL is empty so all /api/* calls are relative (same origin)
ENV NEXT_PUBLIC_API_URL=""
RUN npm run build

# Stage 2: Python backend + serve frontend static files
FROM python:3.11-slim
WORKDIR /app

# Install system deps — FFmpeg is required for yt-dlp merging, nodejs for YouTube n-sig decryption
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg curl nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./

# Copy the built frontend static files into backend/static/
COPY --from=frontend-builder /frontend/out ./static/

# Create downloads directory
RUN mkdir -p downloads

# Expose port (Render injects $PORT)
EXPOSE 8000

# Start FastAPI — it will serve the frontend from /static
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
