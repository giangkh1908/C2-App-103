'use client';

// Kid-friendly color palette: vibrant, easy to distinguish for 6-8 year olds
export const KID_COLORS = [
  { bg: '#FFF0EE', border: '#FF6B6B', text: '#D63031', dot: '#FF6B6B', name: 'coral' },
  { bg: '#E8F4FF', border: '#4DABF7', text: '#1971C2', dot: '#4DABF7', name: 'sky' },
  { bg: '#EBFBEE', border: '#51CF66', text: '#2F9E44', dot: '#51CF66', name: 'mint' },
  { bg: '#FFF9DB', border: '#FFD43B', text: '#E67700', dot: '#FFD43B', name: 'sun' },
  { bg: '#F3F0FF', border: '#9775FA', text: '#6741D9', dot: '#9775FA', name: 'grape' },
  { bg: '#FFF4E6', border: '#FF922B', text: '#D9480F', dot: '#FF922B', name: 'peach' },
  { bg: '#FFF0F6', border: '#F783AC', text: '#C2255C', dot: '#F783AC', name: 'pink' },
  { bg: '#E6FCF5', border: '#20C997', text: '#0CA678', dot: '#20C997', name: 'teal' },
];

// Context-aware emoji sets for counting/grouping visuals
export const ITEM_EMOJI_SETS = {
  apple: ['🍎', '🍏', '🍎', '🍏'],
  star: ['⭐', '🌟', '✨', '💫'],
  heart: ['❤️', '💛', '💚', '💙'],
  ball: ['⚽', '🏀', '⚾', '🎾'],
  flower: ['🌸', '🌺', '🌻', '🌼'],
  fish: ['🐟', '🐠', '🐡', '🦈'],
  candy: ['🍬', '🍭', '🍫', '🍡'],
  animal: ['🐱', '🐶', '🐰', '🐸'],
  fruit: ['🍎', '🍊', '🍋', '🍇'],
  default: ['🟢', '🔵', '🟡', '🔴'],
};

// Pick emoji for a given index/label
export function getItemEmoji(label: string, index: number): string {
  const normalized = label.toLowerCase();
  if (normalized.includes('táo') || normalized.includes('tao')) return ITEM_EMOJI_SETS.apple[index % 4];
  if (normalized.includes('cá') || normalized.includes('ca')) return ITEM_EMOJI_SETS.fish[index % 4];
  if (normalized.includes('kẹo') || normalized.includes('keo')) return ITEM_EMOJI_SETS.candy[index % 4];
  if (normalized.includes('bóng') || normalized.includes('bong')) return ITEM_EMOJI_SETS.ball[index % 4];
  if (normalized.includes('hoa')) return ITEM_EMOJI_SETS.flower[index % 4];
  if (normalized.includes('sao') || normalized.includes('ngôi sao')) return ITEM_EMOJI_SETS.star[index % 4];
  if (normalized.includes('trái cây') || normalized.includes('trai cay')) return ITEM_EMOJI_SETS.fruit[index % 4];
  // Default: colorful circles by group
  return ITEM_EMOJI_SETS.default[index % 4];
}

// Get a color scheme for a group index
export function getKidColor(index: number) {
  return KID_COLORS[index % KID_COLORS.length];
}
