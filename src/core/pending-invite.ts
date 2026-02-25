const STORAGE_KEY = 'chillist-pending-invite';

interface PendingInvite {
  planId: string;
  inviteToken: string;
}

export function storePendingInvite(planId: string, inviteToken: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ planId, inviteToken }));
    console.info(
      `[PendingInvite] Stored pending invite — planId="${planId}", token="${inviteToken.slice(0, 8)}…"`
    );
  } catch (err) {
    console.warn(
      `[PendingInvite] Failed to store pending invite (localStorage unavailable or quota exceeded). planId="${planId}". Error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export function getPendingInvite(): PendingInvite | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      console.debug('[PendingInvite] No pending invite found in localStorage.');
      return null;
    }
    const parsed = JSON.parse(raw) as PendingInvite;
    if (parsed.planId && parsed.inviteToken) {
      console.info(
        `[PendingInvite] Retrieved pending invite — planId="${parsed.planId}", token="${parsed.inviteToken.slice(0, 8)}…"`
      );
      return parsed;
    }
    console.warn(
      `[PendingInvite] Found localStorage entry but missing planId or inviteToken. Raw: ${raw}`
    );
    return null;
  } catch (err) {
    console.warn(
      `[PendingInvite] Failed to read pending invite from localStorage. Error: ${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
}

export function clearPendingInvite(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.info('[PendingInvite] Cleared pending invite from localStorage.');
  } catch (err) {
    console.warn(
      `[PendingInvite] Failed to clear pending invite from localStorage. Error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
