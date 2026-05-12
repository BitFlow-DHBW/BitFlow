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
  });

  it('persists complete preference objects', () => {
    preferencesService.savePreferences({ ...defaultPreferences, compactPanels: true });

    expect(JSON.parse(window.localStorage.getItem('bitflow.preferences') ?? '{}')).toMatchObject({
      compactPanels: true,
    });
  });
});
