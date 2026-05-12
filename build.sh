#!/usr/bin/env bash
# SnapLoad Deployment Script

# 1. Install Frontend Dependencies & Build
echo "🏗️ Building Frontend..."
cd frontend
npm install
npm run build
cd ..

# 2. Install Backend Dependencies
echo "🐍 Installing Backend Dependencies..."
cd backend
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..

echo "✅ Build Complete! App is ready to be started with: uvicorn backend.main:app"
