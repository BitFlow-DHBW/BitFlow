import { usePreferences } from './PreferencesContext';
import { normalizeKeyboardEvent } from '../../utils/keyboardShortcuts';

interface ShortcutFieldProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}

function ShortcutField({ label, description, value, onChange }: ShortcutFieldProps) {
  return (
    <div className="setting-row shortcut-row">
      <div>
        <h2>{label}</h2>
        <p>{description}</p>
      </div>
      <input
        className="shortcut-input"
        value={value}
        readOnly
        aria-label={label}
        onKeyDown={(event) => {
          event.preventDefault();
          const shortcut = normalizeKeyboardEvent(event.nativeEvent);
          if (shortcut) onChange(shortcut);
        }}
        onFocus={(event) => event.currentTarget.select()}
      />
    </div>
  );
}

export function SettingsPage() {
  const { preferences, setPreferences, toggleTheme } = usePreferences();
  const updateShortcut = (key: keyof typeof preferences.shortcuts, value: string) => {
    setPreferences({
      ...preferences,
      shortcuts: {
        ...preferences.shortcuts,
        [key]: value,
      },
    });
  };

  return (
    <main className="page-shell narrow-page">
      <section className="page-header">
        <p className="eyebrow">Einstellungen</p>
        <h1>Arbeitsplatz-Präferenzen</h1>
      </section>

      <section className="settings-panel">
        <div className="setting-row">
          <div>
            <h2>Dunkler Modus</h2>
            <p>Wechselt die komplette Oberfläche zwischen hellem und dunklem Design.</p>
          </div>
          <button className="toggle-button" type="button" aria-pressed={preferences.theme === 'dark'} onClick={toggleTheme}>
            <span />
          </button>
        </div>

        <div className="setting-row">
          <div>
            <h2>Signalwerte anzeigen</h2>
            <p>Zeigt Live-Signale in Panels und auf Pins sichtbar an.</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.showSignalValues}
            onChange={(event) => setPreferences({ ...preferences, showSignalValues: event.target.checked })}
          />
        </div>
      </section>

      <section className="settings-panel">
        <div className="panel-heading">
          <p className="eyebrow">Tastatur</p>
          <h2>Tastenkürzel</h2>
        </div>

        <ShortcutField
          label="Bearbeiten-Modus"
          description="Wechselt in den Modus zum Bearbeiten, Platzieren und Verdrahten."
          value={preferences.shortcuts.editMode}
          onChange={(value) => updateShortcut('editMode', value)}
        />
        <ShortcutField
          label="Simulationsmodus"
          description="Wechselt in den Modus, in dem Eingänge geschaltet werden können."
          value={preferences.shortcuts.simulateMode}
          onChange={(value) => updateShortcut('simulateMode', value)}
        />
        <ShortcutField
          label="Auswahl löschen"
          description="Löscht den ausgewählten Baustein oder die ausgewählte Verbindung."
          value={preferences.shortcuts.deleteSelection}
          onChange={(value) => updateShortcut('deleteSelection', value)}
        />
      </section>
    </main>
  );
}
