import type { ItemCategory, ItemStatus, Unit } from '../schemas/item';

export const CATEGORY_OPTIONS: {
  value: ItemCategory;
  labelKey: string;
}[] = [
  { value: 'food', labelKey: 'categories.food' },
  { value: 'equipment', labelKey: 'categories.equipment' },
];

export const STATUS_OPTIONS: {
  value: ItemStatus;
  labelKey: string;
  bg: string;
  text: string;
}[] = [
  {
    value: 'pending',
    labelKey: 'itemStatus.pending',
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
  },
  {
    value: 'purchased',
    labelKey: 'itemStatus.purchased',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
  },
  {
    value: 'packed',
    labelKey: 'itemStatus.packed',
    bg: 'bg-green-100',
    text: 'text-green-800',
  },
  {
    value: 'canceled',
    labelKey: 'itemStatus.canceled',
    bg: 'bg-gray-100',
    text: 'text-gray-500',
  },
];

export const UNIT_OPTIONS: { value: Unit; labelKey: string }[] = [
  { value: 'kg', labelKey: 'units.kg' },
  { value: 'g', labelKey: 'units.g' },
  { value: 'lb', labelKey: 'units.lb' },
  { value: 'oz', labelKey: 'units.oz' },
  { value: 'l', labelKey: 'units.l' },
  { value: 'ml', labelKey: 'units.ml' },
  { value: 'm', labelKey: 'units.m' },
  { value: 'cm', labelKey: 'units.cm' },
  { value: 'pcs', labelKey: 'units.pcs' },
  { value: 'pack', labelKey: 'units.pack' },
  { value: 'set', labelKey: 'units.set' },
];

export type UnitGroup = {
  groupLabelKey: string;
  options: { value: Unit; labelKey: string }[];
};

export const UNIT_GROUPS: UnitGroup[] = [
  {
    groupLabelKey: 'unitGroups.weight',
    options: [
      { value: 'kg', labelKey: 'units.kg' },
      { value: 'g', labelKey: 'units.g' },
      { value: 'lb', labelKey: 'units.lb' },
      { value: 'oz', labelKey: 'units.oz' },
    ],
  },
  {
    groupLabelKey: 'unitGroups.volume',
    options: [
      { value: 'l', labelKey: 'units.l' },
      { value: 'ml', labelKey: 'units.ml' },
    ],
  },
  {
    groupLabelKey: 'unitGroups.length',
    options: [
      { value: 'm', labelKey: 'units.m' },
      { value: 'cm', labelKey: 'units.cm' },
    ],
  },
  {
    groupLabelKey: 'unitGroups.count',
    options: [
      { value: 'pcs', labelKey: 'units.pcs' },
      { value: 'pack', labelKey: 'units.pack' },
      { value: 'set', labelKey: 'units.set' },
    ],
  },
];
