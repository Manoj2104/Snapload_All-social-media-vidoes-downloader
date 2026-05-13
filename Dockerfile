# SnapLoad Backend - Python only (Frontend hosted on Netlify)
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies including FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg curl && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./

# Expose port
EXPOSE 8000

# Start command with dynamic port support
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
