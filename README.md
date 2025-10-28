# Restaurante Web

Aplicación web de restaurante con frontend en React + Vite y backend en Node.js + Express integrado con Firebase (Auth + Firestore). Incluye configuración para servir el frontend con Nginx y contenedores Docker para el backend.

## Tecnologías

- Frontend: React, Vite, Axios, Bootstrap, FontAwesome, Firebase Web SDK
- Backend: Node.js, Express, Firebase Admin SDK
- Infraestructura: Nginx (para frontend), Docker
- Autenticación: Firebase Auth (Email/Password + Google OAuth)
- Persistencia: Firestore (colección `users`)

## Estructura del Proyecto

- `src/` (frontend Vite-React y vistas)
- `dist/` (build del frontend)
- `busch-burier-api/` (backend Node/Express + Firebase Admin)
- `Dockerfile` (build del frontend y servir estático con Nginx)
- `docker-compose.yml` (legacy, no corresponde con el backend actual; ver nota)
- `frontend/nginx.conf` y `nginx.conf` (config Nginx para frontend)
- `scripts/*.sh` (scripts de despliegue en Linux/Mac)

## Variables de Entorno

### Frontend (archivo `.env` en la raíz)

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_API_URL` (por defecto `http://localhost:3000/`)

Ejemplo (ya presente en el repo):
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=busch-burier.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=busch-burier
VITE_FIREBASE_STORAGE_BUCKET=busch-burier.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=868155491321
VITE_FIREBASE_APP_ID=1:868155491321:web:...
VITE_FIREBASE_MEASUREMENT_ID=G-...
VITE_API_URL= http://localhost:3000/


### Backend (archivo `.env` dentro de `busch-burier-api`)

- `PORT` (3000)
- `FIREBASE_API_KEY` (no se usa directamente en el backend actual, está hardcodeado en `AuthService`; ver recomendaciones)

Además, el backend requiere el archivo `busch-burier-api/serviceAccountKey.json` con credenciales del servicio de Firebase Admin.

Advertencia: No es recomendable commitear llaves o secretos (`serviceAccountKey.json`, API keys). Considera moverlos a variables de entorno seguras.

## Instalación y Ejecución Local

### Requisitos

- Node.js 18+ (Frontend usa Node 18 en Docker; el backend Docker usa Node 20)
- npm
- Firebase Project configurado (para Auth y Firestore)
- Credenciales del servicio (`serviceAccountKey.json`) en `busch-burier-api/`

### Frontend (desarrollo)

- `npm install`
- `npm run dev`

Accede a `http://localhost:5173` (puerto por defecto de Vite) y asegúrate de que `VITE_API_URL` apunta al backend (`http://localhost:3000/`).

### Backend (desarrollo)

En `busch-burier-api/`:

- `npm install`
- colocar `serviceAccountKey.json` válido (ya hay uno en el repo, se recomienda usar el tuyo)
- `npm run dev`

El backend inicia en `http://localhost:3000`.

## Endpoints del Backend

Base: `http://localhost:3000`

- Autenticación (email/clave)
  - POST `auth/login`
    - Body: `{ "email": string, "password": string }`
    - Respuesta: `{ message, user: { email, idToken, refreshToken, uid } }` o error 401

- Autenticación (Google)
  - POST `auth/login-google`
    - Body: `{ "idToken": string }` (token de Firebase del cliente)
    - Respuesta:
      - `{ exists: true, session: UserModel, token: idToken }` si existe en Firestore
      - `{ exists: false, session: { uid, email, name, photo }, token: idToken }` si no existe

- Usuarios
  - POST `users/`
    - Body (una de dos opciones):
      - Google: `{ idToken, email, firstName, lastName, photo?, address?, phone? }`
      - Manual: `{ email, password, firstName, lastName, photo?, address?, phone? }`
    - Efecto: Crea/actualiza usuario en Firebase Auth y persistencia en Firestore (`users/{uid}`), normalizando `undefined → null`.
    - Respuesta: `{ message: "Usuario creado/actualizado correctamente", user: UserModel }`

### Modelo de Usuario (Firestore)

`UserModel`:
- `uid`: string
- `email`: string
- `firstName`: string | null
- `lastName`: string | null
- `photo`: string | null (URL/base64)
- `address`: string | null
- `phone`: string | null
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

## Flujo de Autenticación (Frontend)

- Email/Password:
  - Formulario en `src/pages/Login.jsx`
  - Llama `POST {VITE_API_URL}auth/login` y guarda `token`/`usuario` en `localStorage` y `sessionStorage`
- Google:
  - `signInWithPopup` usando Firebase Web SDK (`auth`, `GoogleAuthProvider`)
  - Obtiene `idToken` y lo envía a `POST {VITE_API_URL}auth/login-google`
  - Si existe en Firestore: guarda sesión y navega a `/`
  - Si no existe: navega a `/register` con `state` y completa registro
- Registro:
  - `src/pages/Register.jsx` gestiona ambos casos:
    - Manual: valida contraseñas, `POST {VITE_API_URL}users`, luego hace sign-in con Firebase y guarda sesión
    - Google: `POST {VITE_API_URL}users` con `idToken` y datos del perfil

`src/context/AuthContext.jsx` mantiene el estado global de `usuario` y persistencia en `localStorage`.

## Docker

### Frontend

El `Dockerfile` en la raíz construye el frontend y lo sirve con Nginx.

- Construir imagen
  - `docker build -t restaurante-frontend .`
- Ejecutar contenedor
  - `docker run -p 80:80 restaurante-frontend`

Nginx usa `nginx.conf` (raíz) para servir los archivos del `dist`.

### Backend

Usa el `Dockerfile` y `docker-compose.yml` ubicados en `busch-burier-api/`.

- Desde `busch-burier-api/`:
  - `docker-compose up -d`
- Expuesto en `http://localhost:3000`

El `docker-compose.yml` del backend monta el código como volumen, ideal para desarrollo (`- .:/usr/src/app`).

### Nota sobre `docker-compose.yml` en raíz

El `docker-compose.yml` de la raíz referencia una estructura `./backend` y servicios (PostgreSQL, Nginx proxy, backend en `3001`) que no corresponde con el backend actual (`busch-burier-api`). Trátalo como legado o ejemplo. Para el backend efectivo, usa el compose dentro de `busch-burier-api/`.

## Scripts

- `scripts/build.sh`, `scripts/deploy.sh`: pensados para Linux/Mac. En Windows, puedes ejecutar las acciones equivalentes manualmente:
  - `npm run build`
  - `docker build ...`
  - `docker-compose up -d`

## Recomendaciones y Notas

- Mueve `FIREBASE_API_KEY` del backend a variables de entorno (en `AuthService` se está usando un valor hardcodeado).
- No subas `serviceAccountKey.json` a control de versiones; usa variables de entorno/secretos seguros.
- Asegúrate de tener reglas de seguridad adecuadas en Firestore.
- Ajusta `VITE_API_URL` si cambias el puerto del backend.