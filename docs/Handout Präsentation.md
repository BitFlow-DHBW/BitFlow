# BitFlow - Handout zur Abschlusspräsentation

**Projekt:** BitFlow  
**Team:** Mohid Syed, Florian Blum, Moritz Czekalski, Simon Just

**Kurzbeschreibung:** BitFlow ist eine browserbasierte React/TypeScript/Vite-Anwendung zum Erstellen, Verbinden, Speichern und Simulieren digitaler Logikschaltungen. Logikgatter werden auf einem SVG-Canvas platziert, per Wire verbunden und lokal im Client simuliert.

**Zielgruppe und Einsatzzweck:** BitFlow richtet sich an Studierende, Lehrkräfte und Technikinteressierte, die digitale Logik visuell und ohne lokale Desktop-Installation nachvollziehen möchten. Die Anwendung eignet sich für Lehre, Übung und schnelle Demonstrationen einfacher bis mittlerer Logikschaltungen.

**Quellen im Repository:** SRS, SAD, ASR, Testplan, Klassendiagramme, Mockups, Demo-Screenshot und GitHub Actions Workflow.

---

## 1. Aufwandsstatistiken

**Datengrundlage:** YouTrack-Personenauswertung

### 1.1 Arbeitsstunden pro Person

Die folgenden Werte stammen aus der YouTrack-Personenauswertung.

| Teammitglied | Arbeitsstunden | Hauptbeitrag |
|---|---:|---|
| Simon Just | 65h 15m | Scrum, Dokumentation, Projektorganisation, Use Cases |
| Mohid Syed | 65h 45m | Product Owner, Frontend, Drag & Drop, Gatter-/Input-Logik |
| Florian Blum | 30h 5m | Canvas, UI, Demo- und Editor-Funktionen |
| Moritz Czekalski | 72h 51m | Wires/Verbindungen, Refactoring, Testing/Metriken |
| **Gesamt** | **233h 56m** |  |

### 1.2 Arbeitsstunden pro Workflow

| Workflow | Dokumentierter Zeitaufwand | Status / Hinweis |
|---|---:|---|
| Requirement Analysis | 21h 5m | Aus der aktuellen CSV nicht eindeutig ableitbar |
| Project Management | 16h 4m | Aus der aktuellen CSV nicht eindeutig ableitbar |
| Architecture & Design | 26h 40m | Aus der aktuellen CSV nicht eindeutig ableitbar |
| Frontend Development | 64h 56m | Aus der aktuellen CSV nicht eindeutig ableitbar |
| Backend Development | 12h 34m | Aus der aktuellen CSV nicht eindeutig ableitbar |
| Testing | 7h 16m | Aus der aktuellen CSV nicht eindeutig ableitbar |
| Documentation | 34h 6m | Aus der aktuellen CSV nicht eindeutig ableitbar |
| Review / Refactoring | 20h 15m | Aus der aktuellen CSV nicht eindeutig ableitbar |
| CI/CD | 11h 19m | Aus der aktuellen CSV nicht eindeutig ableitbar |
| Metriken | 5h 52m | Aus der aktuellen CSV nicht eindeutig ableitbar |
| Präsentation / Demo-Vorbereitung | 13h 49m | Aus der aktuellen CSV nicht eindeutig ableitbar |
| **Gesamtaufwand** | **233h 56m** | Gesamtwert aus `Zeittabelle.csv`; keine Workflow-Aufteilung ableitbar |

### 1.3 Arbeitsstunden pro RUP-Phase


| RUP-Phase | Zeitraum / Zuordnung | Zeitaufwand |
|---|---|---:|
| Inception | 30.09.2025 - 31.10.2025: Vision, Zieldefinition, Projektstart, SRS, erste Use Cases und erste Risikoanalyse | 37h 40m |
| Elaboration | 01.11.2025 - 31.12.2025: Architekturprototyp, SAD/ASR, Klassendiagramme, Mockups und Ausarbeitung zentraler Use Cases | 52h 40m |
| Construction | 01.01.2026 - 30.04.2026: Produktentwicklung und Tests, u. a. Canvas, Gates, Wires, Simulation, Backend, Testing und CI/CD | 49h 15m |
| Transition | 01.05.2026 - 03.06.2026: Stabilisierung, Bugfixes, Review, Abschlussdokumentation, Demo-, Handout- und Präsentationsvorbereitung | 93h 51m |

| **Gesamt** |  | **233h 26m** |

---

## 2. Highlights der Demo

| Demo-Highlight | Kurzbeschreibung | Screenshot / Hinweis |
|---|---|---|
| Benutzerkonto und Projektübersicht | Anmeldung, Startseite und Projektverwaltung zeigen den Einstieg in BitFlow und die grundlegende Nutzerführung außerhalb des Editors. | TODO: Screenshot Anmeldung / Projektübersicht einfügen |
| Editor-Oberfläche | Die Projektansicht zeigt Canvas, Toolbar, Panels und responsive UI-Elemente als zentrale Arbeitsumgebung für Schaltungen. | TODO: Screenshot Editor-UI einfügen |
| Generische Gatter | Logikbausteine können flexibel mit konfigurierbaren Ein- und Ausgängen erstellt und im Editor verwendet werden. | TODO: Screenshot generische Gatter einfügen |
| Custom-Gatter und Import | Eigene Bausteine können aus bestehenden Schaltungen bzw. Definitionen erstellt und wieder importiert oder weiterverwendet werden. | TODO: Screenshot Custom-Gatter / Import einfügen |
| Mehrbenutzer-Modus | Eine kollaborative Session kann erstellt werden; weitere Nutzer treten per Invite-Link bei und sehen Cursor- sowie Schaltungsänderungen live. | TODO: Screenshot Session-Panel / Multiuser einfügen |
| Volladdierer aus Halbaddierern | Als komplexeres Beispiel wird ein Volladdierer aus wiederverwendbaren Halbaddierer-Bausteinen aufgebaut und simuliert. | TODO: Screenshot Volladdierer-Demo einfügen |
| Simulation und Signale | Die Schaltung wird lokal ausgewertet; Signalzustände werden direkt im Editor sichtbar und reagieren auf Änderungen der Eingänge. | TODO: Screenshot Simulation / Signalzustände einfügen |
---

## 3. Highlights des Projekts

### 3.1 Architektur

BitFlow ist als browserbasierte Single Page Application aufgebaut. Das Frontend nutzt React, TypeScript und Vite; der Editor basiert auf einem eigenen SVG-Canvas. Die Schaltungsberechnung bleibt im Client, damit Interaktionen wie Drag & Drop, Input-Toggle und Output-Feedback direkt reagieren.

Das Backend ist ein ASP.NET-Core-Web-API mit SQLite-Persistenz für Nutzer, Projekte, Sessions und benutzerdefinierte Komponenten. Zusätzlich gibt es eine SignalR-basierte Collaboration-Schicht für aktive In-Memory-Sessions. Die Architektur trennt UI, Services, Domain-/Simulationslogik, Storage und Library. Aus SAD/ASR sind besonders Separation of Concerns, Repository Pattern, Factory Pattern, Strategy Pattern, Observer Pattern und Composite Pattern als wichtige Entscheidungen dokumentiert.

### 3.2 Software Tools, Plattformen und Libraries

| Bereich | Technologie / Tool | Einsatz |
|---|---|---|
| Frontend | React, TypeScript, Vite, SVG | Editor, UI-Komponenten, Canvas, Interaktion |
| Backend | C#, ASP.NET Core Web API, .NET 8, EF Core SQLite | REST-API, Authentifizierung, Projekte, Custom Components |
| Realtime | SignalR | Kollaborative Sessions, Teilnehmer, Cursor, Circuit-Updates |
| Testing | SonarQube, Vitest/Jest-Style Tests, Testing Library, xUnit, Postman geplant | Frontend- und Backend-Tests, spätere API-Tests |
| Projektmanagement | Git, GitHub, YouTrack, GitHub Discussions | Versionierung, Aufgaben, Feedback, Projektkommunikation |
| CI/CD | GitHub Actions, Docker, GHCR, Self-hosted Deploy | Build, Tests, Coverage, Images, Test-Deployment, Deployment |

### 3.3 Datenbank Design

Der aktuelle Backend-Code verwendet SQLite über Entity Framework Core. Das Datenmodell umfasst:

| Modell | Zweck / zentrale Daten |
|---|---|
| `User` | Nutzerkonto mit Name, E-Mail, Passwort-Hash und Beziehungen zu Projekten/Komponenten |
| `UserSession` | Authentifizierungs-Session bzw. Token-Zuordnung |
| `Project` | Projekt-Metadaten, Besitzer, serialisierte Schaltung (`CircuitJson`) und Custom Components |
| `Component` | Benutzerdefinierte Komponenten, Besitzer und serialisierte Komponentendaten |
| Collaboration Session | Aktive Multiplayer-Session im In-Memory-Store mit Session-ID, Host, Teilnehmern, Cursorpositionen und aktuellem Circuit |

### 3.4 Testing und Metriken

Der Testplan deckt Unit Tests, Komponenten-/UI-Tests, Smoke-/Routing-Tests sowie spätere API- und Security-Tests ab. Aktuell liegt der Schwerpunkt auf dem Frontend, der Simulation, Canvas-Interaktionen, Services und UI-Komponenten.

| Bereich | Wert / Stand |
|---|---:|
| Lines Coverage | 88.58% |
| Statements Coverage | 83.54% |
| Functions Coverage | 83.18% |
| Branches Coverage | 72.31% |
| Unit-Test-Abdeckung | 98.35% |
| Komponenten-/UI-Test-Abdeckung | 84.73% |
| Smoke-/Routing-Test-Abdeckung | 80.00% |
| Gesamt-Coverage | 85.06% |

Weitere Metriken:

| Metrik | Stand |
|---|---|
| Zyklomatische Komplexität | ESLint-Regel `complexity` mit Grenzwert 10 aktiviert; einzelne komplexere Funktionen werden beobachtet |
| Kognitive Komplexität | SonarQube genutzt; größter Ausreißer liegt bei 66, vor allem durch zentrale Canvas-Logik |
| Response for a Class (RFC) | Eigenes Skript `frontend/scripts/metrics/rfc.cjs`; alle Methoden unter dem Grenzwert 10 |

### 3.6 CI/CD

Die GitHub Actions Pipeline enthält mehrere Stufen:

| Stufe | Inhalt |
|---|---|
| Frontend Test | `npm ci`, Komplexitätscheck, RFC-Metrik, `npm test`, Coverage |
| Backend Test | .NET 8 Setup, Restore, Release-Build, xUnit-Tests |
| Build | Docker-Images für Frontend und Backend |
| Test-Deploy | Lokales Docker-Netzwerk, Start von Frontend/Backend, Health Checks |
| Deploy | Bei Push auf `main`: Images aus GHCR ziehen und Stack auf Self-hosted Runner neu starten |

### 3.7 Worauf wir besonders stolz sind

- Eigener SVG-basierter Canvas ohne große externe Canvas-Bibliothek.
- Interaktive Schaltungsbearbeitung mit Drag & Drop, Grid-Snapping, Pins und Wires.
- Lokale, schnelle Simulation von Logikgattern mit direktem Feedback.
- Saubere Projektstruktur mit Frontend-Modulen, Services, Storage und Simulation.
- Architektur- und Testdokumentation mit SRS, SAD, ASR, Testplan und Diagrammen.
- Erweiterung um Backend-Persistenz und erste SignalR-basierte Collaboration-Sessions.



