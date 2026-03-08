import { toast } from 'sonner';

export function getProfileUrl(username: string): string {
  return `${window.location.origin}/@${username}`;
}

/**
 * Robust share function that always works:
 * 1. Try Web Share API (mobile)
 * 2. Fallback to clipboard
 * 3. Fallback to manual copy via textarea
 */
async function robustShare(data: { title: string; text: string; url: string }, successMsg: string) {
  // Try Web Share API first (mobile browsers)
  if (navigator.share) {
    try {
      await navigator.share(data);
      return; // Success — native share sheet handled it
    } catch (err: any) {
      if (err?.name === 'AbortError') return; // User cancelled
      // Fall through to clipboard
    }
  }

  // Try Clipboard API
  const textToCopy = `${data.text}\n${data.url}`;
  try {
    await navigator.clipboard.writeText(textToCopy);
    toast.success(successMsg);
    return;
  } catch {
    // Clipboard API failed (permissions, insecure context, etc.)
  }

  // Ultimate fallback: textarea trick
  try {
    const textarea = document.createElement('textarea');
    textarea.value = textToCopy;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    toast.success(successMsg);
  } catch {
    toast.error('Could not copy link');
  }
}

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

  await robustShare(
    { title: `${displayName} — Directly`, text: shareText, url },
    successMsg
  );
}

export async function shareAnalysisText(
  analysis: { type: string; description: string; traits: string[]; advice: string },
  profileUrl: string,
  successMsg = 'Copied! Share it on your Story ✨'
) {
  const text = `✨ ${analysis.type}\n${analysis.description}\n\n${analysis.traits.join(' · ')}\n\n💡 ${analysis.advice}`;
  await robustShare(
    { title: 'My Communication Pattern — Directly', text, url: profileUrl },
    successMsg
  );
}

export async function copyUsername(username: string, successMsg = 'Username copied') {
  try {
    await navigator.clipboard.writeText(`@${username}`);
    toast.success(successMsg);
  } catch {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = `@${username}`;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    toast.success(successMsg);
  }
}
