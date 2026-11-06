export const modes = {
  br: { short: 'BR', full: 'Battle Royale' },
  res: { short: 'Resurgence', full: 'Resurgence' }
} as const;
export type ModeKey = keyof typeof modes;
export type EraKey = 'wz1' | 'wz2';
export const isMode = (value: string | null): value is ModeKey => value === 'br' || value === 'res';
export const isEra = (value: string | null): value is EraKey => value === 'wz1' || value === 'wz2';
export const formatNumber = (value: number | null | undefined) => value == null ? '—' : value.toLocaleString('en-US');
export const formatDecimal = (value: number | null | undefined, digits = 2) => value == null ? '—' : value.toFixed(digits);
