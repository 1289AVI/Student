/**
 * Generates the clean public URL that anyone can open without a Google / Gmail login.
 */
export function getPublicUrl(): string {
  if (typeof window === 'undefined') {
    return 'https://ais-pre-rimfefuw3dbo2potvvrz6o-853929990344.asia-east1.run.app';
  }

  const hostname = window.location.hostname;
  // If user is viewing in the dev sandbox (ais-dev-...), convert to the public preview (ais-pre-...)
  if (hostname.startsWith('ais-dev-')) {
    const publicHost = hostname.replace('ais-dev-', 'ais-pre-');
    return `${window.location.protocol}//${publicHost}`;
  }

  return window.location.origin;
}

/**
 * Copy text to clipboard with modern navigator.clipboard and textarea fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    // Fallback below
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
