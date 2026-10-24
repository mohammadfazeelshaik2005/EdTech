/**
 * Centralized Design Tokens Constants (TypeScript)
 * Permanent standard for PathSync AI platform
 */

export const colors = {
  primary: {
    DEFAULT: '#0A6C58',
    hover: '#085444',
    active: '#064034',
    subtle: '#EBF7F3',
    muted: '#C2EADB',
    border: '#A7DBC8',
    dark: '#06392F',
    darker: '#04261F',
  },
  accent: {
    mint: '#10B981',
    mintSubtle: '#ECFDF5',
    lime: '#84CC16',
    tealBright: '#14B8A6',
  },
  text: {
    primary: '#0F172A', // Charcoal / Slate 900
    secondary: '#475569', // Muted Slate 600
    tertiary: '#64748B', // Slate 500
    quaternary: '#94A3B8', // Slate 400
    inverse: '#FFFFFF',
    inverseMuted: '#CBD5E1',
  },
  surface: {
    canvas: '#FFFFFF',
    card: '#FFFFFF',
    alternate: '#F8FAFC',
    subtle: '#F1F5F9',
    forest: '#06392F',
    forestCard: '#0A4D40',
    dark: '#0B132B',
  },
  border: {
    subtle: '#F1F5F9',
    default: '#E2E8F0',
    strong: '#CBD5E1',
    brand: '#A7DBC8',
  },
  semantic: {
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#0284C7',
  },
} as const;

export const radii = {
  xs: '4px',
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',
} as const;

export const shadows = {
  xs: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
  sm: '0 2px 4px 0 rgba(15, 23, 42, 0.04), 0 1px 2px 0 rgba(15, 23, 42, 0.02)',
  md: '0 4px 12px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
  lg: '0 12px 24px -4px rgba(15, 23, 42, 0.08), 0 4px 8px -2px rgba(15, 23, 42, 0.04)',
  xl: '0 20px 32px -8px rgba(15, 23, 42, 0.12), 0 8px 16px -4px rgba(15, 23, 42, 0.06)',
  '2xl': '0 25px 50px -12px rgba(15, 23, 42, 0.18)',
  brand: '0 8px 20px -4px rgba(10, 108, 88, 0.28)',
} as const;
