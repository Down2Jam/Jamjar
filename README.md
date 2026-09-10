# Jamjar

Frontend for Down2Jam.

## Local Development

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:3000`.

Create a `.env` file if you need to choose which API to use:

```env
VITE_PUBLIC_MODE=DEV
```

`DEV` uses a local Jamcore API on `http://localhost:3005`.
`PROD` uses the production API.

## Production

```bash
npm run build
npm start
```

The production server serves the Vite build and injects dynamic SEO metadata for public game, music, user, and post pages.

Useful environment variables:

```env
PORT=3000
PUBLIC_ORIGIN=https://d2jam.com
API_BASE_URL=https://d2jam.com/api/v1
VITE_GAME_BUILDS_ORIGIN=https://play.d2jam.com
```

In production, `VITE_GAME_BUILDS_ORIGIN` should be a dedicated cookieless origin that proxies `/game-builds/*` to Jamcore. Keep it unset for local same-origin development.

## Docker

```bash
docker compose up --build -d
```
