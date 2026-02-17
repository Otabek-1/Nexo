import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { sanitizeRichContent } from '../lib/richContent'

// ─── KaTeX loader ─────────────────────────────────────────────────────────────

let katexPromise = null

const loadKatex = () => {
  if (katexPromise) return katexPromise
  katexPromise = new Promise((resolve) => {
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
  return katexPromise
}

// ─── KaTeX render ─────────────────────────────────────────────────────────────

const renderLatex = (container, katex) => {
  if (!katex || !container) return
  container.querySelectorAll('span[data-latex]').forEach((el) => {
    // Allaqachon render qilingan bo'lsa o'tkazish
    if (el.querySelector('.katex')) return
    const latex = el.getAttribute('data-latex')
    if (!latex) return
    const isDisplay = el.classList.contains('math-display')
    try {
      katex.render(latex, el, {
        throwOnError: false,
        displayMode: isDisplay,
        output: 'html',
      })
    } catch { /* xom matn qoladi */ }
  })
}

// ─── Styling ──────────────────────────────────────────────────────────────────

const CLASSES = [
  'rich-content break-words',
  '[&_a]:text-blue-700 [&_a]:underline [&_a]:hover:text-blue-900',
  '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2',
  '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1.5',
  '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1',
  '[&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-2 [&_h4]:mb-1',
  '[&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote]:bg-blue-50 [&_blockquote]:rounded-r [&_blockquote]:py-1',
  '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded',
  '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-1',
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-1',
  '[&_li]:my-0.5',
  '[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:font-mono [&_pre]:my-2',
  '[&_code]:bg-slate-100 [&_code]:border [&_code]:border-slate-200 [&_code]:rounded [&_code]:px-1.5 [&_code]:text-sm [&_code]:font-mono',
  '[&_pre_code]:bg-transparent [&_pre_code]:border-0 [&_pre_code]:p-0',
  '[&_table]:border-collapse [&_table]:w-full [&_table]:my-2',
  '[&_th]:border [&_th]:border-slate-300 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-slate-100 [&_th]:font-semibold [&_th]:text-left',
  '[&_td]:border [&_td]:border-slate-300 [&_td]:px-3 [&_td]:py-2',
  '[&_hr]:border-slate-200 [&_hr]:my-3',
  '[&_mark]:bg-yellow-200 [&_mark]:rounded-sm [&_mark]:px-0.5',
  '[&_details]:border [&_details]:border-slate-200 [&_details]:rounded-lg [&_details]:my-2 [&_details]:overflow-hidden',
  '[&_summary]:cursor-pointer [&_summary]:p-3 [&_summary]:font-medium [&_summary]:text-slate-600 [&_summary]:bg-slate-50 [&_summary]:select-none',
  '[&_.math-display]:block [&_.math-display]:overflow-x-auto [&_.math-display]:py-2 [&_.math-display]:text-center',
  '[&_.math-inline]:inline-block',
  '[&_.katex-display]:overflow-x-auto',
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function RichContent({ html, className = '' }) {
  const safeHtml = useMemo(() => sanitizeRichContent(html), [html])
  const containerRef = useRef(null)
  const prevHtmlRef = useRef(null)

  // 1) HTML o'zgarganda FAQAT o'shanda innerHTML yozamiz
  //    useLayoutEffect: paint dan OLDIN ishlaydi — flicker yo'q
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (prevHtmlRef.current === safeHtml) return   // o'zgarmasa tegilmasin
    prevHtmlRef.current = safeHtml
    el.innerHTML = safeHtml
  }, [safeHtml])

  // 2) innerHTML yangilangandan keyin KaTeX render
  useEffect(() => {
    if (!safeHtml) return
    loadKatex().then((katex) => {
      if (containerRef.current) renderLatex(containerRef.current, katex)
    })
  }, [safeHtml])

  // 3) dangerouslySetInnerHTML YO'Q — div faqat ref bilan
  //    Shu sababli React render bo'lsa ham DOM ga tegmaydi
  return (
    <div
      ref={containerRef}
      className={[...CLASSES, className].filter(Boolean).join(' ')}
    />
  )
}