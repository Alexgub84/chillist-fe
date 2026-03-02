import i18n from '../i18n';

export function buildInviteLink(planId: string, inviteToken: string): string {
  return `${window.location.origin}/invite/${planId}/${inviteToken}`;
}

export async function copyInviteLink(
  planId: string,
  inviteToken: string
): Promise<boolean> {
  const link = buildInviteLink(planId, inviteToken);
  try {
    await navigator.clipboard.writeText(link);
    return true;
  } catch (err) {
    console.warn(
      `[Invite] Clipboard write failed for planId="${planId}". Error: ${err instanceof Error ? err.message : String(err)}`
    );
    return false;
  }
}

export async function shareInviteLink(
  planId: string,
  inviteToken: string,
  planTitle: string
): Promise<'shared' | 'copied' | 'failed'> {
  const link = buildInviteLink(planId, inviteToken);

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: i18n.t('invite.shareTitle'),
        text: i18n.t('invite.shareText', { title: planTitle }),
        url: link,
      });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'failed';
    }
  }

  const copied = await copyInviteLink(planId, inviteToken);
  return copied ? 'copied' : 'failed';
}

export async function copyPlanUrl(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch (err) {
    console.warn(
      `[Invite] Copy plan URL failed. Error: ${err instanceof Error ? err.message : String(err)}`
    );
    return false;
  }
}

export async function sharePlanUrl(
  planTitle: string
): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: i18n.t('invite.shareTitle'),
        text: i18n.t('invite.shareText', { title: planTitle }),
        url: window.location.href,
      });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'failed';
    }
  }
  const copied = await copyPlanUrl();
  return copied ? 'copied' : 'failed';
}
