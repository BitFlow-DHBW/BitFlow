import { describe, expect, it, vi } from 'vitest';
import { copyTextToClipboard } from './clipboard';

function setClipboard(value: Clipboard | undefined) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value,
  });
}

function setExecCommand(value: Document['execCommand'] | undefined) {
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value,
  });
}

describe('copyTextToClipboard', () => {
  it('uses the Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const execCommand = vi.fn();
    setClipboard({ writeText } as unknown as Clipboard);
    setExecCommand(execCommand);

    await expect(copyTextToClipboard('invite-link')).resolves.toBe(true);

    expect(writeText).toHaveBeenCalledWith('invite-link');
    expect(execCommand).not.toHaveBeenCalled();
  });

  it('falls back to a hidden textarea when Clipboard API writing fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    const execCommand = vi.fn().mockReturnValue(true);
    setClipboard({ writeText } as unknown as Clipboard);
    setExecCommand(execCommand);

    await expect(copyTextToClipboard('fallback-link')).resolves.toBe(true);

    expect(writeText).toHaveBeenCalledWith('fallback-link');
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).not.toBeInTheDocument();
  });

  it('returns false when no copy mechanism is available', async () => {
    setClipboard(undefined);
    setExecCommand(undefined);

    await expect(copyTextToClipboard('unavailable')).resolves.toBe(false);
  });
});
