# Imagen base con Node
FROM node:20

# Crear directorio de la app
WORKDIR /usr/src/app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto de la app
COPY . .

# Exponer el puerto que usa tu app (ej: 3000)
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
