import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PreferencesProvider, usePreferences } from './PreferencesContext';

function PreferencesHarness() {
  const { preferences, setPreferences, toggleTheme } = usePreferences();

  return (
    <div>
      <output aria-label="theme">{preferences.theme}</output>
      <output aria-label="editShortcut">{preferences.shortcuts.editMode}</output>
      <button type="button" onClick={toggleTheme}>
        theme
      </button>
      <button
        type="button"
        onClick={() =>
          setPreferences({
            ...preferences,
            shortcuts: { ...preferences.shortcuts, editMode: 'Ctrl+E' },
          })
        }
      >
        shortcut
      </button>
    </div>
  );
}

describe('PreferencesContext', () => {
  it('loads defaults, persists updates and writes the html theme', async () => {
    const user = userEvent.setup();
    render(
      <PreferencesProvider>
        <PreferencesHarness />
      </PreferencesProvider>,
    );

    expect(screen.getByLabelText('theme')).toHaveTextContent('light');
    expect(document.documentElement.dataset.theme).toBe('light');

    await user.click(screen.getByRole('button', { name: 'theme' }));
    expect(screen.getByLabelText('theme')).toHaveTextContent('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'shortcut' }));
    expect(screen.getByLabelText('editShortcut')).toHaveTextContent('Ctrl+E');

    const stored = JSON.parse(window.localStorage.getItem('bitflow.preferences') ?? '{}');
    expect(stored).toMatchObject({
      theme: 'dark',
      shortcuts: expect.objectContaining({ editMode: 'Ctrl+E' }),
    });
    expect(stored).not.toHaveProperty('compactPanels');
    expect(stored).not.toHaveProperty('showSignalValues');
  });

  it('throws a clear error outside the provider', () => {
    function BrokenConsumer() {
      usePreferences();
      return null;
    }

    expect(() => render(<BrokenConsumer />)).toThrow('usePreferences must be used inside PreferencesProvider');
  });
});
