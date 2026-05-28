export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back to the textarea path for restricted browser contexts.
    }
  }

  return copyWithHiddenTextarea(text);
}

function copyWithHiddenTextarea(text: string): boolean {
  if (!document.body || typeof document.execCommand !== 'function') return false;

  const selection = document.getSelection();
  const selectedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none;';

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand('copy');
  } finally {
    textarea.remove();
    if (selection && selectedRange) {
      selection.removeAllRanges();
      selection.addRange(selectedRange);
    }
  }
}
