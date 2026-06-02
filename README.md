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

## Projektstruktur

```
BitFlow/
├── backend/               # Node/Express API
│   ├── BitFlow.API        # API Code
│   └── BitFlow.API.Tests  # API Tests
├── frontend/
│   ├── src/
│   │   ├── app/           # App Hülle, Routing, Authentifizierung
│   │   ├── assets/        # Icon
│   │   ├── components/    # geteilte UI Komponenten
│   │   ├── hooks/         # React Hooks (Zusammenarbeit, Undu/Redo)
│   │   ├── modules/       # Feature-Module: auth, editor, landing, projects, settings
│   │   ├── schematic/     # SVG
│   │   ├── services/      # API Layer & Domain-Service
│   │   ├── simulation/    # Logik, Gatter-Bibliothek
│   │   ├── storage/       # localStorage
│   │   ├── test/          # Test Setup & Builder
│   │   ├── types/         # TypeScript Domain-Typen (circuit, collaboration, domain)
│   │   ├── utils/         # Helper (id, clipboard, keyboard shortcuts)
│   │   ├── main.tsx
│   │   ├── index.css
│   │   └── vite-env.d.ts
└── docs/                  # Gesamte Projektdokumentation
```


