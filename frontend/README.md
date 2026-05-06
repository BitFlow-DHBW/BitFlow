# BitFlow Logiksimulator

BitFlow ist ein browserbasierter Logiksimulator auf Basis von React, TypeScript und Vite. Die Anwendung enthält Landingpage, Mock-Authentifizierung, Projektverwaltung, Einstellungen und einen SVG-basierten Editor mit Grid, Gates, Wires, Live-Simulation und Undo/Redo.

## Start

```bash
npm install
npm run dev
```

## Struktur

- `src/app/` - App-Routing, geschützte Routen und Workspace-Shell
- `src/modules/landing/` - öffentliche Startseite
- `src/modules/auth/` - Login, Registrierung, Reset, Profil und AuthContext
- `src/modules/projects/` - lokale Projektverwaltung mit Import-Vorbereitung
- `src/modules/editor/` - Editor-Seite und Komponenten wie Canvas, Library, Inspector, SimulationPanel und SignalViewer
- `src/modules/settings/` - Preferences und Dark Mode
- `src/services/` - Mock-/LocalStorage-Services und vorbereiteter REST-Client
- `src/simulation/` - Gate-Bibliothek, Grid-Utilities und boolesche Simulation
- `src/storage/` - LocalStorage-Adapter
- `src/types/` - zentrale TypeScript-Datenmodelle
- `src/hooks/` - Snapshot-History für Undo/Redo

## MVP-Funktionen

- Landingpage für Gäste, Projektübersicht für eingeloggte Nutzer
- Mock-Login, Registrierung, Reset-Flow und Profilbearbeitung
- Projekte lokal speichern, laden, löschen und importieren
- SVG-Canvas mit sichtbarem Raster und Grid-Snapping
- Gates: Input, Output, AND, OR, NOT
- Drag & Drop, Wire-Erstellung mit Vorschau, schaltbare Inputs
- Live-Simulation boolescher Signale
- Undo/Redo-Snapshots
- Custom-Component-Dialog mit vorbereiteter Wahrheitstabelle
- Settings mit funktionierendem Dark Mode

Die Services sind bewusst von der UI getrennt, damit später ein ASP.NET Core Backend mit Authentifizierung, Projekten und SQLite angebunden werden kann.
