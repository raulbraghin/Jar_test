#!/bin/sh
set -e

echo "Iniciando API Jar Test..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
