import { toast } from 'sonner';

export function getProfileUrl(username: string): string {
  return `${window.location.origin}/@${username}`;
}

/**
 * Share via Web Share API (native share sheet on mobile).
 * Falls back to clipboard only if Web Share is unavailable.
 */
async function nativeShare(data: { title: string; text: string; url: string }, successMsg: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (err: any) {
      if (err?.name === 'AbortError') return true; // User cancelled
    }
  }
  return false;
}

/**
 * Copy text to clipboard with fallbacks.
 */
export async function copyToClipboard(text: string, successMsg = 'Copied!'): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMsg);
    return;
  } catch {
    // Clipboard API failed
  }
  // Fallback: textarea trick
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    toast.success(successMsg);
  } catch {
    toast.error('Could not copy');
  }
}

/**
 * Share profile - always opens native share sheet.
 * SEPARATE from copy.
 */
export async function shareProfile(
  displayName: string,
  username: string,
  personalityType?: string,
  successMsg = 'Link copied!'
) {
  const url = getProfileUrl(username);
  const shareText = personalityType
    ? `${displayName} is a "${personalityType}" communicator on Directly ✨`
    : `Check out ${displayName} on Directly`;

  const shared = await nativeShare(
    { title: `${displayName} — Directly`, text: shareText, url },
    successMsg
  );

  // Only copy as fallback if native share is not available
  if (!shared) {
    await copyToClipboard(`${shareText}\n${url}`, successMsg);
  }
}

/**
 * Share analysis text - always opens native share sheet.
 */
export async function shareAnalysisText(
  analysis: { type: string; description: string; traits: string[]; advice: string },
  profileUrl: string,
  successMsg = 'Copied! Share it on your Story ✨'
) {
  const text = `✨ ${analysis.type}\n${analysis.description}\n\n${analysis.traits.join(' · ')}\n\n💡 ${analysis.advice}`;
  const shared = await nativeShare(
    { title: 'My Communication Pattern — Directly', text, url: profileUrl },
    successMsg
  );
  if (!shared) {
    await copyToClipboard(`${text}\n\n${profileUrl}`, successMsg);
  }
}

/**
 * Copy username - clipboard only, no share sheet.
 */
export async function copyUsername(username: string, successMsg = 'Username copied') {
  await copyToClipboard(`@${username}`, successMsg);
}
