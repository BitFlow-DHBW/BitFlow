import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PreferencesProvider, usePreferences } from './PreferencesContext';

function PreferencesHarness() {
  const { preferences, setPreferences, toggleTheme } = usePreferences();

  return (
    <div>
      <output aria-label="theme">{preferences.theme}</output>
      <output aria-label="compact">{String(preferences.compactPanels)}</output>
      <button type="button" onClick={toggleTheme}>
        theme
      </button>
      <button type="button" onClick={() => setPreferences({ ...preferences, compactPanels: !preferences.compactPanels })}>
        compact
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

    await user.click(screen.getByRole('button', { name: 'compact' }));
    expect(screen.getByLabelText('compact')).toHaveTextContent('true');
    expect(JSON.parse(window.localStorage.getItem('bitflow.preferences') ?? '{}')).toMatchObject({
      theme: 'dark',
      compactPanels: true,
    });
  });

  it('throws a clear error outside the provider', () => {
    function BrokenConsumer() {
      usePreferences();
      return null;
    }

    expect(() => render(<BrokenConsumer />)).toThrow('usePreferences must be used inside PreferencesProvider');
  });
});
