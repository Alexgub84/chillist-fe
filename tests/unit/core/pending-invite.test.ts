import { describe, it, expect, beforeEach } from 'vitest';
import {
  storePendingInvite,
  getPendingInvite,
  clearPendingInvite,
} from '../../../src/core/pending-invite';

describe('pending-invite localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and retrieves a pending invite', () => {
    storePendingInvite('plan-123', 'token-abc');
    const result = getPendingInvite();
    expect(result).toEqual({ planId: 'plan-123', inviteToken: 'token-abc' });
  });

  it('returns null when nothing stored', () => {
    expect(getPendingInvite()).toBeNull();
  });

  it('clears the pending invite', () => {
    storePendingInvite('plan-123', 'token-abc');
    clearPendingInvite();
    expect(getPendingInvite()).toBeNull();
  });

  it('returns null for corrupted data', () => {
    localStorage.setItem('chillist-pending-invite', '{bad json');
    expect(getPendingInvite()).toBeNull();
  });
});
