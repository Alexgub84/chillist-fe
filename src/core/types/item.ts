export type ItemCategory = 'equipment' | 'food';

export type ItemStatus = 'pending' | 'purchased' | 'packed' | 'canceled';

export type Unit =
  | 'pcs'
  | 'kg'
  | 'g'
  | 'lb'
  | 'oz'
  | 'l'
  | 'ml'
  | 'pack'
  | 'set';

export interface BaseItem {
  itemId: string;
  planId: string;
  name: string;
  quantity: number;
  unit: Unit;
  notes?: string;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentItem extends BaseItem {
  category: 'equipment';
}

export interface FoodItem extends BaseItem {
  category: 'food';
}

export type Item = EquipmentItem | FoodItem;
