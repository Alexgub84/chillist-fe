import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildInviteLink,
  copyInviteLink,
  shareInviteLink,
} from '../../../src/core/invite';

const PLAN_ID = '00000000-0000-0000-0000-000000000001';
const INVITE_TOKEN = 'a'.repeat(64);

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('buildInviteLink', () => {
  it('returns a link using window.location.origin', () => {
    const link = buildInviteLink(PLAN_ID, INVITE_TOKEN);
    expect(link).toBe(
      `http://localhost:3000/invite/${PLAN_ID}/${INVITE_TOKEN}`
    );
  });
});

describe('copyInviteLink', () => {
  it('writes the invite link to clipboard and returns true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const result = await copyInviteLink(PLAN_ID, INVITE_TOKEN);

    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalledWith(
      `http://localhost:3000/invite/${PLAN_ID}/${INVITE_TOKEN}`
    );
  });

  it('returns false when clipboard write fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.assign(navigator, { clipboard: { writeText } });

    const result = await copyInviteLink(PLAN_ID, INVITE_TOKEN);
    expect(result).toBe(false);
  });
});

describe('shareInviteLink', () => {
  it('uses navigator.share when available and returns shared', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { share });

    const result = await shareInviteLink(PLAN_ID, INVITE_TOKEN, 'Beach Trip');

    expect(result).toBe('shared');
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `http://localhost:3000/invite/${PLAN_ID}/${INVITE_TOKEN}`,
      })
    );
  });

  it('falls back to clipboard when navigator.share is not available', async () => {
    Object.assign(navigator, { share: undefined });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const result = await shareInviteLink(PLAN_ID, INVITE_TOKEN, 'Beach Trip');

    expect(result).toBe('copied');
    expect(writeText).toHaveBeenCalled();
  });

  it('returns failed when user dismisses share dialog (AbortError)', async () => {
    const abort = new Error('User cancelled');
    abort.name = 'AbortError';
    const share = vi.fn().mockRejectedValue(abort);
    Object.assign(navigator, { share });

    const result = await shareInviteLink(PLAN_ID, INVITE_TOKEN, 'Beach Trip');

    expect(result).toBe('failed');
  });

  it('falls back to clipboard when navigator.share throws a non-abort error', async () => {
    const share = vi.fn().mockRejectedValue(new Error('Not supported'));
    Object.assign(navigator, { share });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const result = await shareInviteLink(PLAN_ID, INVITE_TOKEN, 'Beach Trip');

    expect(result).toBe('copied');
  });

  it('returns failed when both share and clipboard fail', async () => {
    Object.assign(navigator, { share: undefined });
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.assign(navigator, { clipboard: { writeText } });

    const result = await shareInviteLink(PLAN_ID, INVITE_TOKEN, 'Beach Trip');

    expect(result).toBe('failed');
  });
});
