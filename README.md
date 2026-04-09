# Household Front

React SPA for Household — a personal home management app covering food tracking, meal planning, dish templates, household tasks, rooms, and issue reporting.

## Features

- **Food Items** — Shared ingredient/food catalogue with search
- **Dish Templates** — Per-user dish/recipe definitions
- **Meal Entries** — Log daily meals with date range filters
- **Task Templates & Entries** — Manage recurring household tasks
- **Rooms** — Define the rooms in your home
- **Issues** — Report and track household issues per room
- **Admin Panel** — User management for self-hosted instances
- **JWT Auth** — Secure login with refresh token support
- **Responsive** — Mobile-friendly layout
- **Dark Theme** — Consistent dark UI with CSS custom properties

## Tech Stack

- **React 19** + TypeScript 5
- **Vite** — Build tool
- **Redux Toolkit** — State management with redux-persist
- **React Router 7** — Client-side routing
- **SCSS** — Modular styling with BEM naming
- **SVG Icons** — via vite-plugin-svgr

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- Running Household API instance

## Installation

```bash
cd Household.Front
npm install
```

## Development

```bash
cp .env.example .env
# Edit .env with your API URL
npm run dev
# Available at http://localhost:5173
```

## Production Build

```bash
npm run build
# Output in dist/
```

The built files are served by the nginx container in the Docker Compose setup.

## Project Structure

```
Household.Front/
├── public/              # Static assets
└── src/
    ├── assets/          # SVG icons, images
    ├── components/
    │   ├── Admin/       # Admin panel
    │   ├── Auth/        # Login / protected route
    │   ├── Header/      # App header
    │   ├── Home/        # Home / dashboard
    │   ├── Playground/  # Dev sandbox
    │   ├── errors/      # Error boundary / route error
    │   └── elements/    # Shared components
    ├── environments/    # API base URL config + routes
    ├── hooks/           # Custom React hooks
    ├── layouts/         # App layout wrappers
    ├── models/          # TypeScript interfaces matching API DTOs
    ├── navigation/      # React Router config
    ├── services/        # API service layer
    ├── store/           # Redux slices & selectors
    └── utils/           # Utility functions
```

## Available Scripts

| Script            | Description                   |
| ----------------- | ----------------------------- |
| `npm run dev`     | Start dev server              |
| `npm run build`   | Type-check + production build |
| `npm run lint`    | ESLint                        |
| `npm run preview` | Preview production build      |

## Docker

```bash
docker build -t household-web .
docker run -p 80:80 -e VITE_API_BASE_URL=http://your-api:8080 household-web
```

See the root `docker-compose.casaos.yml` for CasaOS deployment.

## Environment Variables

| Variable            | Description     | Default                 |
| ------------------- | --------------- | ----------------------- |
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8080` |

## License

MIT

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
