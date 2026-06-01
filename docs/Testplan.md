**Dokumentversion:** 1.2
**Stand:** 2026-06-01
**Status:** Aktualisiert auf den aktuellen Projektstand

# BitFlow Testplan

## Revision History

| Datum | Version | Beschreibung | Autor |
| --- | --- | --- | --- |
| 28.04.2026 | 1.0 | Initialer Testplan für Woche 4 / aktuelle Testiteration | BitFlow-Team |
| 05.05.2026 | 1.1 | Korrektur: „Installation Testing“ entfernt | BitFlow-Team |
| 01.06.2026 | 1.2 | Abgleich mit aktuellem Codebestand: Vitest, xUnit, Backend, SQLite, SignalR-Kollaboration und Coverage-Ziele | BitFlow-Team |

## 1. Introduction

### 1.1 Purpose

Dieser Testplan beschreibt die Qualitätssicherung für **BitFlow** auf Basis des aktuellen Repository-Stands. Ziel ist es, die vorhandenen automatisierten Tests, die manuell zu prüfenden Bereiche und die offenen Testrisiken nachvollziehbar zu dokumentieren.

### 1.2 Background

BitFlow ist eine browserbasierte Anwendung zur Erstellung, Simulation, Speicherung und gemeinsamen Bearbeitung digitaler Logikschaltungen. Das Frontend wird mit **React 19**, **TypeScript** und **Vite/Rolldown-Vite** entwickelt. Das Backend ist eine **ASP.NET Core 8 Web API** mit **Entity Framework Core 8** und **SQLite**. Live-Kollaboration erfolgt über **SignalR**.

Der aktuelle Stand enthält unter anderem:

- Projektverwaltung mit Backend-Persistenz
- Registrierung, Login, Logout, Profilbearbeitung und Passwortprüfseite
- SVG-basierter Editor mit Grid, Drag & Drop, Mehrfachauswahl und Leitungen
- Undo/Redo, Kopieren/Einfügen, Löschen und Navigationsschutz bei ungespeicherten Änderungen
- Live-Simulation für Standardgatter, Flip-Flops, generische Wahrheitstabellen und Custom Components
- SignalViewer und SimulationPanel für aktuelle 0/1-Zustände
- Erstellung eigener Bausteine aus der aktuellen Schaltung
- Import eigener Bausteine aus anderen Projekten
- frei positionierbare bzw. andockbare Editor-Panels
- Live-Kollaboration per SignalR-Session mit Einladungslink und Cursorupdates
- Docker-Deployment mit Nginx-Frontend, ASP.NET-Core-Backend und SQLite-Volume

### 1.3 Scope

Der Testplan umfasst:

- Frontend-Unit-, Komponenten- und Integrationstests mit Vitest
- Backend-Unit-Tests mit xUnit
- Service-Tests für API-Kommunikation, LocalStorage, Auth und Kollaboration
- manuelle Smoke- und Exploratory-Tests für vollständige Browser-Workflows
- spätere Erweiterungen für Last-, Security- und End-to-End-Tests

Nicht vollständig abgedeckt sind aktuell:

- automatisierte End-to-End-Tests im echten Browser
- vollständige Cross-Browser-Matrix
- Last- und Stresstests für große Kollaborationssessions
- automatisierte Security-Tests gegen laufende API-Endpunkte
- echter Passwort-Reset inklusive Mailversand

### 1.4 Project Identification

| Artefakt | Vorhanden | Review | Hinweise |
| --- | --- | --- | --- |
| Software Requirements Specification | Ja | Ja | Enthält Use Cases und Implementierungsstand |
| Use-Case Descriptions | Ja | Ja | UC-09 und UC-12 separat dokumentiert |
| Software Architecture Document | Ja | Ja | Enthält Backend, SQLite und SignalR |
| Architecture Significant Requirements | Ja | Ja | Enthält aktuelle Qualitätsziele |
| Frontend Prototype | Ja | Ja | React + TypeScript + Vite |
| Backend Prototype | Ja | Ja | ASP.NET Core 8 + EF Core + SQLite |
| Test Environment | Ja | Ja | Vitest/jsdom, Testing Library, xUnit |
| Deployment-Konfiguration | Ja | Teilweise | Dockerfiles, docker-compose, Nginx |

## 2. Requirements for Test

| ID | Testziel | Beschreibung | Priorität |
| --- | --- | --- | --- |
| RT-01 | Authentifizierung | Registrierung, Login, Logout, Session-Handling und Protected Routes prüfen. | Hoch |
| RT-02 | Projektverwaltung | Projekte erstellen, laden, speichern und löschen. | Hoch |
| RT-03 | SQLite-/API-Persistenz | Backend-Services validieren Projektbesitz, JSON-Payloads und Update-Zeitpunkte. | Hoch |
| RT-04 | Editor-Interaktion | Gates platzieren, verschieben, auswählen, löschen und kopieren/einfügen. | Hoch |
| RT-05 | Verbindungen | Pins, Leitungen, Zwischenpunkte und ungültige Verbindungen prüfen. | Hoch |
| RT-06 | Simulation | Standardgatter, Flip-Flops, generische Gatter und Custom Components korrekt auswerten. | Hoch |
| RT-07 | Custom Components | Bausteine aus Schaltung erzeugen und aus anderen Projekten importieren. | Hoch |
| RT-08 | Undo/Redo | Snapshot-History für Bearbeitungen prüfen. | Mittel |
| RT-09 | UI-Panels | Panel-Dock, FloatingPanel, PanelLauncher und Reset prüfen. | Mittel |
| RT-10 | Präferenzen | Dark Mode und Tastenkürzel über LocalStorage prüfen. | Mittel |
| RT-11 | Kollaboration | SignalR-Client, Session-State, Merge-Logik und CollaborationSessionStore prüfen. | Hoch |
| RT-12 | Navigation Guard | Ungespeicherte Änderungen vor Navigation abfangen. | Mittel |
| RT-13 | Deployment Smoke | Container-Konfiguration, `/api/health`, Nginx-Proxy für `/api` und `/hubs`. | Mittel |
| RT-14 | Security | Zugriff nur auf eigene Projekte und gültige Sessions. | Hoch |

## 3. Test Strategy

### 3.1 Automatisierte Tests

Frontend-Tests laufen mit:

```bash
npm test
```

Coverage läuft mit:

```bash
npm run test:coverage
```

Das Frontend enthält aktuell 49 Testdateien. Die Vitest-Konfiguration nutzt `jsdom`, Testing Library und V8-Coverage. Die Coverage-Schwellen sind im Frontend auf 80 % für Lines, Functions und Statements gesetzt.

Backend-Tests laufen über xUnit. Aktuell existiert ein Backend-Testfile für den `CollaborationSessionStore`, das Session-Erstellung, Beitritt, Verlassen, Session-Ende sowie Circuit- und Cursorupdates abdeckt.

### 3.2 Manuelle Tests

Manuelle Tests ergänzen Bereiche, die im echten Browser schwerer automatisch abzubilden sind:

- Drag & Drop auf dem SVG-Canvas
- tatsächliche Bedienbarkeit der Toolbar
- mehrere Browserfenster für Live-Kollaboration
- visuelle Prüfung von Dark Mode und Panel-Layout
- Docker-Start und Healthcheck
- produktionsnahes Speichern/Laden über Backend und SQLite-Volume

### 3.3 Security and Access Control Testing

Zu prüfen sind:

- API-Zugriffe ohne Token werden abgelehnt.
- Nutzer sehen und ändern nur eigene Projekte.
- Sessions laufen nach Ablaufzeit serverseitig aus.
- Projekt- und Komponentenzugriffe verwenden Owner-ID plus Objekt-ID.
- Fehlerantworten geben keine sensiblen Details preis.

### 3.4 Performance, Load and Stress Testing

Aktuell sind Performance-Tests überwiegend manuell bzw. geplant. Relevante Szenarien:

- Schaltungen mit 50, 100 und 200 Gates
- viele Leitungen und Zwischenpunkte
- große Wahrheitstabellen für generische Gatter
- schnelle Undo/Redo-Serien
- mehrere Teilnehmer in einer SignalR-Session

## 4. Tools

| Tool | Typ | Status | Zweck |
| --- | --- | --- | --- |
| Vitest | Test Runner | vorhanden | Frontend-Unit-, Komponenten- und Integrationstests |
| Testing Library | Test Utility | vorhanden | React-Komponententests |
| jsdom | Testumgebung | vorhanden | DOM-ähnliche Umgebung |
| V8 Coverage | Coverage | vorhanden | Frontend-Testabdeckung |
| xUnit | .NET Test Framework | vorhanden | Backend-Unit-Tests |
| Microsoft.NET.Test.Sdk | Test SDK | vorhanden | Ausführung von .NET-Tests |
| ESLint | Linting | vorhanden | statische Codeprüfung |
| Docker / docker-compose | Deployment | vorhanden | lokaler/prod-naher Smoke-Test |
| Swagger | API-Dokumentation | Development | manuelle API-Prüfung |
| GitHub / YouTrack | Projektmanagement | vorhanden | Issues, Pull Requests, Aufgaben |

## 5. Resources

| Rolle | Empfohlen | Verantwortung |
| --- | ---: | --- |
| Test Manager | 1 | Testplan pflegen, Risiken zusammenführen |
| Test Designer | 1-2 | Testfälle ableiten und priorisieren |
| Entwickler / Tester | alle anteilig | Tests schreiben, ausführen und Fehler beheben |
| Scrum Master | 1 | Fortschritt und Hindernisse verfolgen |
| Product Owner | 1 | Prioritäten aus Nutzersicht bewerten |

| Ressource | Name / Typ |
| --- | --- |
| Client Test PC | Entwickler-Notebook oder PC |
| Betriebssystem | Windows, macOS oder Linux |
| Browser | Chrome, Firefox, Edge, Safari |
| Frontend Runtime | Node.js, npm, Vite |
| Backend Runtime | .NET 8 |
| Datenbank | SQLite-Datei lokal oder Docker-Volume |
| Repository | GitHub Repository BitFlow |

## 6. Deliverables

### 6.1 Test Model

- Testplan als Markdown-Datei
- Vitest-Konfiguration in `frontend/vite.config.ts`
- Frontend-Testdateien in `frontend/src/**/*.test.ts(x)`
- Backend-Testprojekt `backend/BitFlow.API.Tests`
- manuelle Smoke-Testnotizen für Browser- und Docker-Läufe

### 6.2 Test Logs

Testergebnisse werden über Konsolenausgaben der Testtools und über Git-Commits nachvollzogen. Coverage-Berichte werden im Frontend unter `frontend/coverage` erzeugt.

### 6.3 Defect Reports

Fehler werden im Team über GitHub Issues, YouTrack oder Pull-Request-Kommentare dokumentiert. Ein Defect Report sollte Beschreibung, Reproduktionsschritte, erwartetes und tatsächliches Verhalten, betroffene Funktion, Screenshot/Log und Priorität enthalten.

## 7. Offene Testrisiken

- Kein automatisierter Browser-End-to-End-Test für den kompletten Projektlebenszyklus.
- Passwort-Reset ist funktional noch unvollständig und braucht bei Ausbau neue Tests.
- Projekt-Dateiimport/-export ist im Frontend nicht umgesetzt und darf nicht als getestet gelten.
- SignalR-Kollaboration ist im Unit-Bereich gut abdeckbar, benötigt aber zusätzliche manuelle Mehrfenster-Tests.
- Performance-Grenzen großer Schaltungen sind noch nicht automatisiert gemessen.
