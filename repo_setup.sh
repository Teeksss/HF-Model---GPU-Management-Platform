#!/bin/bash
echo "Kurulum başlıyor..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ../frontend
npm install
npm run build
cd ..
docker-compose up --build
