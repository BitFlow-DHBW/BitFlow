# BitFlow

# Test Plan

**Version 1.1**

---

## Revision History

| Date | Version | Description | Author |
|---|---|---|---|
| 28.04.2026 | 1.0 | Initialer Testplan für Woche 4 / aktuelle Testiteration | BitFlow-Team |
| 05.05.2026 | 1.1 | Korrektur: "Installation Testing" entfernt | BitFlow-Team |

---

## Table of Contents

1. [Introduction](#1-introduction)  
   1.1 [Purpose](#11-purpose)  
   1.2 [Background](#12-background)  
   1.3 [Scope](#13-scope)  
   1.4 [Project Identification](#14-project-identification)  

2. [Requirements for Test](#2-requirements-for-test)  

3. [Test Strategy](#3-test-strategy)  
   3.1 [Testing Types](#31-testing-types)  
   3.1.1 [Data and Database Integrity Testing](#311-data-and-database-integrity-testing)  
   3.1.2 [Function Testing](#312-function-testing)  
   3.1.3 [Business Cycle Testing](#313-business-cycle-testing)  
   3.1.4 [User Interface Testing](#314-user-interface-testing)  
   3.1.5 [Performance Profiling](#315-performance-profiling)  
   3.1.6 [Load Testing](#316-load-testing)  
   3.1.7 [Stress Testing](#317-stress-testing)  
   3.1.8 [Volume Testing](#318-volume-testing)  
   3.1.9 [Security and Access Control Testing](#319-security-and-access-control-testing)  
   3.1.10 [Failover and Recovery Testing](#3110-failover-and-recovery-testing)  
   3.1.11 [Configuration Testing](#3111-configuration-testing)  
   3.2 [Tools](#32-tools)  

4. [Resources](#4-resources)  
   4.1 [Roles](#41-roles)  
   4.2 [System](#42-system)  

5. [Project Milestones](#5-project-milestones)  

6. [Deliverables](#6-deliverables)  
   6.1 [Test Model](#61-test-model)  
   6.2 [Test Logs](#62-test-logs)  
   6.3 [Defect Reports](#63-defect-reports)  

7. [Appendix A: Project Tasks](#7-appendix-a-project-tasks)

# Test Plan

## 1. Introduction

### 1.1 Purpose

Dieser Testplan beschreibt die geplante Qualitätssicherung für **BitFlow** in der aktuellen Iteration.

Der Testplan unterstützt folgende Ziele:

- Festlegen, welche Bestandteile von BitFlow getestet werden.
- Beschreiben, welche Testarten eingesetzt werden.
- Festlegen der Zielwerte für die Testabdeckung.
- Dokumentieren der eingesetzten Testwerkzeuge.
- Beschreiben, wie Testfälle und Testergebnisse nachvollzogen werden.
- Abgrenzen, welche Tests in dieser Iteration noch nicht sinnvoll umgesetzt werden können.

---

### 1.2 Background

BitFlow ist eine browserbasierte Anwendung zur Erstellung und Simulation digitaler Logikschaltungen.  
Die Anwendung wird mit **React**, **TypeScript**, **Vite** und **Tailwind CSS** entwickelt.

Der aktuelle Stand der Anwendung enthält einen SVG-basierten Editor, in dem Logikgatter platziert, verschoben und verbunden werden können. Zusätzlich existiert eine einfache Simulationslogik, mit der Grundschaltungen wie `SWITCH → LED`, `SWITCH + SWITCH → AND → LED` und `SWITCH → NOT → LED` ausgewertet werden können.

Im aktuellen Frontend sind unter anderem folgende Funktionen vorhanden:

- Gate-Library mit Standardgattern
- SVG-Canvas mit Grid
- Drag & Drop von Gates
- Verbindung von Pins über Wires
- SWITCH als schaltbarer Eingang
- LED als sichtbarer Ausgang
- automatische Simulation bei Änderungen
- SignalViewer
- Undo/Redo
- LocalStorage-Speicherung
- JSON Import/Export
- erste Jest-Tests

Ein Backend mit ASP.NET Core und xUnit-Tests ist laut Projektplanung vorgesehen, im aktuellen Codebestand jedoch noch nicht vorhanden. Deshalb konzentriert sich dieser Testplan für die aktuelle Iteration hauptsächlich auf das Frontend.

---

### 1.3 Scope

Dieser Testplan umfasst die Testplanung für den aktuellen BitFlow-Prototypen.

In dieser Iteration werden vor allem folgende Teststufen betrachtet:

- Unit Tests
- Komponententests
- Integrationstests
- Smoke Tests
- erste funktionale Tests

Folgende Funktionen sollen getestet werden:

- Grid-Snapping
- Logiksimulation
- Signalweitergabe zwischen verbundenen Gates
- SWITCH- und LED-Verhalten
- Rendering zentraler UI-Komponenten
- App-Start / Editor-Shell
- Speicherung und Laden über LocalStorage
- Undo/Redo-Logik

Folgende Bereiche werden in dieser Iteration nicht vollständig getestet:

- Backend-API
- xUnit-Backend-Tests
- vollständige Security-Tests
- umfangreiche Last- und Stresstests
- vollständige Cross-Browser-Testmatrix
- produktionsnahe Deployment-Tests

Annahmen:

- Der aktuelle Fokus liegt auf dem Frontend.
- Jest wird als Frontend-Testwerkzeug verwendet.
- xUnit wird erst eingerichtet, wenn Backend-Code vorhanden ist.
- Postman wird später für API-Tests verwendet.
- Die Anwendung befindet sich noch in Entwicklung; Tests werden deshalb schrittweise erweitert.

Risiken:

- Änderungen an der Simulation können bestehende Schaltungen beschädigen.
- UI-Tests können bei häufigen Layoutänderungen schnell angepasst werden müssen.
- Ohne regelmäßige Testausführung können Regressionen unbemerkt bleiben.
- Backend-Tests sind aktuell noch nicht möglich, da kein Backend-Code vorhanden ist.

---

### 1.4 Project Identification

| Document / Artifact | Created or Available | Reviewed | Author or Resource | Notes |
|---|---|---|---|---|
| Software Requirements Specification | Yes | Yes | BitFlow-Team | Enthält Use Cases und Anforderungen |
| Use-Case Descriptions | Yes | Yes | BitFlow-Team | Grundlage für Funktionstests |
| Software Architecture Document | Yes | Yes | BitFlow-Team | Enthält Architekturentscheidungen |
| Architecture Significant Requirements | Yes | Yes | BitFlow-Team | Enthält Qualitätsziele |
| RMMM / Risk Table | Yes | Yes | BitFlow-Team | Enthält Projektrisiken |
| Current Frontend Prototype | Yes | Yes | BitFlow-Team | React + TypeScript + Vite |
| Backend Prototype | No | No | BitFlow-Team | Noch nicht vorhanden |
| Test Environment | Partly | Yes | BitFlow-Team | Jest im Frontend |
| User Manual | No | No | BitFlow-Team | Noch nicht vorhanden |

---

## 2. Requirements for Test

Die folgenden Anforderungen und Funktionen wurden als Testziele identifiziert:

| ID | Requirement for Test | Description | Priority |
|---|---|---|---|
| RT-01 | Grid-Snapping | Gates und Punkte sollen auf das definierte Grid gerundet werden. | Medium |
| RT-02 | Gate Rendering | Gates sollen korrekt im SVG-Canvas dargestellt werden. | Medium |
| RT-03 | Drag & Drop | Gates sollen verschoben werden können. | High |
| RT-04 | Wire Connections | Pins sollen sinnvoll verbunden werden können. | High |
| RT-05 | Connection Validation | Ungültige Verbindungen sollen verhindert werden. | High |
| RT-06 | SWITCH Input | SWITCH soll einen boolean-Wert speichern und ändern können. | High |
| RT-07 | LED Output | LED soll den simulierten Eingangswert sichtbar machen. | High |
| RT-08 | Simulation | Einfache Schaltungen sollen korrekt ausgewertet werden. | High |
| RT-09 | SignalViewer | Signalwerte sollen als `1` oder `0` angezeigt werden. | Medium |
| RT-10 | LocalStorage | Schaltungen sollen lokal gespeichert und geladen werden können. | Medium |
| RT-11 | Undo/Redo | Änderungen sollen rückgängig gemacht und wiederhergestellt werden können. | Medium |
| RT-12 | Import/Export | Schaltungen sollen als JSON importiert/exportiert werden können. | Medium |
| RT-13 | App Smoke Test | Die Anwendung soll ohne Crash starten. | High |
| RT-14 | Backend Tests | Backend soll später mit xUnit getestet werden. | Later |
| RT-15 | API Tests | API soll später mit Postman getestet werden. | Later |
| RT-16 | Security Tests | Zugriffsschutz wird später mit Backend geprüft. | Later |

---

## 3. Test Strategy

Die Teststrategie beschreibt, wie die oben genannten Testanforderungen geprüft werden.  
Der Fokus liegt in dieser Iteration auf automatisierten Frontend-Tests mit Jest und auf der Absicherung der grundlegenden Schaltungslogik.

Die Teststrategie orientiert sich an den Vorlesungsinhalten:

- Unit Testing
- Boundary Condition Testing
- Integration Testing
- Smoke Testing
- spätere System- und Security-Tests

---

## 3.1 Testing Types

### 3.1.1 Data and Database Integrity Testing

**Test Objective:**  
Sicherstellen, dass lokal gespeicherte Schaltungsdaten korrekt gespeichert, geladen, aufgelistet und gelöscht werden.

**Technique:**  

- Testen des `StorageService`.
- Speichern kleiner Circuit-Objekte in `localStorage`.
- Laden der gespeicherten Daten.
- Prüfen, ob gelöschte Projekte nicht mehr geladen werden.
- Prüfen, ob ungültige oder nicht vorhandene Daten sauber behandelt werden.

**Completion Criteria:**  

- Lokales Speichern funktioniert ohne Datenverlust.
- Laden liefert die erwartete Schaltungsstruktur.
- Löschen entfernt den Eintrag aus dem LocalStorage.
- Ungültige Daten führen nicht zum Absturz.

**Special Considerations:**  

- Eine echte Datenbank existiert im aktuellen Stand noch nicht.
- SQLite ist geplant, aber noch nicht im aktiven Code angebunden.
- Deshalb wird in dieser Iteration nur LocalStorage getestet.

---

### 3.1.2 Function Testing

**Test Objective:**  
Sicherstellen, dass die Kernfunktionen von BitFlow korrekt arbeiten.

**Technique:**  

Funktionstests prüfen insbesondere:

- Erstellen von Gates über die Library.
- Verbinden von Ausgängen mit Eingängen.
- Umschalten von SWITCH-Komponenten.
- Anzeigen von LED-Zuständen.
- Simulation einfacher Schaltungen.
- Speichern und Laden von Projekten.
- Undo/Redo von Änderungen.

Die Tests werden teilweise automatisiert mit Jest umgesetzt. Weitere funktionale Abläufe können manuell geprüft werden, solange UI-Interaktion im SVG noch nicht vollständig automatisiert getestet wird.

**Completion Criteria:**  

- Alle geplanten automatisierten Tests laufen erfolgreich.
- Einfache Schaltungen liefern korrekte Signalwerte.
- Die Anwendung startet ohne Fehler.
- Kritische Fehler werden dokumentiert.

**Special Considerations:**  

- Die Anwendung befindet sich noch im Prototyp-Status.
- Nicht alle Use Cases aus der SRS sind bereits implementiert.
- Funktionstests konzentrieren sich deshalb auf die vorhandene Grundlogik.

---

### 3.1.3 Business Cycle Testing

**Test Objective:**  
Prüfen, ob ein typischer Bearbeitungsablauf im Editor grundsätzlich funktioniert.

**Technique:**  

Für BitFlow entspricht ein „Business Cycle“ keinem klassischen Geschäftsprozess, sondern einem typischen Nutzungszyklus:

1. Anwendung öffnen.
2. Gates aus der Library hinzufügen.
3. Gates verbinden.
4. SWITCH-Werte ändern.
5. Simulationsergebnis prüfen.
6. Projekt speichern.
7. Projekt wieder laden.
8. Änderung rückgängig machen oder wiederherstellen.

In dieser Iteration wird dieser Ablauf teilweise manuell und teilweise automatisiert geprüft.

**Completion Criteria:**  

- Der zentrale Arbeitsablauf kann ohne Absturz durchgeführt werden.
- Die simulierten Werte stimmen mit der erwarteten Logik überein.
- Speichern und Laden erhalten die Schaltungsstruktur.

**Special Considerations:**  

- Vollständig automatisierte End-to-End-Tests sind noch nicht eingerichtet.
- Der Fokus liegt zunächst auf stabilen Unit-, Komponenten- und Integrationstests.

---

### 3.1.4 User Interface Testing

**Test Objective:**  
Sicherstellen, dass die wichtigsten UI-Elemente sichtbar und bedienbar sind.

**Technique:**  

Automatisierte UI-Tests prüfen:

- App rendert ohne Crash.
- Toolbar ist sichtbar.
- Gate-Library ist sichtbar.
- SWITCH und LED erscheinen in der Library.
- SignalViewer ist sichtbar.
- GateNode kann SWITCH-Zustand anzeigen.
- GateNode kann LED-Zustand anzeigen.

Manuelle UI-Tests prüfen zusätzlich:

- Drag & Drop auf dem Canvas.
- Verbindung von Pins.
- optische Darstellung der Wires.
- Dark Mode.

**Completion Criteria:**  

- Zentrale UI-Bereiche werden korrekt gerendert.
- SWITCH und LED sind im Editor nutzbar.
- UI-Grundfunktionen blockieren die Anwendung nicht.

**Special Considerations:**  

- SVG- und Pointer-Events sind in automatisierten Tests aufwendiger als normale DOM-Interaktionen.
- Deshalb werden komplexere Canvas-Interaktionen zunächst ergänzend manuell getestet.

---

### 3.1.5 Performance Profiling

**Test Objective:**  
Prüfen, ob die Anwendung bei einfachen und mittleren Schaltungen flüssig bleibt.

**Technique:**  

In dieser Iteration wird Performance noch nicht vollständig automatisiert gemessen.  
Geplant ist eine schrittweise Prüfung mit Beispielschaltungen:

- kleine Schaltungen mit 2–5 Gates
- mittlere Schaltungen mit ca. 20–50 Gates
- spätere Tests mit bis zu ca. 200 Gates gemäß ASR

**Completion Criteria:**  

- Kleine Schaltungen werden ohne spürbare Verzögerung simuliert.
- Die UI bleibt bei typischen Interaktionen bedienbar.
- Performance-Probleme werden dokumentiert.

**Special Considerations:**  

- WebWorker für Simulation ist architektonisch vorgesehen, aber nicht vollständig umgesetzt.
- Genauere Performance-Messungen folgen später.

---

### 3.1.6 Load Testing

**Test Objective:**  
Prüfen, wie sich BitFlow bei steigender Anzahl von Gates und Verbindungen verhält.

**Technique:**  

Load Tests werden in dieser Iteration noch nicht vollständig automatisiert.  
Später sollen Testschaltungen mit zunehmender Größe erzeugt werden:

- 50 Gates
- 100 Gates
- 200 Gates
- viele Verbindungen

**Completion Criteria:**  

- Die Anwendung bleibt bei typischen Projektgrößen bedienbar.
- Simulationsergebnisse bleiben korrekt.
- Grenzen werden dokumentiert.

**Special Considerations:**  

- Aktuell nicht Hauptfokus der Wochenaufgabe.
- Wird später wichtiger, da Performance als technisches Risiko identifiziert wurde.

---

### 3.1.7 Stress Testing

**Test Objective:**  
Ermitteln, unter welchen Bedingungen die Anwendung instabil oder langsam wird.

**Technique:**  

Stress Tests sind für spätere Iterationen vorgesehen. Beispiele:

- sehr viele Gates auf dem Canvas
- viele Verbindungen
- schnelles wiederholtes Simulieren
- viele Undo/Redo-Schritte
- große JSON-Dateien beim Import

**Completion Criteria:**  

- Systemgrenzen sind bekannt.
- Kritische Fehler werden dokumentiert.
- Falls nötig, werden Warnungen oder Begrenzungen eingeführt.

**Special Considerations:**  

- Für diese Woche reicht die Planung und erste manuelle Betrachtung.
- Vollständige Stresstests werden später umgesetzt.

---

### 3.1.8 Volume Testing

**Test Objective:**  
Prüfen, ob BitFlow mit größeren Datenmengen umgehen kann.

**Technique:**  

Später sollen größere Circuit-Objekte getestet werden:

- viele Gates
- viele Connections
- größere JSON-Importe
- mehrere gespeicherte Projekte im LocalStorage

**Completion Criteria:**  

- Große Schaltungen können gespeichert und geladen werden.
- JSON Import/Export bleibt stabil.
- Keine Datenstruktur wird beschädigt.

**Special Considerations:**  

- Aktuell ist keine serverseitige Datenbank aktiv.
- Volume Testing beschränkt sich zunächst auf LocalStorage und JSON-Daten.

---

### 3.1.9 Security and Access Control Testing

**Test Objective:**  
Später sicherstellen, dass Benutzer nur auf eigene Projekte zugreifen können.

**Technique:**  

Security Tests werden erst relevant, sobald Backend, Benutzerverwaltung und Authentifizierung vorhanden sind.

Geplante spätere Tests:

- nicht angemeldete Nutzer dürfen keine geschützten API-Endpunkte nutzen
- angemeldete Nutzer sehen nur eigene Projekte
- ungültige Eingaben werden abgelehnt
- Account-Funktionen sind geschützt

**Completion Criteria:**  

- Zugriffsschutz funktioniert serverseitig.
- Unberechtigte Zugriffe werden verhindert.
- Fehlermeldungen sind kontrolliert.

**Special Considerations:**  

- In dieser Iteration nicht umsetzbar, da kein Backend vorhanden ist.
- Wird im Testplan aufgenommen, weil Security in SRS und Architektur vorgesehen ist.

---

### 3.1.10 Failover and Recovery Testing

**Test Objective:**  
Prüfen, ob BitFlow nach Fehlern oder Datenproblemen stabil weiterverwendet werden kann.

**Technique:**  

Aktuell relevante Recovery-Fälle:

- ungültige JSON-Datei importieren
- defekte LocalStorage-Daten laden
- leere Schaltung simulieren
- Projekt ohne Connections simulieren
- nicht vorhandenes Projekt laden

**Completion Criteria:**  

- Anwendung stürzt nicht ab.
- Fehlerhafte Daten werden erkannt oder ignoriert.
- Nutzer erhält eine verständliche Rückmeldung.

**Special Considerations:**  

- Autosave ist architektonisch vorgesehen, aber noch nicht vollständig umgesetzt.
- Recovery wird später erweitert.

---

### 3.1.11 Configuration Testing

**Test Objective:**  
Prüfen, ob BitFlow in den vorgesehenen Browserumgebungen lauffähig ist.

**Technique:**  

Manuelle Prüfung in aktuellen Browsern:

- Chrome
- Firefox
- Edge

Entwicklungsumgebung:

- Node.js
- npm
- Vite
- React
- TypeScript
- Jest

**Completion Criteria:**  

- App startet lokal.
- Tests laufen lokal.
- Grundfunktionen funktionieren im Browser.

**Special Considerations:**  

- Eine vollständige Browsermatrix ist in dieser Iteration nicht geplant.
- Safari kann später ergänzt werden.


## 3.2 Tools

| Tool | Vendor / Type | Version / Status | Purpose |
|---|---|---|---|
| Jest | Open Source | eingerichtet / geplant im Frontend | Unit-, Komponenten- und Smoke Tests |
| React | Open Source | vorhanden | UI Framework |
| TypeScript | Open Source | vorhanden | Programmiersprache |
| Vite | Open Source | vorhanden | Build und Dev Server |
| jsdom | Open Source | Testumgebung | DOM-ähnliche Testumgebung für Jest |
| Git | Open Source | vorhanden | Versionierung |
| GitHub | Platform | vorhanden | Repository, Pull Requests, Discussions |
| YouTrack | Project Management | vorhanden | Scrum Board / Aufgaben |
| Postman | API Tool | später | API-Tests |
| xUnit | .NET Test Framework | später | Backend-Unit-Tests |
| npm | Package Manager | vorhanden | Scripts und Dependencies |

---

## 4. Resources

### 4.1 Roles

| Human Resource / Role | Minimum Resources Recommended | Responsibilities / Comments |
|---|---:|---|
| Test Manager | 1 | Testplan pflegen, Teststrategie abstimmen, Ergebnisse zusammenführen |
| Test Designer | 1–2 | Testfälle identifizieren, priorisieren und strukturieren |
| Tester | alle Entwickler anteilig | Tests ausführen, Ergebnisse dokumentieren, Fehler melden |
| Implementer | alle Entwickler anteilig | Tests schreiben, Fehler beheben, Code anpassen |
| Scrum Master | 1 | Fortschritt im Sprint verfolgen |
| Product Owner | 1 | Prioritäten aus Nutzersicht bewerten |

---

### 4.2 System

| Resource | Name / Type |
|---|---|
| Client Test PC | Entwickler-Notebook oder PC |
| Operating System | Windows, macOS oder Linux |
| Browser | Chrome, Firefox oder Edge |
| Runtime | Node.js |
| Package Manager | npm |
| Test Repository | GitHub Repository BitFlow |
| Test Development PC | Lokale Entwicklerumgebung mit VS Code oder WebStorm |
| Database Server | aktuell nicht vorhanden |
| Backend Server | aktuell nicht vorhanden |
| API Test Environment | später mit Postman |

---

## 5. Project Milestones

| Milestone Task | Effort | Start Date | End Date |
|---|---:|---|---|
| Plan Test | mittel | 28.04.2026 | 28.04.2026 |
| Design Test | mittel | 28.04.2026 | 28.04.2026 |
| Implement Test Environment | mittel | 28.04.2026 | 29.04.2026 |
| Implement First Tests | mittel | 28.04.2026 | 29.04.2026 |
| Execute Tests | gering | 29.04.2026 | vor nächster Vorlesung |
| Evaluate Test Results | gering | vor nächster Vorlesung | vor nächster Vorlesung |
| Publish Blog Entry | gering | vor nächster Vorlesung | vor nächster Vorlesung |
| Peer Review | gering | vor nächster Vorlesung | vor nächster Vorlesung |

---

## 6. Deliverables

### 6.1 Test Model

Folgende Testartefakte werden erstellt oder gepflegt:

- Testplan als Markdown-Datei
- Jest-Konfiguration
- Testdateien für vorhandene Frontend-Funktionen
- Testfälle für Simulation, Grid und UI-Grundfunktionen
- spätere Erweiterung für API- und Backend-Tests

Aktuelle automatisierte Testbereiche:

- Grid Utilities
- Simulation Engine
- GateNode
- App Smoke Test

---

### 6.2 Test Logs

Testergebnisse werden zunächst über die Konsolenausgabe von Jest dokumentiert.

Ausführung:

~~~bash
npm test
~~~

Optional:

~~~bash
npm run test:coverage
~~~

Nachvollziehbarkeit:

- Testergebnisse sind an den jeweiligen Git-Commit gebunden.
- Änderungen an Tests und Code sind über Git nachvollziehbar.
- Fehlgeschlagene Tests können im jeweiligen Commit oder Pull Request erkannt werden.
- Später können Testlogs zusätzlich über GitHub Actions erzeugt werden.

---

### 6.3 Defect Reports

Fehler werden im Team dokumentiert über:

- GitHub Issues oder YouTrack
- Pull-Request-Kommentare
- GitHub Discussions für größere Projektupdates

Ein Defect Report sollte enthalten:

- kurze Beschreibung
- betroffene Funktion
- Schritte zur Reproduktion
- erwartetes Verhalten
- tatsächliches Verhalten
- Screenshot oder Log, falls sinnvoll
- betroffener Commit oder Branch
- Priorität

---

## 7. Appendix A: Project Tasks

### Plan Test

- Anforderungen aus SRS und aktuellem Codebestand prüfen.
- Testziele festlegen.
- Risiken bewerten.
- Teststrategie definieren.
- Testwerkzeuge auswählen.
- Testplan erstellen und versionieren.

### Design Test

- Sinnvolle Testfälle aus vorhandenen Funktionen ableiten.
- Kritische Bereiche priorisieren.
- Testfälle für Simulation, UI und Storage strukturieren.
- Prüfen, welche Tests automatisiert und welche manuell durchgeführt werden.

### Implement Test

- Jest im Frontend einrichten.
- Testskripte in `package.json` ergänzen.
- Tests für vorhandene Kernfunktionen schreiben.
- Kleine Testdaten für Circuit-Objekte erstellen.
- Keine unnötigen Features nur für Tests bauen.

### Execute Test

- Tests lokal ausführen.
- Ergebnisse prüfen.
- Fehlgeschlagene Tests untersuchen.
- Fehler beheben oder dokumentieren.
- Tests nach Änderungen erneut ausführen.

### Evaluate Test

- Prüfen, ob Kernfunktionen ausreichend abgedeckt sind.
- Testabdeckung bewerten.
- Offene Risiken dokumentieren.
- Entscheiden, welche Tests in der nächsten Iteration ergänzt werden.
- Ergebnisse im Blogeintrag zusammenfassen.
