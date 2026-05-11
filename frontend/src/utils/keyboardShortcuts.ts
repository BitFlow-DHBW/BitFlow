type KeyboardLikeEvent = Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'key' | 'metaKey' | 'shiftKey'>;

const ignoredKeys = new Set(['Alt', 'Control', 'Meta', 'Shift']);

export function normalizeKeyboardEvent(event: KeyboardLikeEvent): string {
  if (ignoredKeys.has(event.key)) return '';

  const modifiers = [
    event.ctrlKey ? 'Ctrl' : '',
    event.altKey ? 'Alt' : '',
    event.shiftKey ? 'Shift' : '',
    event.metaKey ? 'Meta' : '',
  ].filter(Boolean);

  let key = event.key;
  if (key === ' ') key = 'Space';
  else if (key.length === 1) key = key.toUpperCase();
  else key = key[0].toUpperCase() + key.slice(1);

  return [...modifiers, key].join('+');
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable;
}

export function shortcutMatches(event: KeyboardLikeEvent, shortcut: string): boolean {
  return normalizeKeyboardEvent(event) === shortcut;
}
