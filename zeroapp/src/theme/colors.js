// Design tokens matching frontend/src/index.css
export const colors = {
  primary: '#4f46e5', // indigo-600
  primaryDark: '#4338ca', // indigo-700
  primaryLight: '#eef2ff', // indigo-50
  primaryForeground: '#ffffff',

  background: '#f8fafc', // slate-50
  card: '#ffffff',
  cardForeground: '#0f172a', // slate-900

  textPrimary: '#0f172a', // slate-900
  textSecondary: '#475569', // slate-600
  textMuted: '#64748b', // slate-500
  textLight: '#94a3b8', // slate-400

  border: '#e2e8f0', // slate-200
  borderLight: '#f1f5f9', // slate-100

  accent: '#f59e0b', // amber-500
  accentLight: '#fef3c7', // amber-100
  accentForeground: '#92400e', // amber-800

  success: '#10b981', // emerald-500
  successLight: '#d1fae5', // emerald-100
  successForeground: '#065f46',

  destructive: '#ef4444', // red-500
  destructiveLight: '#fee2e2', // red-100
  destructiveForeground: '#ffffff',

  badge: '#3b82f6', // blue-500
  badgeLight: '#dbeafe',

  surface: '#ffffff',
  surfaceHover: '#f8fafc',
};

export const shadows = {
  sm: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
};
