import { describe, expect, it } from 'vitest';
import { isEditableTarget, normalizeKeyboardEvent, shortcutMatches } from './keyboardShortcuts';

describe('keyboard shortcut utilities', () => {
  it('normalizes letters, special keys and modifiers consistently', () => {
    expect(normalizeKeyboardEvent({ key: 'e', ctrlKey: false, altKey: false, shiftKey: false, metaKey: false })).toBe('E');
    expect(normalizeKeyboardEvent({ key: ' ', ctrlKey: true, altKey: false, shiftKey: true, metaKey: false })).toBe(
      'Ctrl+Shift+Space',
    );
    expect(normalizeKeyboardEvent({ key: 'delete', ctrlKey: false, altKey: true, shiftKey: false, metaKey: true })).toBe(
      'Alt+Meta+Delete',
    );
    expect(normalizeKeyboardEvent({ key: 'Shift', ctrlKey: false, altKey: false, shiftKey: true, metaKey: false })).toBe('');
  });

  it('detects editable event targets', () => {
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    const select = document.createElement('select');
    const editable = document.createElement('div');
    Object.defineProperty(editable, 'isContentEditable', { value: true });

    expect(isEditableTarget(input)).toBe(true);
    expect(isEditableTarget(textarea)).toBe(true);
    expect(isEditableTarget(select)).toBe(true);
    expect(isEditableTarget(editable)).toBe(true);
    expect(isEditableTarget(document.createElement('button'))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });

  it('matches normalized shortcuts exactly', () => {
    const event = { key: 's', ctrlKey: true, altKey: false, shiftKey: false, metaKey: false };

    expect(shortcutMatches(event, 'Ctrl+S')).toBe(true);
    expect(shortcutMatches(event, 'S')).toBe(false);
  });
});
