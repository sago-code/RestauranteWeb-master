#!/bin/bash

echo "🚀 Construyendo imágenes Docker para Restaurante Web..."

# Construir imagen del backend
echo "📦 Construyendo imagen del backend..."
docker build -t restaurante-backend ./backend

# Construir imagen del frontend
echo "📦 Construyendo imagen del frontend..."
docker build -t restaurante-frontend ./frontend

echo "✅ Todas las imágenes han sido construidas exitosamente!"
echo ""
echo "Para ejecutar la aplicación completa, usa:"
echo "docker-compose up -d"
echo ""
echo "Para ver los logs:"
echo "docker-compose logs -f"
