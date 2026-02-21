import React from 'react'

export default function AppFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white/90">
      <div className="max-w-6xl mx-auto px-6 py-4 text-center text-xs text-slate-600">
        <span>Copyright © {new Date().getFullYear()} Nexo. Made by CodeCraft co. </span>
        <a
          href="https://t.me/deep_codecraft"
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:text-blue-700 underline"
        >
          Telegram
        </a>
      </div>
    </footer>
  )
}
