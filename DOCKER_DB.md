# DOCKER_DB.md

## Base de datos local con Docker

Este entorno usa PostgreSQL local para desarrollo.

## Archivos

- docker-compose.db.yml
- .env.db.example
- docker/postgres/init/01_schema.sql
- docker/postgres/init/02_seed.sql
- local-api/server.js
- local-api/.env.example

## Pasos

1. Copiar variables de entorno:

```powershell
Copy-Item .env.db.example .env.db
```

2. Levantar la base:

```powershell
docker compose --env-file .env.db -f docker-compose.db.yml up -d
```

3. Ver logs:

```powershell
docker compose --env-file .env.db -f docker-compose.db.yml logs -f postgres
```

4. Bajar contenedores:

```powershell
docker compose --env-file .env.db -f docker-compose.db.yml down
```

5. Borrar datos y reiniciar desde cero:

```powershell
docker compose --env-file .env.db -f docker-compose.db.yml down -v
```

## Conexion

- Host: localhost
- Port: definido por DB_PORT (default 5432)
- Database: definido por DB_NAME (default teatro)
- User: definido por DB_USER (default teatro)
- Password: definido por DB_PASSWORD (default teatro123)

## Nota importante

Los scripts en docker/postgres/init se ejecutan solo en inicializacion de un volumen nuevo.
Si ya levantaste la base una vez y cambiaste scripts, usa `down -v` para recrear todo.

## API local para conectar el frontend a la DB Docker

1. Instalar dependencias de la API:

```powershell
Set-Location local-api
npm install
```

2. Copiar variables de entorno:

```powershell
Copy-Item .env.example .env
```

3. Levantar la API:

```powershell
npm run dev
```

4. Configurar frontend para modo local en app/.env.local:

```env
VITE_DATA_MODE=local
VITE_LOCAL_API_URL=http://localhost:8787
```

5. Volver a modo Supabase cuando quieras:

```env
VITE_DATA_MODE=supabase
```
