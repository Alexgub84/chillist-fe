import { describe, expect, it } from 'vitest';
import {
  unitSchema,
  itemCategorySchema,
  itemStatusSchema,
} from '../../../src/core/schemas/item';
import {
  planStatusSchema,
  planVisibilitySchema,
} from '../../../src/core/schemas/plan';
import {
  participantRoleSchema,
  rsvpStatusSchema,
} from '../../../src/core/schemas/participant';
import en from '../../../src/i18n/locales/en.json';
import he from '../../../src/i18n/locales/he.json';

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (
      acc &&
      typeof acc === 'object' &&
      key in (acc as Record<string, unknown>)
    ) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function assertAllTranslated(
  values: readonly string[],
  namespace: string
): void {
  for (const value of values) {
    const key = `${namespace}.${value}`;
    expect(getNestedValue(en, key), `en.json missing "${key}"`).toBeTypeOf(
      'string'
    );
    expect(getNestedValue(he, key), `he.json missing "${key}"`).toBeTypeOf(
      'string'
    );
  }
}

describe('BE enum translation coverage', () => {
  it('every unit has EN + HE translation', () => {
    assertAllTranslated(unitSchema.options, 'units');
  });

  it('every item category has EN + HE translation', () => {
    assertAllTranslated(itemCategorySchema.options, 'categories');
  });

  it('every item status has EN + HE translation', () => {
    assertAllTranslated(itemStatusSchema.options, 'itemStatus');
  });

  it('every plan status has EN + HE translation', () => {
    assertAllTranslated(planStatusSchema.options, 'planStatus');
  });

  it('every plan visibility has EN + HE translation', () => {
    assertAllTranslated(planVisibilitySchema.options, 'planVisibility');
  });

  it('every participant role has EN + HE translation', () => {
    assertAllTranslated(participantRoleSchema.options, 'roles');
  });

  it('every RSVP status has EN + HE translation', () => {
    assertAllTranslated(rsvpStatusSchema.options, 'rsvpStatus');
  });
});
