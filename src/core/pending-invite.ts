const STORAGE_KEY = 'chillist-pending-invite';

interface PendingInvite {
  planId: string;
  inviteToken: string;
}

export function storePendingInvite(planId: string, inviteToken: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ planId, inviteToken }));
  } catch {
    /* quota exceeded or unavailable */
  }
}

export function getPendingInvite(): PendingInvite | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingInvite;
    if (parsed.planId && parsed.inviteToken) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function clearPendingInvite(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* unavailable */
  }
}
