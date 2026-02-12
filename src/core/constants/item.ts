import type { ItemCategory, ItemStatus, Unit } from '../schemas/item';

export const CATEGORY_OPTIONS: { value: ItemCategory; label: string }[] = [
  { value: 'food', label: 'Food' },
  { value: 'equipment', label: 'Equipment' },
];

export const STATUS_OPTIONS: {
  value: ItemStatus;
  label: string;
  bg: string;
  text: string;
}[] = [
  {
    value: 'pending',
    label: 'Pending',
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
  },
  {
    value: 'purchased',
    label: 'Purchased',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
  },
  {
    value: 'packed',
    label: 'Packed',
    bg: 'bg-green-100',
    text: 'text-green-800',
  },
  {
    value: 'canceled',
    label: 'Canceled',
    bg: 'bg-gray-100',
    text: 'text-gray-500',
  },
];

export const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'lb', label: 'lb' },
  { value: 'oz', label: 'oz' },
  { value: 'l', label: 'l' },
  { value: 'ml', label: 'ml' },
  { value: 'pcs', label: 'pcs' },
  { value: 'pack', label: 'pack' },
  { value: 'set', label: 'set' },
];
