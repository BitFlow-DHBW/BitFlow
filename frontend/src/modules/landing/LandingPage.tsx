import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <Link className="landing-brand" to="/">
          <span className="brand-mark">BF</span>
          <span>BitFlow</span>
        </Link>
        <div className="landing-nav-actions">
          <Link to="/login">Anmelden</Link>
          <Link className="primary-link" to="/register">
            Registrieren
          </Link>
        </div>
      </nav>

      <section className="hero-section">
        <svg className="hero-circuit" viewBox="0 0 1280 720" aria-hidden="true">
          <defs>
            <pattern id="hero-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.16" />
            </pattern>
          </defs>
          <rect width="1280" height="720" fill="url(#hero-grid)" />
          <path className="hero-wire is-live" d="M180 210 H420 V308 H620" />
          <path className="hero-wire" d="M180 430 H420 V350 H620" />
          <path className="hero-wire is-live" d="M740 330 H980 V258 H1090" />
          <path className="hero-wire" d="M740 330 H980 V454 H1090" />
          <rect className="hero-node" x="104" y="178" width="96" height="64" rx="8" />
          <rect className="hero-node" x="104" y="398" width="96" height="64" rx="8" />
          <rect className="hero-gate" x="620" y="282" width="132" height="96" rx="18" />
          <rect className="hero-node output" x="1090" y="226" width="96" height="64" rx="8" />
          <rect className="hero-node" x="1090" y="422" width="96" height="64" rx="8" />
        </svg>

        <div className="hero-content">
          <p className="eyebrow">Browserbasierter Logiksimulator</p>
          <h1>BitFlow</h1>
          <p className="hero-copy">
            Entwirf digitale Schaltungen, simuliere Signale live und verwalte deine Projekte in einer modernen
            Weboberfläche.
          </p>
          <div className="hero-actions">
            <Link className="primary-link large" to="/register">
              Kostenlos starten
            </Link>
            <Link className="secondary-link large" to="/login">
              Anmelden
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-band">
        <div>
          <p className="eyebrow">Funktionen</p>
          <h2>Schaltungen direkt im Browser entwerfen, testen und organisieren.</h2>
        </div>
        <div className="feature-grid">
          <article>
            <h3>Visueller Editor</h3>
            <p>Platziere Logikbausteine, verbinde Pins präzise im Raster und behalte auch größere Schaltungen im Blick.</p>
          </article>
          <article>
            <h3>Live-Simulation</h3>
            <p>Schalte Eingänge um und prüfe Signalzustände direkt im Editor, ohne den Arbeitsfluss zu unterbrechen.</p>
          </article>
          <article>
            <h3>Projektverwaltung</h3>
            <p>Organisiere deine Schaltungen als Projekte und öffne sie jederzeit wieder zur weiteren Bearbeitung.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
