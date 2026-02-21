const APOSTROPHE_REGEX = /[\u02BB\u02BC\u2018\u2019`\u00B4]/g
const SPACE_REGEX = /\s/

const SINGLE_SYMBOL_TOKENS = new Set(['+', '-', '*', '/', '=', '.', ',', ':', ';', '(', ')', '[', ']', '{', '}', '?', '!'])

const normalizeApostrophes = (value) => String(value || '').replace(APOSTROPHE_REGEX, "'")

export const normalizeCellAnswerText = (value) => normalizeApostrophes(value).toLowerCase()

export const tokenizeIntoCells = (value) => {
  const source = normalizeCellAnswerText(value).replace(/\u00a0/g, ' ')
  const tokens = []

  for (let i = 0; i < source.length;) {
    const char = source[i]

    if (SPACE_REGEX.test(char)) {
      if (tokens.length > 0 && tokens[tokens.length - 1] !== ' ') tokens.push(' ')
      i += 1
      continue
    }

    if (/\d/.test(char)) {
      tokens.push(char)
      i += 1
      continue
    }

    if ((char === 'o' || char === 'g') && source[i + 1] === "'") {
      tokens.push(`${char}'`)
      i += 2
      continue
    }

    if (/[a-z]/.test(char) || SINGLE_SYMBOL_TOKENS.has(char)) {
      tokens.push(char)
      i += 1
      continue
    }

    i += 1
  }

  while (tokens[0] === ' ') tokens.shift()
  while (tokens[tokens.length - 1] === ' ') tokens.pop()
  return tokens
}

export const compareCellAnswers = (left, right) => {
  const a = tokenizeIntoCells(left)
  const b = tokenizeIntoCells(right)
  if (a.length !== b.length) return false
  return a.every((token, index) => token === b[index])
}

export const cellsToAnswerText = (cells) => {
  const list = Array.isArray(cells) ? [...cells] : []
  while (list[list.length - 1] === '') list.pop()
  return list.join('')
}

export const answerTextToCells = (text, cellCount = 28) => {
  const tokens = tokenizeIntoCells(text)
  if (!Number.isFinite(cellCount) || cellCount < 1) return tokens
  const next = tokens.slice(0, cellCount)
  while (next.length < cellCount) next.push('')
  return next
}

export const normalizeCellToken = (raw) => {
  const value = normalizeCellAnswerText(raw).trim()
  if (!value) return ''
  if (value === "o'" || value === "g'") return value
  if (/^[a-z0-9]$/.test(value) || SINGLE_SYMBOL_TOKENS.has(value)) return value
  return ''
}

export const formatCellTokenDisplay = (token) => {
  if (!token || token === ' ') return ''
  if (token === "o'") return "O'"
  if (token === "g'") return "G'"
  return String(token).toUpperCase()
}
