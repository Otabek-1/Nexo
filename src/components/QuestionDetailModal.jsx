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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
          <p>Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
          <p>Savol topilmadi</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-200 rounded">Yopish</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm text-slate-500">{question.sortOrder + 1}-savol</p>
            <h2 className="text-2xl font-bold text-slate-800 mt-1">{question.points} ball</h2>
          </div>
          <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">×</button>
        </div>

        <div className="border-b border-slate-200 pb-6 mb-6">
          <RichContent html={question.content} />
        </div>

        {question.options && question.options.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Variantlar ({question.totalResponses} javob)</h3>
            <div className="space-y-3">
              {Object.values(question.options)
                .sort((a, b) => a.index - b.index)
                .map((opt) => (
                  <div key={opt.index} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-600 mb-2">Variant {String.fromCharCode(65 + opt.index)}</p>
                        <RichContent html={opt.html} className="text-sm" />
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-slate-900">{opt.count}</p>
                        <p className="text-sm text-slate-500">{Math.round(opt.percentage)}%</p>
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${opt.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}