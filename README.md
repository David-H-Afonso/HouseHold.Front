# Household Front

React frontend for the Household app manage food items, dish templates, meal entries, and household tasks.

## Stack

- **React 19** + **Vite 7** + **TypeScript 5.8**
- **Redux Toolkit** + **redux-persist** (auth persisted to localStorage)
- **react-router-dom 7**
- **SASS** (sass-embedded)

## Getting Started

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Environment Variables

Create a `.env` file at the project root:

```env
VITE_API_BASE_URL=http://localhost:5019
```

In production the value is injected at container startup via `window.API_BASE_URL`.

## Build

```bash
npm run build   # outputs to dist/
npm run preview # preview production build locally
```

## Docker

```bash
# Build image
docker build -t household-front .

# Run (replace API_URL with your backend address)
docker run -p 1125:80 -e HOUSEHOLD_API_URL=http://your-api:1127 household-front
```

Or use the provided `docker-compose.casaos.yml` for CasaOS deployment.

## CI / CD

GitHub Actions builds and pushes a multi-arch image to GHCR on every push to `master`:

```
ghcr.io/david-h-afonso/household-front:latest
```

## Project Structure

```
src/
  components/      UI components
  environments/    dev / prod environment configs
  hooks/           shared custom hooks
  models/          TypeScript types (api, store, components)
  playground/      feature sections (Auth, Admin, Food, Dishes, Meals, Home)
  router/          route definitions
  services/        API service functions
  store/           Redux store + feature slices
  App.tsx
  App.scss
  main.tsx
```
