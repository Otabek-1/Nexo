import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ─── KaTeX loader ─────────────────────────────────────────────────────────────
let _katexPromise = null
const loadKatex = () => {
  if (_katexPromise) return _katexPromise
  _katexPromise = new Promise((resolve) => {
    if (window.katex) { resolve(window.katex); return }
    if (!document.getElementById('katex-css')) {
      const link = document.createElement('link')
      link.id = 'katex-css'
      link.rel = 'stylesheet'
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css'
      document.head.appendChild(link)
    }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js'
    script.async = true
    script.onload = () => resolve(window.katex)
    script.onerror = () => resolve(null)
    document.head.appendChild(script)
  })
  return _katexPromise
}
import { isRichContentEmpty, sanitizeRichContent } from '../lib/richContent'

// ─── Math / Symbol Palettes ──────────────────────────────────────────────────

const SYMBOL_PALETTES = {
  'Matematik': [
    { sym: '√', tip: 'Kvadrat ildiz' },
    { sym: '∛', tip: 'Kub ildiz' },
    { sym: '∫', tip: 'Integral' },
    { sym: '∬', tip: 'Ikki qat integral' },
    { sym: '∮', tip: 'Yopiq integral' },
    { sym: '∂', tip: 'Qisman hosilasi' },
    { sym: '∑', tip: 'Yigʻindi (sigma)' },
    { sym: '∏', tip: 'Koʻpaytma (pi)' },
    { sym: '∞', tip: 'Cheksizlik' },
    { sym: 'π', tip: 'Pi' },
    { sym: 'τ', tip: 'Tau' },
    { sym: 'φ', tip: 'Phi' },
    { sym: 'ε', tip: 'Epsilon' },
    { sym: 'δ', tip: 'Delta' },
    { sym: 'λ', tip: 'Lambda' },
    { sym: 'μ', tip: 'Mu' },
    { sym: 'σ', tip: 'Sigma (kichik)' },
    { sym: 'θ', tip: 'Theta' },
    { sym: 'α', tip: 'Alfa' },
    { sym: 'β', tip: 'Beta' },
    { sym: 'γ', tip: 'Gamma' },
    { sym: 'ω', tip: 'Omega' },
    { sym: 'Δ', tip: 'Delta (katta)' },
    { sym: 'Λ', tip: 'Lambda (katta)' },
    { sym: 'Σ', tip: 'Sigma (katta)' },
    { sym: 'Ω', tip: 'Omega (katta)' },
    { sym: 'Π', tip: 'Pi (katta)' },
    { sym: 'Γ', tip: 'Gamma (katta)' },
    { sym: 'ℕ', tip: 'Natural sonlar toʻplami' },
    { sym: 'ℤ', tip: 'Butun sonlar toʻplami' },
    { sym: 'ℚ', tip: 'Ratsional sonlar toʻplami' },
    { sym: 'ℝ', tip: 'Haqiqiy sonlar toʻplami' },
    { sym: 'ℂ', tip: 'Kompleks sonlar toʻplami' },
  ],
  'Munosabatlar': [
    { sym: '≤', tip: 'Kichik yoki teng' },
    { sym: '≥', tip: 'Katta yoki teng' },
    { sym: '≠', tip: 'Teng emas' },
    { sym: '≈', tip: 'Taxminan teng' },
    { sym: '≡', tip: 'Aynan teng (kongruent)' },
    { sym: '≢', tip: 'Kongruent emas' },
    { sym: '∝', tip: 'Proporsional' },
    { sym: '∼', tip: 'Oʻxshash' },
    { sym: '≅', tip: 'Kongruent' },
    { sym: '≪', tip: 'Kichik' },
    { sym: '≫', tip: 'Katta' },
    { sym: '⊂', tip: 'Kichik toʻplam' },
    { sym: '⊃', tip: 'Katta toʻplam' },
    { sym: '⊆', tip: 'Kichik yoki teng toʻplam' },
    { sym: '⊇', tip: 'Katta yoki teng toʻplam' },
    { sym: '∈', tip: 'Elementi' },
    { sym: '∉', tip: 'Elementi emas' },
    { sym: '∅', tip: 'Boʻsh toʻplam' },
  ],
  'Amallar': [
    { sym: '×', tip: 'Koʻpaytirish' },
    { sym: '÷', tip: 'Boʻlish' },
    { sym: '±', tip: 'Musbat/manfiy' },
    { sym: '∓', tip: 'Manfiy/musbat' },
    { sym: '·', tip: 'Nuqta koʻpaytirish' },
    { sym: '∧', tip: 'VA (mantiq)' },
    { sym: '∨', tip: 'YOKI (mantiq)' },
    { sym: '¬', tip: 'EMAS (mantiq)' },
    { sym: '⊕', tip: 'XOR' },
    { sym: '∩', tip: 'Kesishma' },
    { sym: '∪', tip: 'Birlik' },
    { sym: '⊗', tip: 'Tensor koʻpaytma' },
    { sym: '⊙', tip: 'Hadamard koʻpaytma' },
  ],
  'Geometriya': [
    { sym: '°', tip: 'Daraja' },
    { sym: '∠', tip: 'Burchak' },
    { sym: '⊥', tip: 'Perpendikulyar' },
    { sym: '∥', tip: 'Parallel' },
    { sym: '△', tip: 'Uchburchak' },
    { sym: '□', tip: 'Toʻrtburchak' },
    { sym: '○', tip: 'Doira' },
    { sym: '↔', tip: 'Ikki tomonlama oʻq' },
    { sym: '→', tip: 'Oʻng oʻq' },
    { sym: '←', tip: 'Chap oʻq' },
    { sym: '↑', tip: 'Yuqori oʻq' },
    { sym: '↓', tip: 'Pastki oʻq' },
    { sym: '⟹', tip: 'Shart oʻqi' },
    { sym: '⟺', tip: 'Tenglik oʻqi' },
  ],
  'Fizika': [
    { sym: 'ℏ', tip: 'Qisqartirilgan Planck' },
    { sym: 'ℓ', tip: 'Uzunlik (script l)' },
    { sym: '∇', tip: 'Nabla (gradient)' },
    { sym: '□', tip: "D'Alembert operatori" },
    { sym: 'Å', tip: 'Angstrom' },
    { sym: 'μ', tip: 'Mikro' },
    { sym: 'Ω', tip: 'Ohm' },
    { sym: '℃', tip: 'Daraja Selsiy' },
    { sym: '℉', tip: 'Daraja Farengeyt' },
    { sym: 'ρ', tip: 'Rho (zichlik)' },
    { sym: 'η', tip: 'Eta (samaradorlik)' },
    { sym: 'ν', tip: 'Nu (chastota)' },
    { sym: 'χ', tip: 'Khi' },
    { sym: 'ψ', tip: 'Psi' },
  ],
  'Kimyo': [
    { sym: '→', tip: 'Reaksiya oʻqi' },
    { sym: '⇌', tip: 'Qaytariluvchi reaksiya' },
    { sym: '↑', tip: 'Gaz ajralib chiqadi' },
    { sym: '↓', tip: 'Choʻkma hosil boʻladi' },
    { sym: '·', tip: 'Kristallizatsiya suvi' },
    { sym: '⊕', tip: 'Musbat ion' },
    { sym: '⊖', tip: 'Manfiy ion' },
    { sym: 'Δ', tip: 'Isitish' },
    { sym: '≡', tip: 'Uch boglanish' },
    { sym: '=', tip: 'Ikki boglanish' },
  ],
}

const HEADING_LEVELS = [
  { value: 'h1', label: 'H1' },
  { value: 'h2', label: 'H2' },
  { value: 'h3', label: 'H3' },
  { value: 'h4', label: 'H4' },
]

const FONT_SIZES = [
  { value: '1', label: 'XS' },
  { value: '2', label: 'SM' },
  { value: '3', label: 'MD' },
  { value: '4', label: 'LG' },
  { value: '5', label: 'XL' },
  { value: '6', label: 'XXL' },
]

const TEXT_COLORS = [
  { value: '#000000', label: 'Qora' },
  { value: '#dc2626', label: 'Qizil' },
  { value: '#2563eb', label: 'Koʻk' },
  { value: '#16a34a', label: 'Yashil' },
  { value: '#d97706', label: 'Sariq' },
  { value: '#7c3aed', label: 'Binafsha' },
  { value: '#db2777', label: 'Pushti' },
  { value: '#0891b2', label: 'Moviy' },
  { value: '#6b7280', label: 'Kulrang' },
]

const BG_COLORS = [
  { value: '#fef08a', label: 'Sariq' },
  { value: '#bbf7d0', label: 'Yashil' },
  { value: '#bfdbfe', label: 'Koʻk' },
  { value: '#fecaca', label: 'Qizil' },
  { value: '#e9d5ff', label: 'Binafsha' },
  { value: '#fed7aa', label: 'Toʻq sariq' },
  { value: '#ffffff', label: 'Oq' },
]

const TABLE_PRESETS = [
  { rows: 2, cols: 2, label: '2×2' },
  { rows: 3, cols: 3, label: '3×3' },
  { rows: 3, cols: 4, label: '3×4' },
  { rows: 4, cols: 5, label: '4×5' },
]

const toEmbedUrl = (raw) => {
  const value = String(raw || '').trim()
  if (!value) return ''
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    if (host.includes('youtube.com')) {
      const id = url.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : ''
    }
    if (host === 'youtu.be') {
      const id = url.pathname.replace('/', '')
      return id ? `https://www.youtube.com/embed/${id}` : ''
    }
    if (host.includes('vimeo.com')) {
      const parts = url.pathname.split('/').filter(Boolean)
      const id = parts[parts.length - 1]
      return id ? `https://player.vimeo.com/video/${id}` : ''
    }
  } catch { return '' }
  return ''
}

const buildTable = (rows, cols, hasHeader = true) => {
  let html = '<table class="editor-table" border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;border-color:#cbd5e1">'
  for (let r = 0; r < rows; r++) {
    html += '<tr>'
    for (let c = 0; c < cols; c++) {
      if (r === 0 && hasHeader) {
        html += `<th style="background:#f1f5f9;font-weight:600;text-align:center;border:1px solid #cbd5e1;padding:6px">Sarlavha ${c + 1}</th>`
      } else {
        html += `<td style="border:1px solid #cbd5e1;padding:6px">${r === 0 ? `Sarlavha ${c + 1}` : '&nbsp;'}</td>`
      }
    }
    html += '</tr>'
  }
  html += '</table><p><br></p>'
  return html
}

// ─── Toolbar Button ────────────────────────────────────────────────────────

const ToolBtn = ({ onClick, title, active, children, className = '' }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => { e.preventDefault(); onClick() }}
    className={`
      relative inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded text-xs font-medium
      transition-all duration-100 select-none cursor-pointer
      ${active
        ? 'bg-blue-600 text-white shadow-inner'
        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300'}
      ${className}
    `}
  >
    {children}
  </button>
)

// ─── Toolbar Separator ─────────────────────────────────────────────────────

const Sep = () => <span className="w-px h-5 bg-slate-200 mx-0.5 flex-shrink-0" />

// ─── Dropdown ─────────────────────────────────────────────────────────────

const Dropdown = ({ label, items, onSelect, className = '' }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v) }}
        className="inline-flex items-center gap-1 h-7 px-2 rounded text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all"
      >
        {label}
        <span className="text-slate-400">▾</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 min-w-[140px] py-1">
          {items.map((item) => (
            <button
              key={item.value || item.label}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onSelect(item); setOpen(false) }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Color Picker ─────────────────────────────────────────────────────────

const ColorPicker = ({ label, colors, onSelect, icon }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title={label}
        onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v) }}
        className="inline-flex items-center gap-0.5 h-7 px-1.5 rounded text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all"
      >
        {icon} <span className="text-slate-400 text-[10px]">▾</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-2">
          <div className="grid grid-cols-5 gap-1">
            {colors.map(({ value, label: colorLabel }) => (
              <button
                key={value}
                type="button"
                title={colorLabel}
                onMouseDown={(e) => { e.preventDefault(); onSelect(value); setOpen(false) }}
                className="w-6 h-6 rounded border border-slate-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: value }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Symbol Palette ────────────────────────────────────────────────────────

const SymbolPanel = ({ onInsert }) => {
  const [activeTab, setActiveTab] = useState('Matematik')

  return (
    <div className="border-b border-slate-200 bg-slate-50">
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 scrollbar-none">
        {Object.keys(SYMBOL_PALETTES).map((name) => (
          <button
            key={name}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setActiveTab(name) }}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap
              ${activeTab === name
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {name}
          </button>
        ))}
      </div>
      {/* Symbols */}
      <div className="p-2 flex flex-wrap gap-1">
        {SYMBOL_PALETTES[activeTab].map(({ sym, tip }) => (
          <button
            key={sym + tip}
            type="button"
            title={tip}
            onMouseDown={(e) => { e.preventDefault(); onInsert(sym) }}
            className="inline-flex items-center justify-center w-8 h-8 rounded border border-slate-200 bg-white text-sm hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all font-mono"
          >
            {sym}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── LaTeX Formula Input ───────────────────────────────────────────────────

const LatexInput = ({ onInsert }) => {
  const [open, setOpen] = useState(false)
  const [latex, setLatex] = useState('')
  const [display, setDisplay] = useState(false)
  const ref = useRef(null)

  const PRESETS = [
    { label: 'Kvadrat formula', tex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
    { label: 'Evler formulasi', tex: 'e^{i\\pi} + 1 = 0' },
    { label: 'Pifagor teoremasi', tex: 'a^2 + b^2 = c^2' },
    { label: 'Integral', tex: '\\int_a^b f(x)\\,dx' },
    { label: 'Limit', tex: '\\lim_{x \\to \\infty} \\frac{1}{x} = 0' },
    { label: 'Taylorning qatori', tex: 'f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n' },
    { label: 'Gauss integrali', tex: '\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}' },
    { label: 'Derivat', tex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}" },
    { label: 'Matritsa', tex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
    { label: 'Binomial', tex: '\\binom{n}{k} = \\frac{n!}{k!(n-k)!}' },
    { label: 'Vektorlar', tex: '\\vec{F} = m\\vec{a}' },
    { label: "Shrodinger (Schrödinger)", tex: 'i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi' },
  ]

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handle = () => {
    if (!latex.trim()) return
    const className = display ? 'math-display' : 'math-inline'
    const displayStyle = display
      ? 'display:block;text-align:center;margin:10px 0;'
      : 'display:inline-block;vertical-align:middle;'
    let rendered = latex
    if (window.katex) {
      try {
        rendered = window.katex.renderToString(latex, {
          throwOnError: false,
          displayMode: display,
          output: 'html',
        })
      } catch (e) { /* xom latex qoladi */ }
    }
    const safeLatex = latex.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    const html = `<span class="${className}" data-latex="${safeLatex}" style="${displayStyle}">${rendered}</span>${display ? '<p><br></p>' : ''}`
    onInsert(html)
    setLatex('')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title="LaTeX formula kiritish"
        onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v) }}
        className="inline-flex items-center gap-1 h-7 px-2 rounded text-xs font-medium bg-white text-purple-700 border border-purple-200 hover:bg-purple-50 transition-all font-mono"
      >
        ∫ LaTeX
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 w-80 p-3">
          <p className="text-xs font-semibold text-slate-700 mb-2">LaTeX formula</p>
          <textarea
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            placeholder="masalan: \frac{-b \pm \sqrt{b^2-4ac}}{2a}"
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handle() }}
          />
          <div className="mt-2 mb-2">
            <p className="text-xs text-slate-500 mb-1">Tayyor formulalar:</p>
            <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
              {PRESETS.map(({ label, tex }) => (
                <button
                  key={label}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setLatex(tex) }}
                  className="text-left px-2 py-1 text-xs text-slate-600 hover:bg-purple-50 rounded border border-slate-100 truncate"
                  title={tex}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600 mb-2">
            <input
              type="checkbox"
              checked={display}
              onChange={(e) => setDisplay(e.target.checked)}
              className="rounded"
            />
            Blok ko'rinishi (yangi qatorda)
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handle() }}
              className="flex-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition"
            >
              Qoʻshish (Ctrl+Enter)
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setOpen(false) }}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs rounded-lg hover:bg-slate-200 transition"
            >
              Bekor
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Table Builder ─────────────────────────────────────────────────────────

const TableBuilder = ({ onInsert }) => {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [hasHeader, setHasHeader] = useState(true)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title="Jadval qoʻshish"
        onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v) }}
        className="inline-flex items-center gap-1 h-7 px-2 rounded text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all"
      >
        ⊞ Jadval
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-3 w-56">
          <p className="text-xs font-semibold text-slate-700 mb-3">Jadval yaratish</p>
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">Qatorlar</label>
              <input type="number" min="1" max="20" value={rows} onChange={(e) => setRows(Number(e.target.value))}
                className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">Ustunlar</label>
              <input type="number" min="1" max="20" value={cols} onChange={(e) => setCols(Number(e.target.value))}
                className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-xs text-slate-500 mb-1">Tez tanlash:</p>
            <div className="flex flex-wrap gap-1">
              {TABLE_PRESETS.map(({ rows: r, cols: c, label }) => (
                <button key={label} type="button"
                  onMouseDown={(e) => { e.preventDefault(); setRows(r); setCols(c) }}
                  className="px-2 py-1 text-xs border border-slate-200 rounded hover:bg-slate-50 transition"
                >{label}</button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600 mb-3">
            <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} className="rounded" />
            Sarlavha qatori (thead)
          </label>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onInsert(buildTable(rows, cols, hasHeader)); setOpen(false) }}
            className="w-full px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition"
          >
            Jadval qoʻshish
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Image Upload / URL ────────────────────────────────────────────────────

const ImageInsert = ({ onInsert }) => {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('url')
  const [url, setUrl] = useState('')
  const [alt, setAlt] = useState('')
  const [width, setWidth] = useState('')
  const fileRef = useRef(null)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const insertFromUrl = () => {
    if (!url.trim()) return
    const attrs = [`src="${url.trim()}"`, `alt="${alt || 'Rasm'}"`]
    if (width) attrs.push(`width="${width}"`)
    attrs.push('loading="lazy"', 'style="max-width:100%;height:auto;border-radius:4px"')
    onInsert(`<img ${attrs.join(' ')} /><p><br></p>`)
    setUrl(''); setAlt(''); setWidth(''); setOpen(false)
  }

  const insertFromFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target.result
      onInsert(`<img src="${src}" alt="${file.name}" loading="lazy" style="max-width:100%;height:auto;border-radius:4px" /><p><br></p>`)
      setOpen(false)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title="Rasm qoʻshish"
        onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v) }}
        className="inline-flex items-center gap-1 h-7 px-2 rounded text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all"
      >
        🖼 Rasm
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-3 w-64">
          <div className="flex border-b border-slate-200 mb-3">
            {['url', 'upload'].map((t) => (
              <button key={t} type="button"
                onMouseDown={(e) => { e.preventDefault(); setTab(t) }}
                className={`flex-1 py-1 text-xs font-medium transition-colors ${tab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
              >{t === 'url' ? 'URL' : 'Fayl yuklash'}</button>
            ))}
          </div>
          {tab === 'url' ? (
            <div className="space-y-2">
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..."
                className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
              <input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Alt matn (ixtiyoriy)"
                className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
              <input value={width} onChange={(e) => setWidth(e.target.value)} placeholder="Kenglik, masalan 400"
                className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
              <button type="button" onMouseDown={(e) => { e.preventDefault(); insertFromUrl() }}
                className="w-full px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition">
                Rasm qoʻshish
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input ref={fileRef} type="file" accept="image/*" onChange={insertFromFile} className="hidden" />
              <button type="button" onMouseDown={(e) => { e.preventDefault(); fileRef.current?.click() }}
                className="w-full px-3 py-2 border-2 border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600 transition text-center">
                📁 Fayl tanlash (PNG, JPG, GIF, WebP)
              </button>
              <p className="text-xs text-slate-400 text-center">Rasm base64 sifatida saqlanadi</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Spoiler Insert ────────────────────────────────────────────────────────

const insertSpoilerHtml = () =>
  `<details style="border:1px solid #e2e8f0;border-radius:8px;padding:0;margin:8px 0;background:#f8fafc">
    <summary style="cursor:pointer;padding:10px 14px;font-weight:600;color:#475569;user-select:none;list-style:none;display:flex;align-items:center;gap:6px">
      <span style="font-size:0.85em;transition:transform 0.2s">▶</span>
      Spoiler (bosing)
    </summary>
    <div style="padding:10px 14px;border-top:1px solid #e2e8f0;color:#334155">
      Bu yerga spoiler matnini yozing...
    </div>
  </details><p><br></p>`

// ─── Code Block Insert ─────────────────────────────────────────────────────

const CODE_LANGS = [
  'python', 'javascript', 'java', 'c', 'cpp', 'csharp', 'rust', 'go',
  'sql', 'html', 'css', 'bash', 'r', 'matlab', 'pseudocode', 'text'
]

const CodeBlockInsert = ({ onInsert }) => {
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState('python')
  const [code, setCode] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handle = () => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const html = `<pre style="background:#1e293b;color:#e2e8f0;padding:16px;border-radius:8px;overflow-x:auto;font-family:monospace;font-size:0.85em;line-height:1.6;margin:8px 0"><code class="language-${lang}" style="font-family:inherit">${escaped}</code></pre><p><br></p>`
    onInsert(html)
    setCode(''); setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title="Kod bloki qoʻshish"
        onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v) }}
        className="inline-flex items-center gap-1 h-7 px-2 rounded text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all font-mono"
      >
        {'</>'}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-3 w-72">
          <p className="text-xs font-semibold text-slate-700 mb-2">Kod bloki</p>
          <select value={lang} onChange={(e) => setLang(e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs mb-2 focus:outline-none focus:ring-1 focus:ring-blue-400">
            {CODE_LANGS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <textarea value={code} onChange={(e) => setCode(e.target.value)}
            placeholder="Kod yozing..."
            rows={5}
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
          />
          <div className="flex gap-2 mt-2">
            <button type="button" onMouseDown={(e) => { e.preventDefault(); handle() }}
              className="flex-1 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg hover:bg-slate-900 transition">
              Qoʻshish
            </button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); setOpen(false) }}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs rounded-lg hover:bg-slate-200 transition">
              Bekor
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Video Insert ──────────────────────────────────────────────────────────

const VideoInsert = ({ onExec }) => {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handle = () => {
    if (!url.trim()) return
    const embed = toEmbedUrl(url)
    if (embed) {
      onExec('insertHTML', `<div style="margin:8px 0"><iframe src="${embed}" title="Video" loading="lazy" allowfullscreen width="560" height="315" style="max-width:100%;border-radius:8px"></iframe></div><p><br></p>`)
    } else {
      onExec('insertHTML', `<video src="${url.trim()}" controls style="max-width:100%;border-radius:8px;margin:8px 0"></video><p><br></p>`)
    }
    setUrl(''); setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" title="Video qoʻshish"
        onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v) }}
        className="inline-flex items-center gap-1 h-7 px-2 rounded text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all">
        ▶ Video
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-3 w-64">
          <p className="text-xs font-semibold text-slate-700 mb-2">Video URL</p>
          <input value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="YouTube, Vimeo yoki video URL"
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs mb-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handle() } }}
          />
          <p className="text-xs text-slate-400 mb-2">YouTube va Vimeo linklari avtomatik embed qilinadi</p>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); handle() }}
            className="w-full px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition">
            Qoʻshish
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Link Insert ───────────────────────────────────────────────────────────

const LinkInsert = ({ onExec }) => {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handle = () => {
    if (!url.trim()) return
    if (text.trim()) {
      onExec('insertHTML', `<a href="${url.trim()}" target="_blank" rel="noopener noreferrer">${text.trim()}</a>`)
    } else {
      onExec('createLink', url.trim())
    }
    setUrl(''); setText(''); setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" title="Havola qoʻshish"
        onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v) }}
        className="inline-flex items-center gap-1 h-7 px-2 rounded text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all">
        🔗 Havola
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-3 w-64">
          <p className="text-xs font-semibold text-slate-700 mb-2">Havola qoʻshish</p>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..."
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs mb-2 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Havola matni (ixtiyoriy)"
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs mb-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handle() } }}
          />
          <button type="button" onMouseDown={(e) => { e.preventDefault(); handle() }}
            className="w-full px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition">
            Qoʻshish
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main RichTextEditor ───────────────────────────────────────────────────

export default function RichTextEditor({
  id,
  value,
  onChange,
  placeholder = 'Yozishni boshlang...',
  minHeightClass = 'min-h-[200px]'
}) {
  const editorRef = useRef(null)
  const [focus, setFocus] = useState(false)
  const [showSymbols, setShowSymbols] = useState(true)

  // KaTeX ni oldindan yuklash (editor ochilganda formulalar tayyor bo'lsin)
  useEffect(() => { loadKatex() }, [])

  const normalizedValue = useMemo(() => sanitizeRichContent(value), [value])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    if (editor.innerHTML !== normalizedValue) {
      editor.innerHTML = normalizedValue
    }
  }, [normalizedValue])

  const emitChange = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const next = sanitizeRichContent(editor.innerHTML)
    onChange(isRichContentEmpty(next) ? '' : next)
  }, [onChange])

  const exec = useCallback((command, arg = null) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    document.execCommand(command, false, arg)
    emitChange()
  }, [emitChange])

  const insertHTML = useCallback((html) => {
    exec('insertHTML', html)
  }, [exec])

  const insertSymbol = useCallback((sym) => {
    exec('insertText', sym)
  }, [exec])

  const setFontSize = ({ value: v }) => exec('fontSize', v)
  const setHeading = ({ value: v }) => exec('formatBlock', v)
  const setTextColor = (color) => exec('foreColor', color)
  const setBgColor = (color) => exec('hiliteColor', color)
  const setAlignment = (align) => exec(`justify${align}`)

  const insertHR = () => exec('insertHTML', '<hr style="border:none;border-top:2px solid #e2e8f0;margin:12px 0"/><p><br></p>')
  const insertBlockquote = () => exec('insertHTML', '<blockquote style="border-left:4px solid #3b82f6;padding:8px 16px;margin:8px 0;background:#eff6ff;border-radius:0 8px 8px 0;color:#1e40af;font-style:italic">Iqtibos matni...</blockquote><p><br></p>')
  const insertCallout = (type) => {
    const styles = {
      info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', icon: 'ℹ️', label: "Ma'lumot" },
      warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', icon: '⚠️', label: 'Ogohlantirish' },
      danger: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', icon: '🚫', label: 'Xato' },
      success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534', icon: '✅', label: 'Muvaffaqiyat' },
      tip: { bg: '#fdf4ff', border: '#a855f7', text: '#6b21a8', icon: '💡', label: "Maslahat" },
    }
    const s = styles[type]
    exec('insertHTML', `<div style="border-left:4px solid ${s.border};background:${s.bg};border-radius:0 8px 8px 0;padding:10px 14px;margin:8px 0;color:${s.text}">
      <strong style="display:block;margin-bottom:4px">${s.icon} ${s.label}</strong>
      <span>Bu yerga matn yozing...</span>
    </div><p><br></p>`)
  }

  const showPlaceholder = !focus && isRichContentEmpty(normalizedValue)

  return (
    <div className="rounded-xl border border-slate-300 overflow-hidden shadow-sm bg-white">

      {/* ── Toolbar Row 1: Formatting ── */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        {/* Heading */}
        <Dropdown
          label="Sarlavha"
          items={[
            { value: 'p', label: '¶ Oddiy matn' },
            ...HEADING_LEVELS.map(h => ({ value: h.value, label: `${h.label} Sarlavha` }))
          ]}
          onSelect={setHeading}
        />
        <Sep />

        {/* Font size */}
        <Dropdown label="Hajm" items={FONT_SIZES} onSelect={setFontSize} />
        <Sep />

        {/* Basic formatting */}
        <ToolBtn onClick={() => exec('bold')} title="Qalin (Ctrl+B)"><b>B</b></ToolBtn>
        <ToolBtn onClick={() => exec('italic')} title="Kursiv (Ctrl+I)"><i>I</i></ToolBtn>
        <ToolBtn onClick={() => exec('underline')} title="Tagiga chizish (Ctrl+U)"><u>U</u></ToolBtn>
        <ToolBtn onClick={() => exec('strikeThrough')} title="Ustiga chizish"><s>S</s></ToolBtn>
        <ToolBtn onClick={() => exec('superscript')} title="Yuqori indeks">x²</ToolBtn>
        <ToolBtn onClick={() => exec('subscript')} title="Pastki indeks">x₂</ToolBtn>
        <Sep />

        {/* Colors */}
        <ColorPicker label="Matn rangi" colors={TEXT_COLORS} onSelect={setTextColor}
          icon={<span style={{ fontWeight: 700, color: '#dc2626' }}>A</span>} />
        <ColorPicker label="Fon rangi" colors={BG_COLORS} onSelect={setBgColor}
          icon={<span style={{ background: '#fef08a', padding: '0 3px', borderRadius: 2 }}>A</span>} />
        <Sep />

        {/* Alignment */}
        <ToolBtn onClick={() => setAlignment('Left')} title="Chapga">⬜</ToolBtn>
        <ToolBtn onClick={() => setAlignment('Center')} title="Markazga">☰</ToolBtn>
        <ToolBtn onClick={() => setAlignment('Right')} title="Oʻngga">≡</ToolBtn>
        <ToolBtn onClick={() => setAlignment('Full')} title="Tekislash">≡</ToolBtn>
        <Sep />

        {/* Lists */}
        <ToolBtn onClick={() => exec('insertUnorderedList')} title="Belgilanmagan roʻyxat">• List</ToolBtn>
        <ToolBtn onClick={() => exec('insertOrderedList')} title="Tartibli roʻyxat">1. List</ToolBtn>
        <ToolBtn onClick={() => exec('indent')} title="Ichkariga">→</ToolBtn>
        <ToolBtn onClick={() => exec('outdent')} title="Tashqariga">←</ToolBtn>
        <Sep />

        {/* Inline code */}
        <ToolBtn onClick={() => exec('insertHTML', '<code style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:4px;padding:1px 5px;font-family:monospace;font-size:0.88em">kod</code>')} title="Inline kod">
          <span className="font-mono text-[11px]">`kod`</span>
        </ToolBtn>

        {/* Mark */}
        <ToolBtn onClick={() => exec('insertHTML', '<mark style="background:#fef08a;padding:0 2px;border-radius:2px">matn</mark>')} title="Belgilash (highlight)">
          <span style={{ background: '#fef08a' }}>H</span>
        </ToolBtn>

        <Sep />
        <ToolBtn onClick={() => exec('removeFormat')} title="Formatlashni tozalash" className="text-red-500">✕ Reset</ToolBtn>
      </div>

      {/* ── Toolbar Row 2: Insert ── */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <LinkInsert onExec={exec} />
        <ImageInsert onInsert={insertHTML} />
        <VideoInsert onExec={exec} />
        <TableBuilder onInsert={insertHTML} />
        <CodeBlockInsert onInsert={insertHTML} />
        <LatexInput onInsert={insertHTML} />
        <Sep />

        {/* Blockquote / callout */}
        <ToolBtn onClick={insertBlockquote} title="Iqtibos">❝</ToolBtn>
        <Dropdown label="Callout" items={[
          { value: 'info', label: 'ℹ️ Maʼlumot' },
          { value: 'warning', label: '⚠️ Ogohlantirish' },
          { value: 'danger', label: '🚫 Xato' },
          { value: 'success', label: '✅ Muvaffaqiyat' },
          { value: 'tip', label: '💡 Maslahat' },
        ]} onSelect={({ value: v }) => insertCallout(v)} />
        <Sep />

        {/* Spoiler / Details */}
        <ToolBtn onClick={() => insertHTML(insertSpoilerHtml())} title="Spoiler (yashirin matn)">
          👁 Spoiler
        </ToolBtn>
        <ToolBtn onClick={insertHR} title="Gorizontal chiziq">— HR</ToolBtn>
        <Sep />

        {/* Symbols toggle */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setShowSymbols(v => !v) }}
          className={`inline-flex items-center gap-1 h-7 px-2 rounded text-xs font-medium border transition-all
            ${showSymbols ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`}
        >
          ∑ Belgilar {showSymbols ? '▲' : '▼'}
        </button>
        <Sep />
        <ToolBtn onClick={() => exec('undo')} title="Bekor qilish (Ctrl+Z)">↩ Undo</ToolBtn>
        <ToolBtn onClick={() => exec('redo')} title="Qayta qilish (Ctrl+Y)">↪ Redo</ToolBtn>
      </div>

      {/* ── Symbol Palette ── */}
      {showSymbols && <SymbolPanel onInsert={insertSymbol} />}

      {/* ── Content Area ── */}
      <div className="relative">
        {showPlaceholder && (
          <div className="pointer-events-none absolute left-4 top-3 text-sm text-slate-400 select-none">
            {placeholder}
          </div>
        )}
        <div
          id={id}
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={() => { setFocus(false); emitChange() }}
          onFocus={() => setFocus(true)}
          onKeyDown={(e) => {
            // Tab → indent
            if (e.key === 'Tab') {
              e.preventDefault()
              exec('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;')
            }
          }}
          className={`${minHeightClass} w-full p-4 outline-none text-slate-800 leading-relaxed
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-slate-900
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-slate-800
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-1.5 [&_h3]:mt-2 [&_h3]:text-slate-800
            [&_h4]:text-base [&_h4]:font-semibold [&_h4]:mb-1 [&_h4]:mt-2
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-1
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-1
            [&_li]:my-0.5
            [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote]:bg-blue-50 [&_blockquote]:rounded-r
            [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:text-sm [&_pre]:font-mono [&_pre]:my-2
            [&_code]:bg-slate-100 [&_code]:border [&_code]:border-slate-200 [&_code]:rounded [&_code]:px-1 [&_code]:text-sm [&_code]:font-mono
            [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800
            [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded
            [&_table]:border-collapse [&_table]:w-full [&_table]:my-2
            [&_td]:border [&_td]:border-slate-300 [&_td]:px-3 [&_td]:py-2
            [&_th]:border [&_th]:border-slate-300 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-slate-100 [&_th]:font-semibold
            [&_hr]:border-slate-200 [&_hr]:my-3
            [&_details]:border [&_details]:border-slate-200 [&_details]:rounded-lg [&_details]:my-2
            [&_summary]:cursor-pointer [&_summary]:p-3 [&_summary]:font-medium [&_summary]:text-slate-700
            [&_mark]:bg-yellow-200 [&_mark]:rounded-sm [&_mark]:px-0.5
            `}
          style={{ minHeight: '200px', wordBreak: 'break-word' }}
        />
      </div>

      {/* ── Status bar ── */}
      <div className="px-4 py-1.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Matn yozish uchun bosing • Tab = boʻshliq • Ctrl+B qalin • Ctrl+I kursiv
        </span>
        <span className="text-xs text-slate-400">
          {editorRef.current ? (editorRef.current.innerText || '').replace(/\s+/g, ' ').trim().split(/\s+/).filter(w => w).length : 0} soʻz
        </span>
      </div>
    </div>
  )
}