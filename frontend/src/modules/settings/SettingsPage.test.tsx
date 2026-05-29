import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PreferencesProvider } from './PreferencesContext';
import { SettingsPage } from './SettingsPage';

describe('SettingsPage', () => {
  it('updates theme and shortcut preferences', async () => {
    const user = userEvent.setup();

    render(
      <PreferencesProvider>
        <SettingsPage />
      </PreferencesProvider>,
    );

    const themeToggle = screen.getByRole('button');
    await user.click(themeToggle);
    expect(themeToggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('Kompakte Panels')).not.toBeInTheDocument();
    expect(screen.queryByText('Signalwerte anzeigen')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Bearbeiten-Modus'));
    await user.keyboard('{Control>}m{/Control}');

    const stored = JSON.parse(window.localStorage.getItem('bitflow.preferences') ?? '{}');
    expect(stored).toMatchObject({
      theme: 'dark',
      shortcuts: expect.objectContaining({ editMode: 'Ctrl+M' }),
    });
    expect(stored).not.toHaveProperty('compactPanels');
    expect(stored).not.toHaveProperty('showSignalValues');
  });
});
