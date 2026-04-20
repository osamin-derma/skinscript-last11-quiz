import { useEffect, useReducer, useState } from 'react'
import last11Questions from './data/last11_questions.json'

// Single question bank — Last 11 Board Exams only
const allBanks = {
  last11: { label: 'Last 11 Board Exams', questions: last11Questions, count: last11Questions.length },
  all: { label: 'All Questions', questions: last11Questions, count: last11Questions.length },
}

function getBankQuestions(bankKey) {
  return allBanks[bankKey]?.questions || allBanks.last11.questions
}
import StartScreen from './components/StartScreen'
import QuizScreen from './components/QuizScreen'
import ResultsDashboard from './components/ResultsDashboard'

const STORAGE_KEY = 'last11-quiz-state'
const HISTORY_KEY = 'last11-quiz-history'
const GLOBAL_FLAGS_KEY = 'last11-quiz-flags'
const GLOBAL_WRONG_KEY = 'last11-quiz-wrong'
const GLOBAL_USED_KEY = 'last11-quiz-used'

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback }
  catch { return fallback }
}

function saveJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

const initialState = {
  screen: 'start',
  mode: 'tutor',
  timerSetting: 90,
  shuffle: false,
  questionCount: 40,
  questionOrder: [],
  currentIndex: 0,
  answers: {},
  flagged: [],
  darkMode: false,
  selectedTopics: [],
  quizSource: 'all', // 'all' | 'flagged' | 'wrong' | 'unused' | 'topics'
  activeBank: 'last11', // Only last11 available
  history: [],
  globalFlagged: [],
  globalWrong: [],
  globalUsed: [],
}

function reducer(state, action) {
  switch (action.type) {
    case 'INIT': {
      return {
        ...state,
        history: loadJSON(HISTORY_KEY, []),
        globalFlagged: loadJSON(GLOBAL_FLAGS_KEY, []),
        globalWrong: loadJSON(GLOBAL_WRONG_KEY, []),
        globalUsed: loadJSON(GLOBAL_USED_KEY, []),
      }
    }
    case 'SET_BANK': {
      return { ...state, activeBank: action.bank }
    }
    case 'START_QUIZ': {
      // Use selected bank — store in state for rendering
      const bankKey = action.bank || state.activeBank || 'all'
      const bankQuestions = getBankQuestions(bankKey)

      let pool = bankQuestions.map((_, i) => i)

      // Filter by source
      if (action.source === 'flagged') {
        pool = pool.filter(i => state.globalFlagged.includes(bankQuestions[i].id))
      } else if (action.source === 'wrong') {
        pool = pool.filter(i => state.globalWrong.includes(bankQuestions[i].id))
      } else if (action.source === 'unused') {
        pool = pool.filter(i => !state.globalUsed.includes(bankQuestions[i].id))
      } else if (action.source === 'topics' && action.topics?.length > 0) {
        pool = pool.filter(i => action.topics.includes(bankQuestions[i].topic))
      }

      // If selected source has no questions, don't start the quiz
      if (pool.length === 0) return state

      if (action.shuffle) pool = shuffleArray(pool)

      const count = Math.min(action.count || pool.length, pool.length)
      const order = pool.slice(0, count)

      return {
        ...state,
        screen: 'quiz',
        mode: action.mode,
        timerSetting: action.timer,
        shuffle: action.shuffle,
        questionCount: count,
        questionOrder: order,
        currentIndex: 0,
        answers: {},
        flagged: [],
        quizSource: action.source || 'all',
        activeBank: bankKey,
      }
    }
    case 'ANSWER': {
      const newAnswers = { ...state.answers, [action.questionId]: { selected: action.selected, correct: action.correct, submitted: true } }

      // Track globally
      const newUsed = [...new Set([...state.globalUsed, action.questionId])]
      const newWrong = action.correct
        ? state.globalWrong.filter(id => id !== action.questionId)
        : [...new Set([...state.globalWrong, action.questionId])]

      saveJSON(GLOBAL_USED_KEY, newUsed)
      saveJSON(GLOBAL_WRONG_KEY, newWrong)

      return { ...state, answers: newAnswers, globalUsed: newUsed, globalWrong: newWrong }
    }
    case 'NAVIGATE':
      return { ...state, currentIndex: action.index }
    case 'NEXT':
      return { ...state, currentIndex: Math.min(state.currentIndex + 1, state.questionOrder.length - 1) }
    case 'PREV':
      return { ...state, currentIndex: Math.max(state.currentIndex - 1, 0) }
    case 'FLAG': {
      const f = [...state.flagged]
      const gf = [...state.globalFlagged]
      const idx = f.indexOf(action.questionId)
      const gIdx = gf.indexOf(action.questionId)

      if (idx >= 0) f.splice(idx, 1)
      else f.push(action.questionId)

      if (gIdx >= 0) gf.splice(gIdx, 1)
      else gf.push(action.questionId)

      saveJSON(GLOBAL_FLAGS_KEY, gf)
      return { ...state, flagged: f, globalFlagged: gf }
    }
    case 'END_QUIZ': {
      const total = state.questionOrder.length
      const answered = Object.values(state.answers).filter(a => a.submitted).length
      const correct = Object.values(state.answers).filter(a => a.correct).length
      const score = total > 0 ? Math.round((correct / total) * 100) : 0

      const historyEntry = {
        id: Date.now(),
        date: new Date().toISOString(),
        mode: state.mode,
        source: state.quizSource,
        totalQuestions: total,
        answered,
        correct,
        incorrect: answered - correct,
        score,
        timePerQ: state.timerSetting,
      }

      const newHistory = [historyEntry, ...state.history].slice(0, 50)
      saveJSON(HISTORY_KEY, newHistory)

      return { ...state, screen: 'results', history: newHistory }
    }
    case 'RESTART':
      localStorage.removeItem(STORAGE_KEY)
      return {
        ...initialState,
        darkMode: state.darkMode,
        history: state.history,
        globalFlagged: state.globalFlagged,
        globalWrong: state.globalWrong,
        globalUsed: state.globalUsed,
      }
    case 'TOGGLE_DARK':
      return { ...state, darkMode: !state.darkMode }
    case 'RESUME':
      return { ...action.saved, history: state.history, globalFlagged: state.globalFlagged, globalWrong: state.globalWrong, globalUsed: state.globalUsed }
    case 'REVIEW_FLAGGED': {
      const bankQs = getBankQuestions(state.activeBank)
      const flaggedOrder = bankQs.map((_, i) => i).filter(i => state.globalFlagged.includes(bankQs[i]?.id))
      if (flaggedOrder.length === 0) return state
      return { ...state, screen: 'quiz', mode: 'tutor', questionOrder: flaggedOrder, currentIndex: 0, answers: {}, flagged: [], quizSource: 'flagged' }
    }
    case 'REVIEW_WRONG': {
      const bankQs = getBankQuestions(state.activeBank)
      const wrongOrder = bankQs.map((_, i) => i).filter(i => state.globalWrong.includes(bankQs[i]?.id))
      if (wrongOrder.length === 0) return state
      return { ...state, screen: 'quiz', mode: 'tutor', questionOrder: shuffleArray(wrongOrder), currentIndex: 0, answers: {}, flagged: [], quizSource: 'wrong' }
    }
    case 'CLEAR_HISTORY':
      saveJSON(HISTORY_KEY, [])
      return { ...state, history: [] }
    case 'RESET_PERFORMANCE':
      saveJSON(GLOBAL_WRONG_KEY, [])
      saveJSON(GLOBAL_USED_KEY, [])
      saveJSON(GLOBAL_FLAGS_KEY, [])
      return { ...state, globalWrong: [], globalUsed: [], globalFlagged: [] }
    case 'RESET_ALL': {
      // Nuclear option: clear ALL progress, history, flags, used, wrong,
      // and any in-progress quiz — start completely fresh
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(HISTORY_KEY)
      localStorage.removeItem(GLOBAL_FLAGS_KEY)
      localStorage.removeItem(GLOBAL_WRONG_KEY)
      localStorage.removeItem(GLOBAL_USED_KEY)
      return {
        ...initialState,
        darkMode: state.darkMode, // keep dark mode preference
        activeBank: 'last11',
      }
    }
    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    dispatch({ type: 'INIT' })
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.darkMode)
  }, [state.darkMode])

  useEffect(() => {
    if (state.screen === 'quiz') {
      const toSave = { ...state }
      delete toSave.history
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    }
  }, [state.screen, state.currentIndex, state.answers, state.flagged])

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.screen === 'quiz' && parsed.questionOrder?.length > 0) {
          if (confirm('Resume where you left off?')) {
            dispatch({ type: 'RESUME', saved: parsed })
          } else {
            localStorage.removeItem(STORAGE_KEY)
          }
        }
      } catch { /* ignore */ }
    }
  }, [])

  // Derive active questions from state.activeBank
  const activeQuestions = getBankQuestions(state.activeBank)
  const topics = [...new Set(activeQuestions.map(q => q.topic).filter(Boolean))].sort()

  return (
    <div className={`min-h-screen transition-colors duration-300 ${state.darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {state.screen === 'start' && (
        <StartScreen
          totalQuestions={activeQuestions.length}
          topics={topics}
          darkMode={state.darkMode}
          state={state}
          onToggleDark={() => dispatch({ type: 'TOGGLE_DARK' })}
          onStart={(opts) => dispatch({ type: 'START_QUIZ', ...opts })}
          dispatch={dispatch}
          banks={{
            all: { label: 'Last 11 Exams', count: allBanks.last11.count },
            last11: { label: 'Last 11 Exams', count: allBanks.last11.count },
          }}
        />
      )}
      {state.screen === 'quiz' && (
        <QuizScreen state={state} questions={activeQuestions} dispatch={dispatch} />
      )}
      {state.screen === 'results' && (
        <ResultsDashboard state={state} questions={activeQuestions} dispatch={dispatch} />
      )}
    </div>
  )
}
