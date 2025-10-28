#!/bin/bash

echo "🚀 Desplegando Restaurante Web con Docker Compose..."

# Detener contenedores existentes
echo "🛑 Deteniendo contenedores existentes..."
docker-compose down

# Eliminar imágenes antiguas (opcional)
echo "🧹 Limpiando imágenes antiguas..."
docker system prune -f

# Construir y levantar todos los servicios
echo "📦 Construyendo y levantando servicios..."
docker-compose up --build -d

# Esperar un momento para que los servicios se inicien
echo "⏳ Esperando que los servicios se inicien..."
sleep 10

# Verificar el estado de los contenedores
echo "🔍 Verificando estado de los contenedores..."
docker-compose ps

echo ""
echo "✅ ¡Despliegue completado!"
echo ""
echo "🌐 URLs de acceso:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:3001"
echo "   Nginx Proxy: http://localhost:8080"
echo "   PostgreSQL: localhost:5432"
echo ""
echo "📋 Comandos útiles:"
echo "   Ver logs: docker-compose logs -f"
echo "   Detener: docker-compose down"
echo "   Reiniciar: docker-compose restart"
