import { describe, it, expect } from 'vitest';
import { groupBySubcategory } from '../../../src/core/utils/items';

describe('groupBySubcategory', () => {
  it('groups items by subcategory', () => {
    const items = [
      { id: 'a', subcategory: 'Fresh Vegetables' },
      { id: 'b', subcategory: 'Fresh Vegetables' },
      { id: 'c', subcategory: 'First Aid and Safety' },
    ];
    const result = groupBySubcategory(items);
    expect(result['Fresh Vegetables']).toHaveLength(2);
    expect(result['First Aid and Safety']).toHaveLength(1);
  });

  it('puts items without subcategory under Other', () => {
    const items = [
      { id: 'a', subcategory: null },
      { id: 'b', subcategory: undefined },
    ];
    const result = groupBySubcategory(items);
    expect(result['Other']).toHaveLength(2);
  });

  it('returns empty object for empty input', () => {
    const result = groupBySubcategory([]);
    expect(result).toEqual({});
  });
});
