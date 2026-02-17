const ALLOWED_TAGS = new Set([
  'a', 'b', 'blockquote', 'br', 'cite', 'code', 'col', 'colgroup',
  'dd', 'del', 'details', 'dfn', 'div', 'dl', 'dt',
  'em', 'figcaption', 'figure',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr',
  'i', 'iframe', 'img', 'ins',
  'kbd', 'li', 'mark', 'ol', 'p', 'pre',
  's', 'samp', 'small', 'source', 'span', 'strong', 'sub', 'summary', 'sup',
  'table', 'tbody', 'td', 'th', 'thead', 'tfoot', 'tr',
  'u', 'ul', 'var', 'video',
  // Math / formula display
  'math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'msubsup',
  'mfrac', 'msqrt', 'mroot', 'mtext', 'mspace', 'mover', 'munder',
  'munderover', 'mtable', 'mtr', 'mtd', 'menclose', 'mfenced',
  'mmultiscripts', 'mprescripts', 'none', 'semantics', 'annotation',
  'mstyle', 'merror', 'mpadded', 'mphantom', 'maction',
])

const ATTRS_BY_TAG = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding', 'style']),
  video: new Set(['src', 'poster', 'width', 'height', 'controls', 'muted', 'loop', 'autoplay', 'playsinline']),
  source: new Set(['src', 'type']),
  iframe: new Set(['src', 'title', 'width', 'height', 'allow', 'allowfullscreen', 'loading', 'referrerpolicy']),
  td: new Set(['colspan', 'rowspan', 'align', 'valign']),
  th: new Set(['colspan', 'rowspan', 'align', 'valign', 'scope']),
  ol: new Set(['start', 'type']),
  col: new Set(['span', 'width']),
  colgroup: new Set(['span']),
  details: new Set(['open']),
  math: new Set(['xmlns', 'display', 'class']),
  mstyle: new Set(['mathcolor', 'mathbackground', 'fontsize', 'fontweight', 'fontstyle', 'mathsize']),
  mspace: new Set(['width', 'height', 'depth']),
  mpadded: new Set(['width', 'height', 'depth', 'lspace']),
  mfenced: new Set(['open', 'close', 'separators']),
  menclose: new Set(['notation']),
  maction: new Set(['actiontype', 'selection']),
  annotation: new Set(['encoding']),
  span: new Set(['class', 'data-spoiler', 'data-latex', 'style']),
  div: new Set(['class', 'style']),
  p: new Set(['class']),
  code: new Set(['class']),
  pre: new Set(['class']),
  table: new Set(['class', 'border', 'cellpadding', 'cellspacing']),
}

const GLOBAL_ALLOWED_ATTRS = new Set(['id', 'class', 'lang', 'dir', 'title', 'aria-label', 'aria-hidden', 'role'])

const URL_ATTRS = new Set(['href', 'src', 'poster'])
const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])
const SAFE_DATA_IMAGE = /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,[a-z0-9+/=]+$/i
const SAFE_IFRAME_HOSTS = new Set([
  'www.youtube.com', 'youtube.com', 'youtu.be',
  'player.vimeo.com', 'www.dailymotion.com'
])

const SAFE_CLASS_PATTERN = /^[a-zA-Z0-9_\- ]+$/
const SAFE_STYLE_PROPERTIES = new Set([
  'color', 'background-color', 'font-size', 'font-weight', 'font-style',
  'text-align', 'text-decoration', 'border', 'border-color', 'border-width',
  'border-style', 'padding', 'margin', 'width', 'height', 'max-width',
  'max-height', 'min-width', 'min-height', 'display', 'vertical-align',
  'line-height', 'letter-spacing', 'white-space', 'word-break', 'overflow',
])

const NON_TEXT_CONTENT_SELECTOR = 'img,video,iframe,table,ul,ol,blockquote,pre,hr,math,details,figure'

const isSafeUrl = (value, attrName, tagName) => {
  const trimmed = String(value || '').trim()
  if (!trimmed) return false
  if (tagName === 'img' && attrName === 'src' && SAFE_DATA_IMAGE.test(trimmed)) return true
  try {
    const parsed = new URL(trimmed, window.location.origin)
    if (!SAFE_PROTOCOLS.has(parsed.protocol)) return false
    if (tagName === 'iframe' && attrName === 'src') {
      return SAFE_IFRAME_HOSTS.has(parsed.hostname.toLowerCase())
    }
    return true
  } catch {
    return false
  }
}

const sanitizeStyle = (styleValue) => {
  if (!styleValue) return null
  const safe = []
  styleValue.split(';').forEach(decl => {
    const [prop, ...rest] = decl.split(':')
    if (!prop || !rest.length) return
    const cleanProp = prop.trim().toLowerCase()
    const cleanVal = rest.join(':').trim()
    if (!SAFE_STYLE_PROPERTIES.has(cleanProp)) return
    if (/url\s*\(/i.test(cleanVal) || /expression\s*\(/i.test(cleanVal)) return
    if (/javascript/i.test(cleanVal)) return
    safe.push(`${cleanProp}: ${cleanVal}`)
  })
  return safe.length ? safe.join('; ') : null
}

const sanitizeAttributes = (element) => {
  const tagName = element.tagName.toLowerCase()
  const allowedAttrs = ATTRS_BY_TAG[tagName] || new Set()

  Array.from(element.attributes).forEach((attr) => {
    const attrName = attr.name.toLowerCase()
    const attrValue = attr.value

    if (attrName.startsWith('on') || (attrName === 'style' && !allowedAttrs.has('style') && !GLOBAL_ALLOWED_ATTRS.has('style'))) {
      element.removeAttribute(attr.name)
      return
    }

    if (attrName === 'style' && (allowedAttrs.has('style'))) {
      const safe = sanitizeStyle(attrValue)
      if (safe) element.setAttribute('style', safe)
      else element.removeAttribute('style')
      return
    }

    if (attrName === 'class') {
      if (GLOBAL_ALLOWED_ATTRS.has('class') || allowedAttrs.has('class')) {
        if (!SAFE_CLASS_PATTERN.test(attrValue)) {
          element.removeAttribute('class')
        }
        return
      }
    }

    if (GLOBAL_ALLOWED_ATTRS.has(attrName)) return

    if (!allowedAttrs.has(attrName)) {
      element.removeAttribute(attr.name)
      return
    }

    if (URL_ATTRS.has(attrName) && !isSafeUrl(attrValue, attrName, tagName)) {
      element.removeAttribute(attr.name)
      return
    }

    if (tagName === 'a' && attrName === 'target' && attrValue === '_blank') {
      element.setAttribute('rel', 'noopener noreferrer')
    }
  })
}

const sanitizeNode = (node) => {
  if (node.nodeType === Node.TEXT_NODE) return
  if (node.nodeType !== Node.ELEMENT_NODE) {
    node.remove()
    return
  }

  const tagName = node.tagName.toLowerCase()
  if (!ALLOWED_TAGS.has(tagName)) {
    const parent = node.parentNode
    while (node.firstChild) parent.insertBefore(node.firstChild, node)
    node.remove()
    return
  }

  sanitizeAttributes(node)
  Array.from(node.childNodes).forEach(sanitizeNode)
}

export const sanitizeRichContent = (input) => {
  const raw = String(input || '')
  if (!raw.trim()) return ''
  if (!raw.includes('<')) return raw.replace(/\r?\n/g, '<br />')

  const wrapper = document.createElement('div')
  wrapper.innerHTML = raw
  Array.from(wrapper.childNodes).forEach(sanitizeNode)
  return wrapper.innerHTML
}

export const isRichContentEmpty = (input) => {
  const sanitized = sanitizeRichContent(input)
  if (!sanitized) return true

  const wrapper = document.createElement('div')
  wrapper.innerHTML = sanitized
  const text = (wrapper.textContent || '').replace(/\u00a0/g, ' ').trim()
  if (text) return false
  return !wrapper.querySelector(NON_TEXT_CONTENT_SELECTOR)
}
