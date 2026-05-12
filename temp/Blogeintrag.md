# BitFlow Testzusammenfassung

Stand: 12.05.2026
Branch: `v2-tests`

## Zusammenfassung

Für BitFlow wurde eine automatisierte Frontend-Test-Suite mit Vitest, Testing Library und jsdom eingerichtet. Der Fokus folgt dem Testplan aus `docs/Testplan.md`: Logiksimulation, Grid-Snapping, Wire-/Netzmodell, LocalStorage, Auth-/Projektfunktionen, Undo/Redo, zentrale UI-Komponenten, Smoke-Tests und typische Editor-Workflows.

Finaler Lauf:

```text
npm test
Test Files: 32 passed
Tests:      92 passed
```

Finale Coverage:

| Metrik | Coverage |
|---|---:|
| Lines | 85.06% |
| Statements | 81.98% |
| Functions | 84.14% |
| Branches | 69.11% |

Die geforderte Coverage über 80% ist für Lines, Statements und Functions erreicht. Branch Coverage liegt darunter, hauptsächlich wegen der vielen alternativen SVG-, Drag-and-Drop- und Editor-Interaktionspfade.

## Coverage nach Test-Typ

| Test-Typ | Automatisierte Abdeckung | Inhalt |
|---|---:|---|
| Unit Tests | 98.35% Lines | Simulation, Gate-Library, Netze/Wires, Services, Storage, Utils, Hooks, SVG-Helfer |
| Komponenten-/UI-Tests | 84.73% Lines | Editor-Komponenten wie Canvas, Library, Inspector, Toolbar, SignalViewer, SimulationPanel, CustomComponentDialog |
| Smoke-/Routing-Tests | 80.00% Lines | App-Start, geschützte Routen, Navigation Shell |
| Gesamt-Coverage | 85.06% Lines | Gesamter berücksichtigter Frontend-Code ohne Entry-Points, Types und generierte Dateien |

## Geprüfte Features

- Grid-Snapping und Pin-Positionen
- Gate-Erstellung, konfigurierbare Pins und Custom Gates
- Simulation von INPUT/OUTPUT, AND, OR, XOR, NOT, GENERIC, VCC/GND und Flip-Flops
- Signalweitergabe über Wires und Netze inklusive Labels
- LocalStorage-Lesen, -Schreiben, ungültige Daten und Löschen
- Auth: Registrierung, Login, Logout, Reset-Flow und Profiländerung
- Projektverwaltung: Erstellen, Listen, Laden, Aktualisieren, Löschen und Custom Components
- Preferences und Shortcuts
- Undo/Redo-History
- UI-Smoke-Tests für Landing, Projekte, Settings, Auth-Seiten, AppShell und Editor
- Editor-Workflow: Baustein platzieren, Net-Label/Kommentar setzen, Custom Component erzeugen, speichern, Leitung löschen

## Bewertung

Die Tests prüfen überwiegend beobachtbares Verhalten statt interne Implementierungsdetails. Sinnvoll sind sie besonders an den Stellen, die laut Testplan risikoreich sind: Simulation, Signalweitergabe, Persistenz und zentrale Arbeitsabläufe im Editor.

Offene Rest-Risiken bleiben bei sehr feinen SVG-Pointer-Interaktionen, vollständiger Drag-and-Drop-Matrix und Backend/API/Security-Tests. Diese Bereiche sind laut Testplan teilweise später vorgesehen oder im aktuellen Prototyp nur begrenzt automatisierbar.
