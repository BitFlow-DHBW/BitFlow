[![Build and Deploy](https://github.com/BitFlow-DHBW/BitFlow/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/BitFlow-DHBW/BitFlow/actions/workflows/main.yml)
[![Test-Coverage](https://coveralls.io/repos/github/BitFlow-DHBW/BitFlow/badge.svg?branch=main)](https://coveralls.io/github/BitFlow-DHBW/BitFlow?branch=main)

[Webseite](https://bitflow.ddns.net/)

# BitFlow

Browserbasierter Logikgatter-Simulator mit speicherbaren Schaltnetzen, Simulationsmodus und Erstellen eigener Bausteine

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

## Dokumentation

| Dokument | Pfad |
|---|---|
| Software Requirements Specification | [`docs/use-cases/software-requirement-specification.md`](docs/use-cases/software-requirement-specification.md) |
| Software Architecture Document (SAD) | [`docs/RUP SAD.md`](<docs/RUP SAD.md>) |
| Testplan | [`docs/Testplan.md`](docs/Testplan.md) |
| Mockups | [`docs/mockups/`](docs/mockups/) |
| Use Cases UC1–UC10 | [`docs/rup_srs_ucrss/`](docs/rup_srs_ucrss/) |
| Handout | [`docs/BitFlow-Handout.pdf`](docs/BitFlow-Handout.pdf) |

## Team

| Person | Hauptbeitrag |
|---|---|
| Florian Blum | Demo-Vorbereitung, Wochenaufgaben |
| Moritz Czekalski | Kabel-Programmierung |
| Simon Just | Dokumentation, Blogbeiträge & Kommentare |
| Mohid Syed | Gatter-Programmierung |