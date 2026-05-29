export interface FoodTagDef {
  id: string;
  label: string;
  icon: string;
  category: 'spicy' | 'oily' | 'cold' | 'drink' | 'dairy' | 'sweet' | 'fiber' | 'protein' | 'fast' | 'fermented';
}

export const FOOD_TAGS: FoodTagDef[] = [
  { id: 'spicy', label: '辛辣', icon: '🌶️', category: 'spicy' },
  { id: 'fried', label: '油炸', icon: '🍟', category: 'oily' },
  { id: 'cold', label: '生冷', icon: '🧊', category: 'cold' },
  { id: 'alcohol', label: '酒精', icon: '🍺', category: 'drink' },
  { id: 'coffee', label: '咖啡因', icon: '☕', category: 'drink' },
  { id: 'dairy', label: '乳制品', icon: '🥛', category: 'dairy' },
  { id: 'seafood', label: '海鲜', icon: '🦐', category: 'protein' },
  { id: 'pickled', label: '腌制', icon: '🥒', category: 'fermented' },
  { id: 'sweet', label: '甜食', icon: '🍰', category: 'sweet' },
  { id: 'fruit', label: '水果', icon: '🍎', category: 'fiber' },
  { id: 'veggie', label: '蔬菜', icon: '🥦', category: 'fiber' },
  { id: 'wholegrain', label: '粗粮', icon: '🌾', category: 'fiber' },
  { id: 'meat', label: '红肉', icon: '🥩', category: 'protein' },
  { id: 'fastfood', label: '快餐', icon: '🍔', category: 'fast' },
  { id: 'latesnack', label: '夜宵', icon: '🌙', category: 'fast' },
  { id: 'yogurt', label: '酸奶', icon: '🥣', category: 'fermented' },
];

export const TAG_BY_ID = new Map(FOOD_TAGS.map((t) => [t.id, t]));

export function tagLabel(id: string): string {
  return TAG_BY_ID.get(id)?.label || id;
}

export function tagIcon(id: string): string {
  return TAG_BY_ID.get(id)?.icon || '🍽️';
}
