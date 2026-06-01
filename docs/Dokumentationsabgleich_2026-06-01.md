**Dokumentversion:** 1.0
**Stand:** 2026-06-01
**Status:** Neu erstellt
**Autor:** BitFlow-Team

# Dokumentationsabgleich zum aktuellen Projektstand

## Ziel des Abgleichs

Die Projektmanagement-Dokumentation unter `docs/` wurde mit dem aktuellen Codebestand abgeglichen. Berücksichtigt wurden insbesondere Frontend, Backend, Datenmodell, Tests, Deployment, Live-Kollaboration und der tatsächliche Workflow für benutzerdefinierte Bausteine.

## Herangezogene Projektquellen

- `frontend/package.json`
- `frontend/vite.config.ts`
- `frontend/src/app/App.tsx`
- `frontend/src/modules/editor/pages/EditorPage.tsx`
- `frontend/src/simulation/*`
- `frontend/src/services/*`
- `backend/BitFlow.API/Program.cs`
- `backend/BitFlow.API/Controllers/*`
- `backend/BitFlow.API/Services/*`
- `backend/BitFlow.API/Data/BitFlowDbContext.cs`
- `backend/BitFlow.API.Tests/*`
- `Dockerfile`, `backend/BitFlow.API/Dockerfile`, `docker-compose.yml`, `nginx.conf`

## Zentrale Feststellungen

| Bereich | Alter Dokumentationsstand | Aktueller Projektstand |
| --- | --- | --- |
| Frontend-Tests | Jest | Vitest mit Testing Library, jsdom und V8-Coverage |
| Backend | teils noch als geplant/optional beschrieben | ASP.NET Core 8 Web API ist vorhanden |
| Datenbank | teils geplant oder allgemein beschrieben | SQLite über EF Core 8 mit `Users`, `Sessions`, `Projects`, `Components` |
| Deployment | GitHub Pages oder allgemein geplant | Nginx-Frontend-Container, ASP.NET-Core-Backend-Container, Docker-Compose mit Volume |
| Simulation | teils WebWorker/WASM beschrieben | aktuell In-Browser-Simulation über `evaluateCircuit` |
| Autosave | als umgesetzt/geplant mit festen Intervallen beschrieben | aktuell manuelles Speichern plus Navigationsschutz |
| Custom Components | Compiler/Baustein-Editor beschrieben | aktuelle Schaltung wird als Wahrheitstabelle in einen Baustein überführt |
| Import/Export | Projekt-Dateiimport/-export beschrieben | kompletter Projektimport/-export ist nicht umgesetzt; vorhanden ist Custom-Component-Import aus anderen Projekten |
| Kollaboration | nicht dokumentiert | SignalR-Live-Sessions mit Einladungslink, Teilnehmern und Cursorupdates |
| Passwort-Reset | Reset-Link/Mailversand beschrieben | aktuell nur E-Mail-Prüfung über API |

## Geänderte Dateien

### `docs/Architecture Significant Requirements (ASR).md`

- Versionskopf ergänzt.
- Reliability von Autosave auf manuelles Speichern und Navigationsschutz aktualisiert.
- WebWorker-Annahmen durch aktuelle In-Browser-Simulation mit begrenzten Iterationen ersetzt.
- Live-Kollaboration als architekturrelevantes Szenario ergänzt.
- Custom-Component-Erzeugung von „Compiler“ auf Wahrheitstabellenerzeugung angepasst.
- Storage-Beschreibung auf SQLite, EF Core und LocalStorage-Präferenzen aktualisiert.

### `docs/use_cases/software_requirements_specification.md`

- Versionskopf ergänzt.
- Scope, Tech-Stack und Testwerkzeuge aktualisiert.
- Implementierungsstand-Tabelle für alle Use Cases ergänzt.
- Use Cases angepasst, die im Code anders gelöst sind:
  - Dark Mode nur für angemeldete Nutzer und über LocalStorage-Präferenzen.
  - Projekt löschen über Backend/SQLite.
  - Custom Components aus der gesamten aktuellen Schaltung und Wahrheitstabelle.
  - Projekt-Dateiimport/-export als nicht umgesetzt markiert.
  - Signalviewer als aktuelle Pin-Zustände statt Waveform-Verlauf.
  - Löschen auch für Leitungen und Kommentare.
  - Speichern über `PUT /api/projects/{id}`.
  - Logout über Bearer-Session statt Cookies.
  - Account löschen als Backend-vorhanden, UI-nicht-angebunden.
  - Passwort-Reset als E-Mail-Prüfung statt Mailversand.
- UC-21 für Live-Kollaboration neu ergänzt.
- GitHub-Links auf `BitFlow-DHBW/BitFlow` aktualisiert.

### `docs/rup_srs_ucrss/3.1.9 UC-09 – Benutzerdefinierte Logikbausteine erstellen.md`

- Versionskopf ergänzt.
- Beschreibung auf aktuellen Dialog- und Factory-Workflow geändert.
- Compiler-Begriffe entfernt und durch `CustomComponentFactory` und Wahrheitstabellen ersetzt.
- Persistenz über Projekt-Save und Backend-API ergänzt.

### `docs/rup_srs_ucrss/3.1.12 UC-12 – Baustein löschen.md`

- Versionskopf ergänzt.
- Ablauf auf tatsächliche Editor-Funktion erweitert: Löschen per `Entf`, `Backspace` oder Toolbar.
- Leitungen und Kommentare als löschbare Elemente ergänzt.
- Undo/Redo-Anforderung präzisiert.

### `docs/RUP SAD.md`

- Versionskopf und neue Revision History ergänzt.
- Backend von optional/geplant auf aktiv vorhandene ASP.NET-Core-API aktualisiert.
- SQLite, EF Core, REST-Controller, Services, Repositories und SignalR ergänzt.
- WebWorker/Autosave-Aussagen auf aktuellen Stand korrigiert.
- Logical View, Process View, Deployment View, Implementation View und Data View angepasst.
- Live-Kollaboration als eigener Architekturteil dokumentiert.

### `docs/Datenbankdesign.md`

- Versionskopf ergänzt und Stand auf 2026-06-01 gesetzt.
- Hinweis ergänzt, dass Live-Kollaborationssessions nicht in SQLite persistiert werden, sondern im `CollaborationSessionStore` liegen.

### `docs/Testplan.md`

- Dokument vollständig auf aktuellen Teststand gebracht.
- Jest durch Vitest ersetzt.
- Backend- und xUnit-Tests ergänzt.
- Aktuelle Testziele für Auth, Projekte, SQLite/API, Editor, Simulation, Custom Components, Panels und Kollaboration dokumentiert.
- Offene Risiken für E2E, Passwort-Reset, Projektimport/-export, Kollaboration und Performance ergänzt.

### `docs/Klassendiagramm/Komponentendiagramm.mmd`

- Versionskommentare ergänzt.
- Diagramm auf aktuelle Frontend-/Backend-/Deployment-Komponenten aktualisiert.
- SignalR, SQLite, Nginx, Services, Hooks und Simulation ergänzt.

### `docs/Klassendiagramm/Backend UML Diagramm.mmd`

- Versionskommentare ergänzt.
- Diagramm auf aktuelle Controller, Services, Repositories, Models, `BitFlowDbContext` und `CollaborationHub` aktualisiert.
- Veraltete Import-/Export-Methoden entfernt.

## Noch offene Dokumentationspunkte

- Die Mockup-Bilder wurden nicht verändert, da sie als historische UI-Referenzen in `docs/mockups/` liegen.
- Ein vollständiger Projekt-Dateiimport/-export sollte erst wieder als umgesetzt dokumentiert werden, wenn es dafür Code im Frontend gibt.
- Ein echter Passwort-Reset mit Mailversand und Passwortänderung ist noch nicht implementiert und sollte bei Umsetzung in SRS, Testplan und Backend-Doku nachgezogen werden.
- Automatisierte Browser-End-to-End-Tests und Performance-Messungen sind noch offen.

## Ergebnis

Die Markdown- und Mermaid-Projektmanagementdateien in `docs/` sind nun versioniert und auf den aktuellen Codebestand angepasst. Die größten fachlichen Änderungen betreffen Backend/Persistenz, Vitest statt Jest, SignalR-Kollaboration, manuelles Speichern statt Autosave und den tatsächlichen Custom-Component-Workflow.
