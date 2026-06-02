[![Build and Deploy](https://github.com/BitFlow-DHBW/BitFlow/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/BitFlow-DHBW/BitFlow/actions/workflows/main.yml)
[![Test-Coverage](https://coveralls.io/repos/github/BitFlow-DHBW/BitFlow/badge.svg?branch=main)](https://coveralls.io/github/BitFlow-DHBW/BitFlow?branch=main)

# [Webseite](https://bitflow.ddns.net/)

# BitFlow

Browserbasierter Logikgatter-Simulator mit speicherbaren Schaltnetzen, Simulationsmodus und Erstellen eigener Bausteine

## Lokal starten

### Backend
.NET Version 8 benötigt.

`cd backend/BitFlow.API; dotnet run`

### Frontend
`cd frontend; npm i; npm run dev`

---

## Tech-Stack

| Schicht | Technologie |
|---|---|
| Frontend | React 19, TypeScript, Vite> |
| Backend | C#, ASP.NET Core Web API |
| Styling | Tailwind CSS |
| Testing | Jest (Frontend), xUnit (Backend), Posstman (API-Tests) |
| Versionsverwaltung | Git |
| Projektmanagement | Youtrack |
| Deployment/Hosting | GitHub Pages (für Frontend) oder ASP.NET-kompatibler Webserver |

## Projektstruktur

```
BitFlow/
├── backend/              # Node/Express API
│   ├── BitFlow.API       # API code
│   └── BitFlow.API.Tests # API Tests
├── frontend/            # Angular SPA
│   ├── src/
│   │   ├── app/         # App shell, routing, auth contexts and guards
│   │   ├── assets/      # images / icons
│   │   ├── components/  # shared UI components
│   │   ├── hooks/       # custom React hooks (collaboration, history)
│   │   ├── modules/     # feature modules: auth, editor, landing, projects, settings
│   │   ├── schematic/   # SVG primitives and symbol geometry (schematic rendering)
│   │   ├── services/    # API layer and domain services (auth, project, collaboration)
│   │   ├── simulation/  # circuit evaluation, gate library, net model
│   │   ├── storage/     # localStorage wrapper and helpers
│   │   ├── test/        # test setup and builders
│   │   ├── types/       # TypeScript domain types (circuit, collaboration, domain)
│   │   ├── utils/       # misc helpers (id, clipboard, keyboard shortcuts)
│   │   ├── main.tsx
│   │   ├── index.css
│   │   └── vite-env.d.ts
└── docs/                # Gesamte Projektdokumentation
```


