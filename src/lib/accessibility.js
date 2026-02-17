/**
 * Accessibility (A11y) Utilities
 * WCAG 2.1 AA compliance helpers
 */

/**
 * Focus management utilities
 */
export const focusManager = {
  // Trap focus within an element
  trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    element.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    })

    firstElement.focus()
  },

  // Restore focus to element
  restoreFocus(element) {
    if (element && typeof element.focus === 'function') {
      element.focus()
    }
  },

  // Get all focusable elements
  getFocusableElements(container = document) {
    return Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => {
      return el.offsetParent !== null && !el.hasAttribute('disabled')
    })
  },
}

/**
 * ARIA label and description utilities
 */
export const ariaUtils = {
  // Generate unique ID for aria-describedby
  generateId(prefix = 'aria') {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  },

  // Create accessible description
  createDescription(element, description) {
    const id = this.generateId('desc')
    const desc = document.createElement('div')
    desc.id = id
    desc.className = 'sr-only'
    desc.textContent = description
    element.parentNode.insertBefore(desc, element.nextSibling)
    element.setAttribute('aria-describedby', id)
    return id
  },

  // Create accessible label
  createLabel(inputId, labelText) {
    const label = document.createElement('label')
    label.htmlFor = inputId
    label.textContent = labelText
    return label
  },

  // Announce message to screen readers
  announce(message, priority = 'polite') {
    const ariaLive = document.getElementById('aria-live-region')
    if (ariaLive) {
      ariaLive.setAttribute('aria-live', priority)
      ariaLive.textContent = message
    }
  },
}

/**
 * Screen reader only utility classes
 */
export const srOnlyClass = 'sr-only'

export const srOnlyStyles = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
`

/**
 * Keyboard navigation utilities
 */
export const keyboardUtils = {
  // Check if Enter key was pressed
  isEnterKey(event) {
    return event.key === 'Enter' || event.keyCode === 13
  },

  // Check if Escape key was pressed
  isEscapeKey(event) {
    return event.key === 'Escape' || event.keyCode === 27
  },

  // Check if Space key was pressed
  isSpaceKey(event) {
    return event.key === ' ' || event.keyCode === 32
  },

  // Check if arrow key was pressed
  isArrowKey(event) {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
  },

  // Get arrow key direction
  getArrowDirection(event) {
    const directions = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
    }
    return directions[event.key]
  },
}

/**
 * Color contrast checker
 */
export const contrastChecker = {
  // Get relative luminance of color
  getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map((x) => {
      x = x / 255
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  },

  // Calculate contrast ratio between two colors
  getContrastRatio(color1, color2) {
    const rgb1 = this.hexToRgb(color1)
    const rgb2 = this.hexToRgb(color2)

    const l1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b)
    const l2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b)

    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)

    return (lighter + 0.05) / (darker + 0.05)
  },

  // Convert hex to RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null
  },

  // Check if contrast meets WCAG AA standard (4.5:1 for text)
  meetsAAStandard(color1, color2) {
    const ratio = this.getContrastRatio(color1, color2)
    return ratio >= 4.5
  },

  // Check if contrast meets WCAG AAA standard (7:1 for text)
  meetsAAAStandard(color1, color2) {
    const ratio = this.getContrastRatio(color1, color2)
    return ratio >= 7
  },
}

/**
 * Motion and animation utilities
 */
export const motionUtils = {
  // Check if user prefers reduced motion
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  // Get animation duration based on preference
  getAnimationDuration(normalDuration = 300) {
    return this.prefersReducedMotion() ? 0 : normalDuration
  },

  // CSS for animations respecting prefers-reduced-motion
  getAnimationCSS(animation) {
    return `
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
      ${animation}
    `
  },
}

/**
 * Form accessibility utilities
 */
export const formAccessibility = {
  // Create accessible form group
  createFormGroup(label, input, error = null) {
    return {
      label,
      input: {
        ...input,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? `${input.id}-error` : undefined,
      },
      error: error
        ? {
            id: `${input.id}-error`,
            role: 'alert',
            text: error,
          }
        : null,
    }
  },

  // Create accessible button with loading state
  createAccessibleButton(label, loading = false) {
    return {
      'aria-busy': loading,
      'aria-label': loading ? `${label}, loading` : label,
      disabled: loading,
    }
  },

  // Create accessible icon button
  createIconButton(icon, label, ariaLabel = label) {
    return {
      'aria-label': ariaLabel,
      title: label,
      className: 'icon-button',
    }
  },
}

/**
 * Skip link for keyboard navigation
 */
export const skipLinkHTML = `
  <a href="#main-content" class="skip-link">
    Skip to main content
  </a>
`

export const skipLinkStyles = `
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 100;
  }
  
  .skip-link:focus {
    top: 0;
  }
`

/**
 * Live region for announcements
 */
export const liveRegionHTML = `
  <div
    id="aria-live-region"
    aria-live="polite"
    aria-atomic="true"
    class="sr-only"
  ></div>
`

/**
 * Create accessible modal dialog
 */
export class AccessibleModal {
  constructor(element, options = {}) {
    this.element = element
    this.options = {
      title: 'Dialog',
      closeButton: true,
      focusOnOpen: true,
      ...options,
    }
    this.previouslyFocused = null
  }

  open() {
    this.previouslyFocused = document.activeElement
    this.element.setAttribute('role', 'dialog')
    this.element.setAttribute('aria-modal', 'true')
    this.element.setAttribute('aria-labelledby', `${this.element.id}-title`)
    this.element.style.display = 'block'

    if (this.options.focusOnOpen) {
      const focusableElement = this.element.querySelector('button, input, a, textarea, select')
      if (focusableElement) {
        focusableElement.focus()
      }
    }

    focusManager.trapFocus(this.element)
  }

  close() {
    this.element.style.display = 'none'
    if (this.previouslyFocused) {
      this.previouslyFocused.focus()
    }
  }
}
