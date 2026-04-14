import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getLeaderboard } from '../lib/testStore'
import QuestionDetailModal from '../components/QuestionDetailModal'

const formatDateTime = (isoDate) => {
  if (!isoDate) return '-'
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '-'
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

const getParticipantSecondary = (participant) => {
  if (!participant) return '-'
  if (participant.phone) return participant.phone
  const fields = participant.fields || {}
  const extra = Object.entries(fields).find(([key, value]) => key !== 'fullName' && String(value || '').trim())
  return extra ? String(extra[1]) : '-'
}

export default function TestResults() {
  const { id } = useParams()
  const [test, setTest] = useState(null)
  const [leaderboard, setLeaderboard] = useState({ ranked: [], pending: [] })
  const [loading, setLoading] = useState(true)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [activeTab, setActiveTab] = useState('ranked')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getLeaderboard(Number(id))
        setLeaderboard(data)
      } catch (error) {
        console.error('Failed to load leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const ranked = leaderboard?.ranked || []
  const pending = leaderboard?.pending || []
  const raschStats = leaderboard?.raschStats || null

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white mx-auto mb-4"></div>
          <p className="text-white/80 text-center font-medium">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  const topThree = ranked.slice(0, 3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-16">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent mb-2">
              Test Natijalari
            </h1>
            <p className="text-white/60 text-lg">Rasch modeli bilan hisoblangan o'quvchilar reytingi</p>
          </div>

          {/* Top 3 Winners Card */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topThree.map((submission, index) => {
                const podiumHeights = ['h-32', 'h-40', 'h-24']
                const medals = ['🥇', '🥈', '🥉']
                const colors = [
                  'from-yellow-400 to-yellow-600',
                  'from-slate-300 to-slate-500',
                  'from-orange-400 to-orange-600'
                ]

                return (
                  <div key={submission.id} className="flex flex-col items-center">
                    <div className={`backdrop-blur-xl bg-gradient-to-br ${colors[index]} bg-opacity-20 border border-white/30 rounded-2xl p-6 w-full mb-4 transform transition hover:scale-105`}>
                      <div className="text-5xl mb-2">{medals[index]}</div>
                      <h3 className="text-xl font-bold text-white">{submission.participant.fields.fullName}</h3>
                      <p className="text-white/70 text-sm">{getParticipantSecondary(submission.participant)}</p>
                      <div className="mt-4 text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                        {Math.round(submission.score * 100) / 100}
                      </div>
                    </div>
                    <div className={`w-full ${podiumHeights[index]} bg-gradient-to-t from-purple-500/40 to-transparent border border-purple-400/30 rounded-t-2xl flex items-end justify-center pb-4`}>
                      <span className="text-2xl font-bold text-white">#{index + 1}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Rasch Stats Section */}
        {raschStats && (
          <div className="mb-16">
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 mb-8">
              <h2 className="text-3xl font-bold text-white mb-6">Rasch Statistikasi</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  { label: 'Jami o\'quvchilar', value: raschStats.submissionCount || 0, icon: '👥' },
                  { label: 'Jami savollar', value: raschStats.itemCount || 0, icon: '📋' },
                  { label: 'Qiyinlik indeksi', value: (raschStats.meanDifficulty || 0).toFixed(2), icon: '📊' }
                ].map((stat, idx) => (
                  <div key={idx} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition">
                    <div className="text-4xl mb-3">{stat.icon}</div>
                    <p className="text-white/70 text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Question Stats */}
              {raschStats.questionStats?.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Savollar Tahlili</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {raschStats.questionStats
                      .slice()
                      .sort((a, b) => b.accuracy - a.accuracy)
                      .map((q) => (
                        <div key={q.questionId} className="group backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 hover:bg-white/20 hover:border-white/40 transition cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">{q.label}</p>
                              <p className="text-sm text-white/60 truncate mt-1">{q.contentPreview}</p>
                            </div>
                            <div className="text-right ml-4 shrink-0">
                              <p className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                {Math.round(q.accuracy * 100)}%
                              </p>
                              <p className="text-xs text-white/50 mt-1">{q.correctCount}/{q.totalCount}</p>
                              <button
                                onClick={() => setSelectedQuestion(q.questionId)}
                                className="mt-3 text-xs px-3 py-1 rounded-lg bg-blue-500/30 hover:bg-blue-500/50 text-blue-300 border border-blue-400/30 transition"
                              >
                                Batafsil
                              </button>
                            </div>
                          </div>
                          <div className="mt-3 w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${q.accuracy * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard Tabs */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl overflow-hidden">
          <div className="flex border-b border-white/10">
            {['ranked', 'pending'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 px-6 font-semibold transition ${
                  activeTab === tab
                    ? 'bg-white/20 border-b-2 border-purple-400 text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                {tab === 'ranked' ? '📊 Reyting Jadvali' : '⏳ Tekshirish Jarayonida'}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === 'ranked' ? (
              <div className="space-y-3">
                {ranked.length > 0 ? (
                  ranked.map((submission, idx) => (
                    <div
                      key={submission.id}
                      className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/20 hover:border-white/40 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent w-12 text-center">
                            #{idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-white truncate">{submission.participant.fields.fullName}</h3>
                            <p className="text-sm text-white/60">{getParticipantSecondary(submission.participant)}</p>
                          </div>
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          <p className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            {Math.round(submission.score * 100) / 100}
                          </p>
                          <p className="text-xs text-white/50">{formatDateTime(submission.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-white/60">Reytingli o'quvchilar yo'q</div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {pending.length > 0 ? (
                  pending.map((submission) => (
                    <div
                      key={submission.id}
                      className="backdrop-blur-xl bg-yellow-500/10 border border-yellow-400/30 rounded-2xl p-6 hover:bg-yellow-500/20 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">{submission.participant.fields.fullName}</h3>
                          <p className="text-sm text-white/60">{getParticipantSecondary(submission.participant)}</p>
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          <span className="inline-block px-3 py-1 bg-yellow-500/30 border border-yellow-400/50 rounded-full text-yellow-300 text-xs font-medium">
                            -
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-white/60">O'quvchilar yo'q</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedQuestion && (
        <QuestionDetailModal
          testId={id}
          questionId={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
        />
      )}

      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
