**Dokumentversion:** 1.1
**Stand:** 2026-06-01
**Status:** Aktualisiert auf den aktuellen Projektstand

### Architecture Significant Requirements (ASR)

### Architekturentscheidungen & Entwurfsmuster

## **Schritt 1 - Klärung & Formulierung der Qualitätsattribute (6-Part-Form)**

### **1. Performance - Echtzeitsimulation**

#### **Szenario P1 (Echtzeit-Reaktion im Editor - 6-Part Form)**

1. **Stimulusquelle:** Benutzer
2. **Stimulus:** Startet eine Simulation oder ändert Inputs
3. **Artefakt:** Simulations-Engine
4. **Umgebung:** Normalbetrieb, Schaltung ≤ 100 Bauteile
5. **Reaktion:** System berechnet Logikzustände und aktualisiert UI
6. **Messung:** UI-Aktualisierung innerhalb einer flüssigen Editor-Interaktion; die konkrete Zeitmessung wird über Performance-Tests ergänzt.

**Business Value: Hoch, Technical Risk: Mittel**

---

### **2. Usability - Drag & Drop & Interaktion**

#### **Szenario U1 (Flüssiges Platzieren von Bausteinen)**

1. **Stimulusquelle:** Benutzer
2. **Stimulus:** Drag & Drop Baustein auf Canvas
3. **Artefakt:** Editor-Canvas
4. **Umgebung:** Nutzung im Browser, Editor enthält bereits 50 Elemente
5. **Reaktion:** Baustein folgt Mausbewegung ohne Verzögerung
6. **Messung:** Latenz

**Business Value: Hoch, Technical Risk: Niedrig**

---

### **3. Reliability - Speichern, Navigationsschutz, Undo/Redo**

#### **Szenario R1 (Undo/Redo Stabilität)**

1. **Stimulus:** Benutzer führt Aktionen aus und drückt Undo
2. **Artefakt:** Undo/Redo-Verlauf
3. **Umgebung:** Normalbetrieb
4. **Reaktion:** System stellt Zustand ohne Fehler wieder her
5. **Messung:** Wiederherstellung

#### **Szenario R2 (Ungespeicherte Änderungen beim Verlassen)**

1. **Stimulus:** Benutzer verlässt den Editor mit ungespeicherten Änderungen
2. **Artefakt:** Editor-Zustand und Navigationsschutz
3. **Umgebung:** Normalbetrieb, Projekt wurde über Backend geladen
4. **Reaktion:** System warnt vor Datenverlust und bietet Speichern oder Verlassen ohne Speichern an
5. **Messung:** Warnung erscheint vor Navigation; gespeicherte Projekte werden serverseitig aktualisiert

**Business Value: Mittel-hoch, Technical Risk: Mittel**

---

### **4. Modifiability - Erweiterbarkeit für neue Bausteine**

#### **Szenario M1 (Eigenen Baustein definieren & laden)**

1. **Stimulus:** Entwickler/Benutzer fügt neuen Baustein hinzu
2. **Artefakt:** Komponentenbibliothek
3. **Umgebung:** Design-Time
4. **Reaktion:** Baustein wird aus der aktuellen Schaltung als Wahrheitstabelle erzeugt und der Projektbibliothek hinzugefügt
5. **Messung:** Einbindung Entwicklungsaufwand

**Business Value: Hoch, Technical Risk: Mittel**

---

### **5. Security - Account & Project Data**

#### **Szenario S1 (Login & Zugangsschutz)**

1. **Stimulus:** Benutzer meldet sich mit E-Mail/Passwort an
2. **Umgebung:** Normalbetrieb
3. **Reaktion:** System prüft Authentifizierung, erstellt Session-Token
4. **Messung:** Erfolgreicher Login

#### **Szenario S2 (Unberechtigter Zugriff auf Projekte)**

1. **Stimulus:** Ein nicht authentifizierter Benutzer versucht, Projekt zu laden
2. **Reaktion:** Zugriff wird verweigert
3. **Messung:** 100% der Zugriffsversuche werden blockiert

**Business Value: Hoch, Technical Risk: Niedrig**

---

### **6. Availability - System im Browser nutzbar halten**

#### **Szenario A1 (Simulationsfehler isoliert)**

1. **Stimulus:** Ungültige oder sehr komplexe Schaltung wird simuliert
2. **Artefakt:** Frontend-Simulation (`evaluateCircuit`)
3. **Reaktion:** Simulation arbeitet deterministisch mit begrenzten Iterationen; UI bleibt bedienbar und zeigt weiter den letzten konsistenten Zustand
4. **Messung:** Kein Absturz der Anwendung; weitere Bearbeitung bleibt möglich

#### **Szenario A2 (Live-Kollaboration)**

1. **Stimulus:** Benutzer startet oder betritt eine Zusammenarbeitssession
2. **Artefakt:** SignalR-Hub und CollaborationSessionStore
3. **Reaktion:** Schaltungszustand, Teilnehmerliste und Cursorpositionen werden verteilt
4. **Messung:** Teilnehmer sehen aktualisierte Zustände ohne manuelles Neuladen

## Utility-Tree

| **Quality attribute** | **Refinement**                  | **Quality attribute scenarios (ASRs)**                                                                      | **Business value** | **Technical risk** |
| ------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------ | ------------------ |
| **Performance**     | Simulation-Latenz               | Änderungen in Netzwerken bis 200 Gattern werden in ≤ 50 ms propagiert.                                      | H                  | M                  |
|                     | Rendering                       | UI bleibt bei Interaktionen ≥ 30 FPS, auch bei großen Schaltplänen.                                         | H                  | M                  |
| **Usability**       | Drag & Drop                     | Platzieren von Gattern erfolgt ohne wahrnehmbare Verzögerung.                                               | H                  | L                  |
|                     | Editor-Panels                   | Bibliothek, Inspector, Simulation und Session können angedockt, gelöst und zurückgesetzt werden.            | M                  | M                  |
| **Reliability**     | Absturzsicherheit               | Fehlerhafte Konfigurationen (Loops, Invalid States) führen nicht zu Abstürzen, sondern Warnungen/Hinweisen. | H                  | M                  |
|                     | Speichern                       | Manuelles Speichern schreibt Projekt, Signale, Netze und Custom Components über die Backend-API.            | H                  | M                  |
| **Collaboration**   | Live-Sessions                   | SignalR verteilt Schaltungsstand und Cursorpositionen an eingeladene Teilnehmer.                            | M                  | M                  |
| **Portability**     | Browserkompatibilität           | Läuft ohne Plugins auf Chrome, Firefox, Safari, Edge.                                                       | L                  | L                  |


## Schritt 2 - Taktiken, die BitFlow anwendet

### 2.1 Modifiability-Taktiken
- **Separation of Concerns:** Strikte Trennung von UI, Simulation, Storage und Logik.
- **Abstrakte Interfaces:** Simulation und Storage sind austauschbar.
- **Erweiterbare Bausteinbibliothek:** Benutzerdefinierte Bausteine entstehen aus der aktuellen Schaltung oder werden aus anderen Projekten importiert.
- **Information Hiding:** Interne Logikdetails sind gekapselt.

### 2.2 Performance-Taktiken
- **Batch-Updates:** UI aktualisiert sich gesammelt statt nach jedem Event.
- **Event-getriebene Simulation:** Nur signifikante Signaländerungen triggern Updates.
- **Begrenzte Iterationen:** Die aktuelle In-Browser-Simulation bricht nach einer vom Schaltungsumfang abhängigen Obergrenze ab, um Endlosschleifen zu vermeiden.

### 2.3 Usability-Taktiken
- **Sofortiges Feedback:** Drag & Drop, Echtzeitsimulation, farbliche Leitungszustände.
- **Undo/Redo:** Eigener UndoManager mit Snapshot-Strategie.
- **Eindeutige Fehlermeldungen:** Fehlermeldungen bei der Validierung von unzulässigen Schaltungen (z.B. zwei Outputs führen zur gleichen Leitung).
- **Personalisierbare Oberfläche:** Dark-/Light-Mode.
- **Konfigurierbare Arbeitsfläche:** Editor-Panels können gedockt, frei positioniert und zurückgesetzt werden.

### 2.4 Testability-Taktiken
- **Modulare Architektur:** Jede Klasse hat klaren Zweck (Single Responsibility Principle (SRP) aus SOLID).
- **Mocking über Interfaces:** Speicherung und Simulation können simuliert werden.
- **Deterministische Simulation:** Gleiche Inputs führen zu gleichen Outputs.
- **Interne API-Schichten:** Klare Begrenzung zwischen UI-Schicht und Logikschicht.

### 2.5 Reliability-Taktiken
- **Validierung aller Eingaben:** Schaltungsprüfung vor Simulation.
- **Fehlerbehandlung:** Ungültige Bausteine blockieren nicht die App.
- **Navigationsschutz:** Ungespeicherte Änderungen werden beim Verlassen des Editors abgefangen.

## Schritt 3 - Architekturentscheidungen

### 3.1 Trennung der Kernbereiche
BitFlow folgt einem mehrteiligen Architekturmodell:
- **Frontend/UI:** React-Frontend mit Canvas, Panels, Toolbar, Simulation und Signalviewer.
- **Domain/Simulation:** Schaltungen, Gatter, Leitungen, Netze, Wahrheitstabellen und Custom Components.
- **Backend/API:** ASP.NET Core REST API für Authentifizierung, Projekte und Komponenten.
- **Realtime:** SignalR-Hub für Live-Kollaboration.
- **Storage:** SQLite über Entity Framework Core sowie LocalStorage für Präferenzen und UI-Zustände.
- **Library:** Sammlung vordefinierter und benutzerdefinierter Bausteine.

### 3.2 Nutzung klarer Abstraktionen
- Component → Basisklasse aller Bausteine
- CustomComponent → Benutzerdefinierte Bausteine
- Circuit → Container für Komponenten und Verbindungen
- Simulation → deterministische In-Browser-Auswertung über `evaluateCircuit`
- Storage → Einheitliche Schnittstelle für Speichern & Laden

### 3.3 Custom-Component-Erzeugung
Verantwortlich für:
- Ableitung von Ein- und Ausgangslabels aus `INPUT`-/`OUTPUT`-Gattern
- automatische Erzeugung einer Wahrheitstabelle aus der aktuellen Schaltung
- Speicherung im Projekt und Import aus anderen Projekten

### 3.4 Undo/Redo als separater Service
Verwendet **Zustandssnapshots**, nicht Operations-Listen:
→ stabil, unabhängig von der Länge von Bearbeitungen.

### 3.5 Library als zentrale Registry
Hält Standardbausteine und benutzerdefinierte Bausteine vor.
Erweitert die Anwendung ohne Änderungen an bestehenden Modulen.

### 3.6 Kollaboration über SignalR
Live-Sessions werden über `CollaborationHub` und einen serverseitigen In-Memory-Session-Store koordiniert. Der Host kann speichern; Teilnehmende erhalten laufend Schaltungs- und Cursorupdates.


## 4. Entwurfsmuster

### 4.1 Factory Pattern
Erzeugt Bausteine aus Bibliothek oder benutzerdefinierten Definitionen.
→ Ermöglicht Austausch von Bausteintypen.

### 4.2 Strategy Pattern
Für Simulationen oder Validierungsprozesse.
→ z. B. austauschbare Auswertungs- und Validierungslogik.

### 4.3 Composite Pattern
Benutzerdefinierte Bausteine bestehen aus eigenen Sub-Schaltungen.
→ Ermöglicht strukturelle Wiederverwendung.

### 4.4 Observer Pattern
UI aktualisiert sich, wenn:
- Schaltung sich ändert
- Simulator neue Werte liefert

### 4.5 Repository Pattern
Kapselt:
- Laden & Speichern
- serverseitige Projektdaten
- benutzergebundene Komponenten
- Zugriffsfilter nach Besitzer


## 6. Zusammenfassung
Die Architektur von BitFlow kombiniert klare Module, starke Abstraktionen und bewährte Entwurfsmuster.
Die wichtigsten nichtfunktionalen Anforderungen, **Modifiability, Usability, Performance, Testability, Reliability**, werden durch konkrete Taktiken adressiert.
BitFlow bleibt damit **erweiterbar**, **stabil** und **für Nutzer leicht verständlich**, während Entwickler flexibel neue Features einbauen können.
