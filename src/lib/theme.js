/**
 * Theme System
 * Centralized color, typography, and spacing configuration
 */

export const colors = {
  // Primary colors
  primary: '#3B82F6', // Blue
  primaryLight: '#93C5FD',
  primaryDark: '#1E40AF',

  // Secondary colors
  secondary: '#10B981', // Green
  secondaryLight: '#A7F3D0',
  secondaryDark: '#047857',

  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Neutral colors
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  black: '#000000',

  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  surface: '#F3F4F6',

  // Text colors
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
}

export const typography = {
  // Font families
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"Fira Code", "Courier New", monospace',
  },

  // Font sizes
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },

  // Font weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tight: '-0.02em',
    normal: '0em',
    wide: '0.02em',
    wider: '0.05em',
  },
}

export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
}

export const borderRadius = {
  none: '0',
  sm: '4px',
  base: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
}

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
}

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

export const transitions = {
  fast: 'all 150ms ease-in-out',
  normal: 'all 300ms ease-in-out',
  slow: 'all 500ms ease-in-out',
}

/**
 * Component-specific themes
 */
export const componentThemes = {
  button: {
    primary: {
      background: colors.primary,
      color: colors.white,
      hover: {
        background: colors.primaryDark,
      },
      active: {
        background: colors.primaryDark,
      },
      disabled: {
        background: colors.gray200,
        color: colors.gray500,
      },
    },
    secondary: {
      background: colors.gray200,
      color: colors.text,
      hover: {
        background: colors.gray300,
      },
      active: {
        background: colors.gray400,
      },
    },
    danger: {
      background: colors.error,
      color: colors.white,
      hover: {
        background: '#DC2626',
      },
    },
  },

  input: {
    background: colors.white,
    border: colors.gray300,
    text: colors.text,
    placeholder: colors.textMuted,
    focus: {
      border: colors.primary,
      shadow: `0 0 0 3px ${colors.primaryLight}`,
    },
    error: {
      border: colors.error,
      background: '#FEF2F2',
    },
    disabled: {
      background: colors.gray100,
      border: colors.gray200,
      text: colors.textMuted,
    },
  },

  card: {
    background: colors.white,
    border: colors.gray200,
    shadow: shadows.base,
  },

  modal: {
    background: colors.white,
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: shadows.xl,
  },
}

/**
 * Theme provider helper
 */
export class ThemeProvider {
  constructor(theme = 'light') {
    this.theme = theme
    this.apply()
  }

  apply() {
    document.documentElement.setAttribute('data-theme', this.theme)
  }

  toggle() {
    this.theme = this.theme === 'light' ? 'dark' : 'light'
    this.apply()
  }

  set(theme) {
    this.theme = theme
    this.apply()
  }

  get() {
    return this.theme
  }
}

/**
 * Generate CSS variables for theming
 */
export const generateCSSVariables = () => {
  const vars = {}

  // Colors
  Object.entries(colors).forEach(([key, value]) => {
    vars[`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value
  })

  // Spacing
  Object.entries(spacing).forEach(([key, value]) => {
    vars[`--spacing-${key}`] = value
  })

  // Border radius
  Object.entries(borderRadius).forEach(([key, value]) => {
    vars[`--radius-${key}`] = value
  })

  // Shadows
  Object.entries(shadows).forEach(([key, value]) => {
    vars[`--shadow-${key}`] = value
  })

  // Typography
  Object.entries(typography.fontSize).forEach(([key, value]) => {
    vars[`--font-size-${key}`] = value
  })

  // Transitions
  Object.entries(transitions).forEach(([key, value]) => {
    vars[`--transition-${key}`] = value
  })

  return vars
}

/**
 * Convert CSS variables object to CSS string
 */
export const cssVarsToString = (vars) => {
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n')
}

/**
 * Generate CSS for root theme
 */
export const generateThemeCSS = () => {
  const vars = generateCSSVariables()
  const cssString = cssVarsToString(vars)
  return `
    :root {
      ${cssString}
    }
  `
}
