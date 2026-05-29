import { describe, expect, it } from 'vitest';
import { defaultPreferences, preferencesService } from './preferencesService';

describe('preferencesService', () => {
  it('returns default preferences when nothing is stored', () => {
    expect(preferencesService.getPreferences()).toEqual(defaultPreferences);
  });

  it('merges partial stored preferences with current defaults', () => {
    window.localStorage.setItem(
      'bitflow.preferences',
      JSON.stringify({
        theme: 'dark',
        compactPanels: true,
        showSignalValues: false,
        shortcuts: {
          simulateMode: 'Ctrl+S',
        },
      }),
    );

    expect(preferencesService.getPreferences()).toEqual({
      ...defaultPreferences,
      theme: 'dark',
      shortcuts: {
        ...defaultPreferences.shortcuts,
        simulateMode: 'Ctrl+S',
      },
    });
    expect(preferencesService.getPreferences()).not.toHaveProperty('compactPanels');
    expect(preferencesService.getPreferences()).not.toHaveProperty('showSignalValues');
  });

  it('persists complete preference objects', () => {
    preferencesService.savePreferences({ ...defaultPreferences, theme: 'dark' });

    expect(JSON.parse(window.localStorage.getItem('bitflow.preferences') ?? '{}')).toMatchObject({
      theme: 'dark',
    });
    expect(JSON.parse(window.localStorage.getItem('bitflow.preferences') ?? '{}')).not.toHaveProperty('compactPanels');
    expect(JSON.parse(window.localStorage.getItem('bitflow.preferences') ?? '{}')).not.toHaveProperty('showSignalValues');
  });
});
