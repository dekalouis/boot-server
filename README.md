# Chirpy

A small Twitter-style HTTP API ("chirps" of up to 140 characters) built with Express 5, TypeScript, PostgreSQL and Drizzle ORM. Includes JWT authentication, refresh tokens, and a webhook for upgrading users to Chirpy Red.

## Requirements

- Node.js 22.14.0 (see `.nvmrc`)
- PostgreSQL

## Setup

```bash
npm install
```

Create a `.env` file in the project root:

| Variable     | Required | Description                                                           |
| ------------ | -------- | --------------------------------------------------------------------- |
| `DB_URL`     | yes      | Postgres connection string, e.g. `postgres://user:pass@localhost:5432/chirpy?sslmode=disable` |
| `PLATFORM`   | yes      | Set to `dev` to enable `POST /admin/reset`                            |
| `JWT_SECRET` | yes      | Secret used to sign access tokens (e.g. `openssl rand -base64 64`)    |
| `POLKA_KEY`  | yes      | API key the Polka payment provider sends with webhooks                |
| `PORT`       | no       | HTTP port, defaults to `8080`                                         |

The server exits on startup if a required variable is missing. Pending migrations are applied automatically on startup.

## Scripts

| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `npm run dev`      | Compile and start the server                     |
| `npm run build`    | Compile TypeScript to `dist/`                    |
| `npm start`        | Run the compiled server                          |
| `npm run generate` | Generate a Drizzle migration from `schema.ts`    |
| `npm run migrate`  | Apply migrations manually                        |
| `npm test`         | Run tests (Vitest)                               |

## Project layout

```
src/
  index.ts        Express app, routes, startup migration
  config.ts       Env-based configuration
  auth.ts         Password hashing (argon2), JWT and token helpers
  api/            Route handlers, middleware, error classes
  db/             Drizzle schema, migrations, queries
  app/            Static files served at /app
```

## Authentication

| Credential    | Header                         | Used for                                  |
| ------------- | ------------------------------ | ----------------------------------------- |
| Access token  | `Authorization: Bearer <JWT>`  | Creating/deleting chirps, updating a user |
| Refresh token | `Authorization: Bearer <token>`| `POST /api/refresh`, `POST /api/revoke`   |
| Polka API key | `Authorization: ApiKey <key>`  | `POST /api/polka/webhooks`                |

Access tokens are JWTs (issuer `chirpy`) valid for 1 hour. Refresh tokens are random 32-byte hex strings stored in the database and can be revoked.

## Errors

Errors return JSON: `{ "error": "message" }`.

| Status | Meaning                                              |
| ------ | ---------------------------------------------------- |
| 400    | Missing or invalid input, malformed auth header      |
| 401    | Missing/invalid credentials                          |
| 403    | Authenticated but not allowed (e.g. not your chirp)  |
| 404    | Resource not found                                   |

## API reference

### Users

#### `POST /api/users` — create a user

```json
{ "email": "lane@example.com", "password": "04234" }
```

**201**
```json
{
  "id": "50e1a1e0-...",
  "email": "lane@example.com",
  "createdAt": "2026-10-17T00:00:00.000Z",
  "updatedAt": "2026-10-17T00:00:00.000Z",
  "isChirpyRed": false
}
```

#### `PUT /api/users` — update own email and password

Requires a Bearer access token. Both fields are required.

```json
{ "email": "new@example.com", "password": "newpass" }
```

**200** returns the updated user (without the password).

### Auth

#### `POST /api/login`

```json
{ "email": "lane@example.com", "password": "04234" }
```

**200** returns the user plus tokens:
```json
{
  "id": "...", "email": "...", "createdAt": "...", "updatedAt": "...",
  "isChirpyRed": false,
  "token": "<access JWT>",
  "refreshToken": "<refresh token>"
}
```

**401** on wrong email or password.

#### `POST /api/refresh`

Send the refresh token as a Bearer token. **200** returns `{ "token": "<new access JWT>" }`. **401** if the token is unknown, expired or revoked.

#### `POST /api/revoke`

Send the refresh token as a Bearer token. **204**, no body.

### Chirps

#### `POST /api/chirps` — create a chirp

Requires a Bearer access token.

```json
{ "body": "Hello, world!" }
```

- Max 140 characters, otherwise **400**.
- The words `kerfuffle`, `sharbert` and `fornax` (case-insensitive, whole words) are replaced with `****`.

**201** returns the chirp:
```json
{
  "id": "...",
  "createdAt": "...",
  "updatedAt": "...",
  "body": "Hello, world!",
  "userId": "..."
}
```

#### `GET /api/chirps` — list chirps

| Query      | Description                                         |
| ---------- | --------------------------------------------------- |
| `authorId` | Only chirps by this user                            |
| `sort`     | `desc` for newest first; anything else is ascending |

**200** returns an array of chirps.

#### `GET /api/chirps/:chirpId`

**200** returns the chirp, **404** if it doesn't exist.

#### `DELETE /api/chirps/:chirpId`

Requires a Bearer access token. Only the chirp's author may delete it (**403** otherwise). **204** on success.

### Webhooks

#### `POST /api/polka/webhooks`

Requires `Authorization: ApiKey <POLKA_KEY>`.

```json
{ "event": "user.upgraded", "data": { "userId": "50e1a1e0-..." } }
```

- `user.upgraded` sets the user's `isChirpyRed` to `true`. **204** on success, **404** if the user doesn't exist.
- Any other event is ignored with **204**.
- **401** on a missing or wrong API key.

### Utility endpoints

| Endpoint                | Description                                                         |
| ----------------------- | ------------------------------------------------------------------- |
| `GET /api/healthz`      | Readiness check, returns `OK`                                       |
| `GET /admin/metrics`    | HTML page with the number of hits to `/app`                         |
| `POST /admin/reset`     | Resets the hit counter and deletes all users (and their chirps). Only when `PLATFORM=dev`, otherwise **403** |
| `GET /app/*`            | Static files from `src/app`                                         |

## Database

Tables (see `src/db/schema.ts`):

- **users** — `id`, `email` (unique), `hashed_password`, `is_chirpy_red`, timestamps
- **chirps** — `id`, `body`, `user_id` → users (cascade delete), timestamps
- **refresh_tokens** — `token`, `user_id` → users (cascade delete), `expires_at`, `revoked_at`, timestamps

To change the schema, edit `src/db/schema.ts`, run `npm run generate`, then restart (or `npm run migrate`).
