import React, { useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'
import RichContent from './RichContent'

export default function QuestionDetailModal({ testId, questionId, onClose }) {
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiRequest(`/tests/${testId}/questions/${questionId}/stats`, { auth: false })
        setQuestion(data)
      } catch (error) {
        console.error('Failed to load question stats:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [testId, questionId])

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white"></div>
          </div>
        ) : !question ? (
          <div className="p-8 text-center">
            <p className="text-white/60">Savol topilmadi</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white/80 transition"
            >
              Yopish
            </button>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-purple-600/30 border-b border-white/10 px-8 py-6">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-sm text-white/70">#{question.sortOrder + 1} Savol</p>
                  <h2 className="text-2xl font-bold text-white mt-2">{question.points} ball</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-3xl text-white/60 hover:text-white/80 transition w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="px-8 py-6 space-y-8">
              {/* Question Content */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wide">Savol Mazmuni</h3>
                <div className="text-white/90 prose prose-invert">
                  <RichContent html={question.content} />
                </div>
              </div>

              {/* Question Options */}
              {question.options && Object.keys(question.options).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Javob Variantlari
                    <span className="text-sm font-normal text-white/60 ml-2">({question.totalResponses} javob)</span>
                  </h3>
                  <div className="space-y-4">
                    {Object.values(question.options)
                      .sort((a, b) => a.index - b.index)
                      .map((opt, idx) => (
                        <div
                          key={opt.index}
                          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/20 hover:border-white/40 transition group"
                        >
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <div className="inline-block px-3 py-1 bg-purple-500/40 border border-purple-400/50 rounded-full text-purple-300 text-xs font-semibold mb-3">
                                Variant {String.fromCharCode(65 + opt.index)}
                              </div>
                              <div className="text-white/90 prose prose-sm prose-invert">
                                <RichContent html={opt.html} />
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                              <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                {opt.count}
                              </p>
                              <p className="text-lg font-semibold text-white/80 mt-1">
                                {Math.round(opt.percentage)}%
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/10">
                            <div
                              className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 h-3 rounded-full transition-all duration-500 group-hover:shadow-lg group-hover:shadow-blue-500/50"
                              style={{ width: `${opt.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}