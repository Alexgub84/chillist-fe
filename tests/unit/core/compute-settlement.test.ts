import { describe, it, expect } from 'vitest';
import { computeSettlement } from '../../../src/core/compute-settlement';

describe('computeSettlement', () => {
  it('returns empty result for no participants', () => {
    const result = computeSettlement([], new Map(), 0);
    expect(result.fairShare).toBe(0);
    expect(result.balances).toEqual([]);
    expect(result.transfers).toEqual([]);
  });

  it('returns empty result for zero grand total', () => {
    const result = computeSettlement(['p1', 'p2'], new Map(), 0);
    expect(result.fairShare).toBe(0);
    expect(result.balances).toEqual([]);
    expect(result.transfers).toEqual([]);
  });

  it('returns no transfers when all paid equally', () => {
    const ids = ['p1', 'p2', 'p3'];
    const map = new Map([
      ['p1', 30],
      ['p2', 30],
      ['p3', 30],
    ]);
    const result = computeSettlement(ids, map, 90);

    expect(result.fairShare).toBe(30);
    expect(result.transfers).toEqual([]);
    for (const b of result.balances) {
      expect(b.balance).toBeCloseTo(0);
    }
  });

  it('computes correct balances for uneven split', () => {
    const ids = ['alice', 'bob', 'charlie'];
    const map = new Map([
      ['alice', 90],
      ['bob', 0],
    ]);
    const result = computeSettlement(ids, map, 90);

    expect(result.fairShare).toBe(30);

    const aliceBalance = result.balances.find(
      (b) => b.participantId === 'alice'
    );
    expect(aliceBalance?.balance).toBeCloseTo(60);
    expect(aliceBalance?.paid).toBe(90);

    const bobBalance = result.balances.find((b) => b.participantId === 'bob');
    expect(bobBalance?.balance).toBeCloseTo(-30);
    expect(bobBalance?.paid).toBe(0);

    const charlieBalance = result.balances.find(
      (b) => b.participantId === 'charlie'
    );
    expect(charlieBalance?.balance).toBeCloseTo(-30);
    expect(charlieBalance?.paid).toBe(0);
  });

  it('computes minimum transfers for simple case', () => {
    const ids = ['alice', 'bob'];
    const map = new Map([['alice', 100]]);
    const result = computeSettlement(ids, map, 100);

    expect(result.transfers).toHaveLength(1);
    expect(result.transfers[0]).toEqual({
      from: 'bob',
      to: 'alice',
      amount: 50,
    });
  });

  it('computes transfers for 3-person split where one paid everything', () => {
    const ids = ['alice', 'bob', 'charlie'];
    const map = new Map([['alice', 120]]);
    const result = computeSettlement(ids, map, 120);

    expect(result.fairShare).toBe(40);
    expect(result.transfers).toHaveLength(2);

    const totalTransferred = result.transfers.reduce(
      (sum, tr) => sum + tr.amount,
      0
    );
    expect(totalTransferred).toBeCloseTo(80);

    for (const tr of result.transfers) {
      expect(tr.to).toBe('alice');
    }
  });

  it('handles participants with no expenses in the summary map', () => {
    const ids = ['p1', 'p2', 'p3'];
    const map = new Map([['p1', 60]]);
    const result = computeSettlement(ids, map, 60);

    expect(result.fairShare).toBe(20);

    const p2 = result.balances.find((b) => b.participantId === 'p2');
    expect(p2?.paid).toBe(0);
    expect(p2?.balance).toBeCloseTo(-20);
  });

  it('rounds transfer amounts to 2 decimal places', () => {
    const ids = ['p1', 'p2', 'p3'];
    const map = new Map([['p1', 100]]);
    const result = computeSettlement(ids, map, 100);

    for (const tr of result.transfers) {
      const decimals = tr.amount.toString().split('.')[1];
      expect(!decimals || decimals.length <= 2).toBe(true);
    }
  });

  it('computes correct settlement for multi-payer scenario', () => {
    const ids = ['a', 'b', 'c', 'd'];
    const map = new Map([
      ['a', 40],
      ['b', 60],
    ]);
    const result = computeSettlement(ids, map, 100);

    expect(result.fairShare).toBe(25);

    const aBalance = result.balances.find((b) => b.participantId === 'a');
    expect(aBalance?.balance).toBeCloseTo(15);

    const bBalance = result.balances.find((b) => b.participantId === 'b');
    expect(bBalance?.balance).toBeCloseTo(35);

    const totalOwed = result.transfers.reduce((sum, tr) => sum + tr.amount, 0);
    expect(totalOwed).toBeCloseTo(50);
  });
});
