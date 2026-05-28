import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PreferencesProvider } from './PreferencesContext';
import { SettingsPage } from './SettingsPage';

describe('SettingsPage', () => {
  it('updates theme, panel density, signal display and shortcut preferences', async () => {
    const user = userEvent.setup();

    render(
      <PreferencesProvider>
        <SettingsPage />
      </PreferencesProvider>,
    );

    const themeToggle = screen.getByRole('button');
    await user.click(themeToggle);
    expect(themeToggle).toHaveAttribute('aria-pressed', 'true');

    const [compactPanels, showSignalValues] = screen.getAllByRole('checkbox');
    await user.click(compactPanels);
    await user.click(showSignalValues);
    await user.click(screen.getByLabelText('Bearbeiten-Modus'));
    await user.keyboard('{Control>}m{/Control}');

    const stored = JSON.parse(window.localStorage.getItem('bitflow.preferences') ?? '{}');
    expect(stored).toMatchObject({
      theme: 'dark',
      compactPanels: true,
      showSignalValues: false,
      shortcuts: expect.objectContaining({ editMode: 'Ctrl+M' }),
    });
  });
});
