import React, { useState, useEffect } from 'react'
import { Sun, Moon, BookOpen, Clock, Eye, Flag, XCircle, Sparkles, History, Trash2, ChevronDown, ChevronUp, Trophy, BarChart3 } from 'lucide-react'

export default function StartScreen({ totalQuestions, topics, darkMode, state, onToggleDark, onStart, dispatch, banks }) {
  const [mode, setMode] = useState('tutor')
  const [timer, setTimer] = useState(90)
  const [shuffle, setShuffle] = useState(true)
  const [questionCount, setQuestionCount] = useState(40)
  const [source, setSource] = useState('all')
  const [selectedTopics, setSelectedTopics] = useState([])
  const [showTopics, setShowTopics] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [tab, setTab] = useState('create') // 'create' | 'history' | 'performance'
  const [activeBank, setActiveBankLocal] = useState(state.activeBank || 'all')
  const setActiveBank = (bank) => {
    setActiveBankLocal(bank)
    dispatch({ type: 'SET_BANK', bank })
  }

  const { history = [], globalFlagged = [], globalWrong = [], globalUsed = [] } = state
  const unusedCount = totalQuestions - globalUsed.length

  const bg = darkMode ? 'bg-gray-800' : 'bg-white'
  const cardBg = darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
  const brand = '#2c3e3f' // SkinScript dark teal
  const brandLight = '#3d5556'
  const brandBg = '#e8f0f0'
  const gold = '#c9a84c' // SkinScript gold accent

  const getPoolSize = () => {
    if (source === 'flagged') return globalFlagged.length
    if (source === 'wrong') return globalWrong.length
    if (source === 'unused') return unusedCount
    if (source === 'topics') return selectedTopics.length > 0 ? totalQuestions : 0
    return totalQuestions
  }

  const poolSize = getPoolSize()

  // When source changes, clamp questionCount to new pool size
  useEffect(() => {
    if (poolSize > 0 && questionCount > poolSize) {
      setQuestionCount(poolSize)
    } else if (poolSize === 0) {
      setQuestionCount(0)
    } else if (questionCount === 0 && poolSize > 0) {
      setQuestionCount(Math.min(40, poolSize))
    }
  }, [source, poolSize])

  const handleStart = () => {
    if (poolSize === 0) return
    onStart({
      mode,
      timer: mode === 'timed' ? timer : 0,
      shuffle,
      count: Math.min(questionCount, poolSize),
      source,
      topics: source === 'topics' ? selectedTopics : [],
      bank: activeBank,
    })
  }

  const currentBankCount = banks?.[activeBank]?.count || totalQuestions

  const toggleTopic = (t) => {
    setSelectedTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const presets = [10, 20, 40, 80, 120]
  const avgScore = history.length > 0 ? Math.round(history.reduce((a, h) => a + h.score, 0) / history.length) : 0

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div />
          <button onClick={onToggleDark} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Logo & Title */}
        <div className="text-center mb-6">
          <img src="/icon.png" alt="SkinScript" className="w-24 h-24 mx-auto mb-3 rounded-full shadow-lg" style={{ objectFit: 'cover' }} />
          <h1 className="text-3xl font-extrabold tracking-tight mb-0.5">
            <span style={{ color: brand }}>SKIN</span><span style={{ color: brandLight }}>SCRIP</span><span style={{ color: gold, fontStyle: 'italic' }}>t</span>
          </h1>
          <p className="text-xs font-medium tracking-widest uppercase text-gray-400">Dermatology & Education</p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: '#e8f0f0' }}>
            <span className="text-[10px] font-bold tracking-wide uppercase" style={{ color: brand }}>Last 11 Board Exams</span>
            <span className="text-[10px] text-gray-500">•</span>
            <span className="text-[10px] text-gray-500">Sep 2019 – Oct 2025</span>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div className={`${bg} rounded-xl p-3 text-center shadow-sm border dark:border-gray-700`}>
            <div className="text-xl font-bold" style={{ color: brand }}>{totalQuestions}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Total</div>
          </div>
          <div className={`${bg} rounded-xl p-3 text-center shadow-sm border dark:border-gray-700`}>
            <div className="text-xl font-bold text-green-600">{globalUsed.length}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Used</div>
          </div>
          <div className={`${bg} rounded-xl p-3 text-center shadow-sm border dark:border-gray-700`}>
            <div className="text-xl font-bold text-red-600">{globalWrong.length}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Incorrect</div>
          </div>
          <div className={`${bg} rounded-xl p-3 text-center shadow-sm border dark:border-gray-700`}>
            <div className="text-xl font-bold text-orange-500">{globalFlagged.length}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Flagged</div>
          </div>
        </div>

        {/* Start Fresh link — only shown when there's progress to reset */}
        {(globalUsed.length > 0 || globalWrong.length > 0 || globalFlagged.length > 0 || history.length > 0) && (
          <div className="flex justify-end mb-6">
            <button
              onClick={() => {
                if (confirm('Start Fresh as a New User?\n\nThis will reset ALL progress:\n• ' + globalUsed.length + ' used questions\n• ' + globalWrong.length + ' incorrect answers\n• ' + globalFlagged.length + ' flagged questions\n• ' + history.length + ' quiz history entries\n\nThis cannot be undone.')) {
                  dispatch({ type: 'RESET_ALL' })
                }
              }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-red-600 hover:border-red-300 transition"
            >
              <Trash2 size={12} />
              Start Fresh (Reset All)
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* QUESTION BANK — Last 11 Exams (single source)   */}
        {/* ═══════════════════════════════════════════════ */}
        {banks && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: brand }} />
              <label className="text-sm font-bold uppercase tracking-wide" style={{ color: brand }}>Question Bank</label>
            </div>

            {/* Last 11 Exams — single prominent card */}
            <div
              className="w-full p-5 rounded-xl border-2 border-teal-700 shadow-md flex items-center gap-4"
              style={{ backgroundColor: '#e8f0f0' }}
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: brand, color: 'white' }}>
                📋
              </div>
              <div className="flex-1">
                <div className="font-bold text-base" style={{ color: brand }}>Last 11 Board Exams</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">September 2019 – October 2025</div>
                <div className="text-[10px] text-gray-500 mt-1">Verified against Bolognia 5th Edition (2024)</div>
              </div>
              <div className="text-3xl font-extrabold" style={{ color: brand }}>{banks.last11.count}</div>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl bg-gray-100 dark:bg-gray-700">
          {[
            { key: 'create', icon: <Sparkles size={14} />, label: 'Create Quiz' },
            { key: 'history', icon: <History size={14} />, label: 'History' },
            { key: 'performance', icon: <BarChart3 size={14} />, label: 'Performance' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition ${
                tab === t.key ? 'bg-white dark:bg-gray-600 shadow-sm font-semibold' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* CREATE TAB */}
        {tab === 'create' && (
          <div className={`${bg} rounded-2xl shadow-xl p-6`}>
            {/* Quick action buttons */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {globalFlagged.length > 0 && (
                <button
                  onClick={() => dispatch({ type: 'REVIEW_FLAGGED' })}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 hover:border-orange-400 transition"
                >
                  <Flag size={18} className="text-orange-500" />
                  <span className="text-[10px] font-semibold text-orange-600">Flagged ({globalFlagged.length})</span>
                </button>
              )}
              {globalWrong.length > 0 && (
                <button
                  onClick={() => dispatch({ type: 'REVIEW_WRONG' })}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 hover:border-red-400 transition"
                >
                  <XCircle size={18} className="text-red-500" />
                  <span className="text-[10px] font-semibold text-red-600">Wrong ({globalWrong.length})</span>
                </button>
              )}
              {unusedCount > 0 && (
                <button
                  onClick={() => { setSource('unused'); }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${
                    source === 'unused' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-400 dark:border-gray-600'
                  }`}
                >
                  <Sparkles size={18} className="text-blue-500" />
                  <span className="text-[10px] font-semibold text-blue-600">Unused ({unusedCount})</span>
                </button>
              )}
            </div>

            {/* Question Source */}
            <div className="mb-5">
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider text-gray-500">Question Source</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'all', label: 'All Questions', count: totalQuestions },
                  { key: 'unused', label: 'Unused Only', count: unusedCount },
                  { key: 'wrong', label: 'Incorrect Only', count: globalWrong.length },
                  { key: 'flagged', label: 'Flagged Only', count: globalFlagged.length },
                  { key: 'topics', label: 'By Topic', count: null },
                ].map(s => {
                  const disabled = (s.key === 'wrong' && globalWrong.length === 0)
                    || (s.key === 'unused' && unusedCount === 0)
                    || (s.key === 'flagged' && globalFlagged.length === 0)
                  return (
                    <button
                      key={s.key}
                      onClick={() => !disabled && setSource(s.key)}
                      disabled={disabled}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border transition text-left ${
                        disabled
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700'
                          : source === s.key
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {s.label}
                      {s.count !== null && <span className="ml-1 text-gray-400">({s.count})</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Topic filter */}
            {source === 'topics' && (
              <div className="mb-5">
                <button
                  onClick={() => setShowTopics(!showTopics)}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 text-sm"
                >
                  <span>{selectedTopics.length > 0 ? `${selectedTopics.length} topics selected` : 'Select topics...'}</span>
                  {showTopics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showTopics && (
                  <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-gray-200 dark:border-gray-600 p-2 space-y-1">
                    <button onClick={() => setSelectedTopics(selectedTopics.length === topics.length ? [] : [...topics])} className="text-xs text-blue-600 mb-1">
                      {selectedTopics.length === topics.length ? 'Deselect All' : 'Select All'}
                    </button>
                    {topics.map(t => (
                      <label key={t} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTopics.includes(t)}
                          onChange={() => toggleTopic(t)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-xs">{t}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Number of questions */}
            <div className="mb-5">
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider text-gray-500">
                Number of Questions
                <span className="ml-2 text-gray-400 normal-case font-normal">(pool: {poolSize})</span>
              </label>
              <div className="flex gap-2 mb-2">
                {presets.map(n => {
                  const disabled = n > poolSize
                  return (
                    <button
                      key={n}
                      onClick={() => setQuestionCount(n)}
                      disabled={disabled}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                        disabled
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700'
                          : questionCount === n
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {n}
                    </button>
                  )
                })}
                <button
                  onClick={() => setQuestionCount(poolSize)}
                  disabled={poolSize === 0}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                    poolSize === 0
                      ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                      : questionCount === poolSize && !presets.includes(questionCount)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                  }`}
                >
                  All
                </button>
              </div>
              <input
                type="range"
                min={poolSize > 0 ? 1 : 0}
                max={Math.max(poolSize, 1)}
                value={questionCount}
                disabled={poolSize === 0}
                onChange={e => setQuestionCount(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-blue-600 bg-gray-200 disabled:cursor-not-allowed"
              />
              <div className="text-center text-xs text-gray-500 mt-1">
                {poolSize === 0
                  ? <span className="text-red-500">No questions available in this pool</span>
                  : `${questionCount} of ${poolSize} questions selected`}
              </div>
            </div>

            {/* Mode */}
            <div className="mb-5">
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider text-gray-500">Quiz Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'tutor', icon: <BookOpen size={14} />, label: 'Tutor', desc: 'See answers immediately' },
                  { key: 'timed', icon: <Clock size={14} />, label: 'Timed', desc: 'Countdown per question' },
                  { key: 'review', icon: <Eye size={14} />, label: 'Review', desc: 'Browse Q&A freely' },
                ].map(m => (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium border-2 transition ${
                      mode === m.key
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {m.icon}
                    <span className="font-semibold">{m.label}</span>
                    <span className="text-[9px] text-gray-400">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Timer (timed only) */}
            {mode === 'timed' && (
              <div className="mb-5">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider text-gray-500">Seconds per Question</label>
                <div className="flex gap-2">
                  {[60, 90, 120, 180].map(t => (
                    <button
                      key={t}
                      onClick={() => setTimer(t)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                        timer === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {t}s
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Shuffle */}
            <div className="mb-6 flex items-center gap-3">
              <input type="checkbox" id="shuffle" checked={shuffle} onChange={e => setShuffle(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              <label htmlFor="shuffle" className="text-sm">Shuffle Questions</label>
            </div>

            {/* Start */}
            <button
              onClick={handleStart}
              disabled={poolSize === 0 || questionCount === 0}
              className={`w-full py-3.5 rounded-xl text-white font-bold text-lg transition shadow-lg ${
                poolSize === 0 || questionCount === 0
                  ? 'cursor-not-allowed opacity-40'
                  : 'hover:opacity-90'
              }`}
              style={{ backgroundColor: brand }}
            >
              {poolSize === 0
                ? 'No Questions Available'
                : `Start Quiz — ${Math.min(questionCount, poolSize)} Questions`}
            </button>
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div className={`${bg} rounded-2xl shadow-xl p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Quiz History</h2>
              {history.length > 0 && (
                <button onClick={() => dispatch({ type: 'CLEAR_HISTORY' })} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                  <Trash2 size={12} /> Clear
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <History size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No quiz history yet</p>
                <p className="text-xs">Complete a quiz to see results here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map(h => (
                  <div key={h.id} className={`${cardBg} rounded-xl p-4 border`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Trophy size={14} className={h.score >= 70 ? 'text-green-500' : h.score >= 50 ? 'text-yellow-500' : 'text-red-500'} />
                        <span className={`text-lg font-bold ${h.score >= 70 ? 'text-green-600' : h.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{h.score}%</span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(h.date).toLocaleDateString()} {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex gap-3 text-[10px] text-gray-500">
                      <span>{h.correct}/{h.totalQuestions} correct</span>
                      <span>•</span>
                      <span className="capitalize">{h.mode} mode</span>
                      <span>•</span>
                      <span className="capitalize">{h.source}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mt-2 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${h.score}%`, backgroundColor: h.score >= 70 ? '#22c55e' : h.score >= 50 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PERFORMANCE TAB */}
        {tab === 'performance' && (
          <div className={`${bg} rounded-2xl shadow-xl p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Overall Performance</h2>
              <button
                onClick={() => {
                  if (confirm('Reset ALL progress?\n\nThis will clear:\n• Quiz history\n• Used/Incorrect/Flagged questions\n• All saved data\n\nYou will start fresh as a new user.\n\nThis cannot be undone.')) {
                    dispatch({ type: 'RESET_ALL' })
                  }
                }}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
              >
                <Trash2 size={12} /> Reset Everything
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
                <div className="text-3xl font-bold" style={{ color: brand }}>{history.length}</div>
                <div className="text-xs text-gray-500">Quizzes Taken</div>
              </div>
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-center">
                <div className="text-3xl font-bold text-green-600">{avgScore}%</div>
                <div className="text-xs text-gray-500">Average Score</div>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-center">
                <div className="text-3xl font-bold text-purple-600">{globalUsed.length}</div>
                <div className="text-xs text-gray-500">Questions Seen</div>
              </div>
              <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-center">
                <div className="text-3xl font-bold text-gray-600">{Math.round((globalUsed.length / totalQuestions) * 100)}%</div>
                <div className="text-xs text-gray-500">Completion</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Question Bank Completion</span>
                <span>{globalUsed.length}/{totalQuestions}</span>
              </div>
              <div className="w-full h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${(globalUsed.length / totalQuestions) * 100}%`, backgroundColor: blue }} />
              </div>
            </div>

            {/* Score trend */}
            {history.length > 1 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Recent Scores</h3>
                <div className="flex items-end gap-1 h-20">
                  {history.slice(0, 20).reverse().map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full rounded-t"
                        style={{
                          height: `${Math.max(h.score * 0.8, 4)}px`,
                          backgroundColor: h.score >= 70 ? '#22c55e' : h.score >= 50 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-4 pb-4">Created by Dr. Osama Al Rawi</p>
      </div>
    </div>
  )
}
