# 🐳 Despliegue con Docker - Restaurante Web

Este proyecto está configurado para ejecutarse usando Docker y Docker Compose, implementando una arquitectura de microservicios.

## 📋 Arquitectura de Microservicios

### Servicios Incluidos:

1. **Frontend** (React + Vite)
   - Puerto: 80
   - Tecnología: React, Vite, Nginx
   - Función: Interfaz de usuario

2. **Backend API** (Node.js + Express)
   - Puerto: 3001
   - Tecnología: Node.js, Express, JWT
   - Función: API REST para autenticación y datos

3. **Base de Datos** (PostgreSQL)
   - Puerto: 5432
   - Tecnología: PostgreSQL 15
   - Función: Almacenamiento de datos

4. **Nginx Proxy** (Opcional)
   - Puerto: 8080
   - Tecnología: Nginx
   - Función: Proxy reverso y balanceador de carga

## 🚀 Instalación y Despliegue

### Prerrequisitos

- Docker Desktop instalado
- Docker Compose instalado
- Git (para clonar el repositorio)

### Pasos de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd RestauranteWeb-master
   ```

2. **Configurar variables de entorno:**
   ```bash
   # Copiar el archivo de ejemplo
   cp backend/env.example backend/.env
   
   # Editar las variables según tu configuración
   nano backend/.env
   ```

3. **Ejecutar el despliegue:**
   ```bash
   # Dar permisos de ejecución a los scripts
   chmod +x scripts/*.sh
   
   # Ejecutar el script de despliegue
   ./scripts/deploy.sh
   ```

### Comandos Manuales

Si prefieres ejecutar los comandos manualmente:

```bash
# Construir las imágenes
docker-compose build

# Levantar todos los servicios
docker-compose up -d

# Ver los logs
docker-compose logs -f

# Detener los servicios
docker-compose down
```

## 🌐 URLs de Acceso

Una vez desplegado, podrás acceder a:

- **Frontend:** http://localhost
- **Backend API:** http://localhost:3001
- **Nginx Proxy:** http://localhost:8080
- **PostgreSQL:** localhost:5432

## 📁 Estructura de Archivos Docker

```
RestauranteWeb-master/
├── frontend/
│   ├── Dockerfile
│   └── nginx.conf
├── backend/
│   ├── Dockerfile
│   ├── env.example
│   └── init.sql
├── nginx/
│   └── nginx.conf
├── scripts/
│   ├── build.sh
│   └── deploy.sh
├── docker-compose.yml
├── .dockerignore
└── README-Docker.md
```

## 🔧 Configuración

### Variables de Entorno

Las principales variables de entorno se configuran en el archivo `docker-compose.yml`:

```yaml
environment:
  - POSTGRES_DB=restaurante_db
  - POSTGRES_USER=postgres
  - POSTGRES_PASSWORD=password123
  - JWT_SECRET=tu_jwt_secret_super_seguro_aqui
```

### Volúmenes

- `postgres_data`: Persistencia de datos de PostgreSQL
- `./backend:/app`: Desarrollo en tiempo real del backend
- `./nginx/nginx.conf:/etc/nginx/nginx.conf`: Configuración de Nginx

## 🛠️ Comandos Útiles

### Gestión de Contenedores

```bash
# Ver estado de los contenedores
docker-compose ps

# Ver logs de un servicio específico
docker-compose logs -f backend

# Reiniciar un servicio
docker-compose restart frontend

# Ejecutar comandos dentro de un contenedor
docker-compose exec backend npm install
docker-compose exec postgres psql -U postgres -d restaurante_db
```

### Gestión de Imágenes

```bash
# Ver imágenes construidas
docker images

# Eliminar imágenes no utilizadas
docker system prune -a

# Reconstruir una imagen específica
docker-compose build --no-cache backend
```

### Base de Datos

```bash
# Conectar a PostgreSQL
docker-compose exec postgres psql -U postgres -d restaurante_db

# Hacer backup de la base de datos
docker-compose exec postgres pg_dump -U postgres restaurante_db > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres -d restaurante_db < backup.sql
```

## 🔍 Troubleshooting

### Problemas Comunes

1. **Puertos ocupados:**
   ```bash
   # Verificar puertos en uso
   netstat -tulpn | grep :80
   netstat -tulpn | grep :3001
   
   # Cambiar puertos en docker-compose.yml si es necesario
   ```

2. **Problemas de permisos:**
   ```bash
   # Dar permisos a los scripts
   chmod +x scripts/*.sh
   ```

3. **Contenedores no se inician:**
   ```bash
   # Ver logs detallados
   docker-compose logs
   
   # Verificar configuración
   docker-compose config
   ```

4. **Problemas de red:**
   ```bash
   # Verificar redes Docker
   docker network ls
   
   # Inspeccionar red
   docker network inspect restaurante_restaurante_network
   ```

## 📊 Monitoreo

### Verificar Estado de los Servicios

```bash
# Estado general
docker-compose ps

# Uso de recursos
docker stats

# Logs en tiempo real
docker-compose logs -f
```

### Métricas de Rendimiento

- **Frontend:** Nginx sirve archivos estáticos optimizados
- **Backend:** Node.js con Express para APIs
- **Base de datos:** PostgreSQL con conexiones optimizadas
- **Red:** Red Docker bridge para comunicación entre servicios

## 🔒 Seguridad

### Recomendaciones

1. **Cambiar contraseñas por defecto**
2. **Usar variables de entorno para secretos**
3. **Configurar firewall**
4. **Mantener imágenes actualizadas**
5. **Usar HTTPS en producción**

### Variables Sensibles

```bash
# Generar JWT secret seguro
openssl rand -base64 32

# Cambiar contraseña de PostgreSQL
POSTGRES_PASSWORD=tu_contraseña_segura_aqui
```

## 🚀 Producción

### Configuración para Producción

1. **Usar imágenes específicas de versiones**
2. **Configurar variables de entorno de producción**
3. **Implementar HTTPS con certificados SSL**
4. **Configurar backup automático de base de datos**
5. **Implementar monitoreo y logging**

### Ejemplo de docker-compose.prod.yml

```yaml
version: '3.8'
services:
  frontend:
    image: restaurante-frontend:latest
    restart: always
    environment:
      - NODE_ENV=production
  
  backend:
    image: restaurante-backend:latest
    restart: always
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
```

## 📞 Soporte

Para problemas o preguntas:

1. Revisar los logs: `docker-compose logs`
2. Verificar configuración: `docker-compose config`
3. Consultar documentación de Docker
4. Revisar issues del proyecto

---

**¡Disfruta tu aplicación de restaurante desplegada con Docker! 🍔🍟**
