import { toast } from 'sonner';

export function getProfileUrl(username: string): string {
  return `${window.location.origin}/@${username}`;
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
  try {
    if (navigator.share) {
      await navigator.share({ title: `${displayName} — Directly`, text: shareText, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(successMsg);
    }
  } catch { /* cancelled */ }
}

export async function copyUsername(username: string, successMsg = 'Username copied') {
  await navigator.clipboard.writeText(`@${username}`);
  toast.success(successMsg);
}
