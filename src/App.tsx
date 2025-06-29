import { useState, useEffect } from 'react'
import { questions } from './questions'

interface Progress {
  currentQuestionIndex: number
  correctAnswers: number
  answers: (number | null)[]
  isCompleted: boolean
  questionsAnswered: number
  lastSessionDate: string
  studyStreak: number
}

const STORAGE_KEY = 'evi-progress'

function App() {
  const [progress, setProgress] = useState<Progress>({
    currentQuestionIndex: 0,
    correctAnswers: 0,
    answers: new Array(questions.length).fill(null),
    isCompleted: false,
    questionsAnswered: 0,
    lastSessionDate: new Date().toISOString().split('T')[0],
    studyStreak: 0
  })
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [showStartScreen, setShowStartScreen] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'correct' | 'wrong' } | null>(null)
  
  // Auto-scroll to current question
  useEffect(() => {
    const currentButton = document.getElementById(`question-${progress.currentQuestionIndex}`)
    if (currentButton) {
      currentButton.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    }
  }, [progress.currentQuestionIndex])

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY)
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress)
      
      // Calculate study streak
      const today = new Date().toISOString().split('T')[0]
      const lastDate = new Date(parsed.lastSessionDate)
      const todayDate = new Date(today)
      const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      
      let newStreak = parsed.studyStreak || 0
      if (daysDiff === 1) {
        newStreak += 1
      } else if (daysDiff > 1) {
        newStreak = 1
      }
      
      // Check if we should show the current question's answer
      const currentQ = parsed.currentQuestionIndex
      if (parsed.answers[currentQ] !== null) {
        setSelectedAnswer(parsed.answers[currentQ])
        setShowExplanation(true)
      }
      
      setProgress({
        ...parsed,
        lastSessionDate: today,
        studyStreak: newStreak,
        questionsAnswered: parsed.answers.filter((a: number | null) => a !== null).length
      })
      
      if (parsed.currentQuestionIndex > 0 || parsed.isCompleted || parsed.questionsAnswered > 0) {
        setShowStartScreen(false)
      }
    }
  }, [])

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [progress])

  const currentQuestion = questions[progress.currentQuestionIndex]

  const handleStart = () => {
    setShowStartScreen(false)
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return
    
    setSelectedAnswer(answerIndex)
    const isCorrect = answerIndex === currentQuestion.correct
    
    // Show toast
    setToast({
      message: isCorrect ? 'Молодець! ✅' : 'Спробуй ще! ❌',
      type: isCorrect ? 'correct' : 'wrong'
    })
    
    // Update answers array
    const newAnswers = [...progress.answers]
    newAnswers[progress.currentQuestionIndex] = answerIndex
    
    // Update progress
    setProgress(prev => ({
      ...prev,
      answers: newAnswers,
      correctAnswers: isCorrect ? prev.correctAnswers + (prev.answers[progress.currentQuestionIndex] === null ? 1 : 0) : prev.correctAnswers,
      questionsAnswered: newAnswers.filter(a => a !== null).length
    }))
    
    setShowExplanation(true)
    
    // Hide toast after 2 seconds
    setTimeout(() => setToast(null), 2000)
  }

  const handleNextQuestion = () => {
    const nextIndex = progress.currentQuestionIndex + 1
    
    if (nextIndex >= questions.length) {
      // Complete the quiz
      setProgress(prev => ({ ...prev, isCompleted: true }))
    } else {
      goToQuestion(nextIndex)
    }
  }

  const goToQuestion = (questionIndex: number) => {
    setProgress(prev => ({ ...prev, currentQuestionIndex: questionIndex }))
    
    // Check if this question was already answered
    if (progress.answers[questionIndex] !== null) {
      setSelectedAnswer(progress.answers[questionIndex])
      setShowExplanation(true)
    } else {
      setSelectedAnswer(null)
      setShowExplanation(false)
    }
  }

  const handlePrevQuestion = () => {
    if (progress.currentQuestionIndex > 0) {
      goToQuestion(progress.currentQuestionIndex - 1)
    }
  }

  const resetQuiz = () => {
    setProgress({
      currentQuestionIndex: 0,
      correctAnswers: 0,
      answers: new Array(questions.length).fill(null),
      isCompleted: false,
      questionsAnswered: 0,
      lastSessionDate: new Date().toISOString().split('T')[0],
      studyStreak: 0
    })
    setSelectedAnswer(null)
    setShowExplanation(false)
    setShowStartScreen(true)
    localStorage.removeItem(STORAGE_KEY)
  }

  if (showStartScreen) {
    const hasProgress = progress.questionsAnswered > 0
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">ЄФВВ Підготовка</h1>
          
          {/* Study Streak */}
          {progress.studyStreak > 0 && (
            <div className="mb-6 p-4 bg-orange-100 rounded-lg border border-orange-200">
              <div className="text-2xl mb-2">🔥</div>
              <div className="text-lg font-semibold text-orange-800">
                Серія: {progress.studyStreak} {progress.studyStreak === 1 ? 'день' : progress.studyStreak < 5 ? 'дні' : 'днів'}
              </div>
            </div>
          )}
          
          {/* Progress Stats */}
          {hasProgress ? (
            <div className="mb-8 space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-lg font-semibold text-gray-800 mb-2">Ваш прогрес</div>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {progress.questionsAnswered}/60
                </div>
                <div className="text-sm text-gray-600">питань відповіли</div>
                <div className="mt-2 text-sm text-green-600 font-medium">
                  Правильно: {progress.correctAnswers} ({Math.round((progress.correctAnswers / Math.max(progress.questionsAnswered, 1)) * 100)}%)
                </div>
              </div>
              
              <button
                onClick={handleStart}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold text-lg px-6 py-4 rounded-lg transition-colors mb-3"
              >
                Продовжити навчання
              </button>
              
              <button
                onClick={resetQuiz}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium text-base px-6 py-3 rounded-lg transition-colors"
              >
                Почати спочатку
              </button>
            </div>
          ) : (
            <div className="mb-8">
              <p className="text-lg text-gray-600 mb-6">
                Підготуйтеся до іспиту з педагогіки та психології за допомогою інтерактивних карток
              </p>
              <button
                onClick={handleStart}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xl px-8 py-4 rounded-lg transition-colors"
              >
                Почати навчання
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (progress.isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Вітаємо! 🎉</h1>
          <p className="text-xl text-gray-700 mb-8">
            Ви відповіли правильно на <span className="font-bold text-green-600">{progress.correctAnswers}</span> із 60 питань
          </p>
          <div className="text-lg text-gray-600 mb-8">
            Відсоток правильних відповідей: <span className="font-semibold">{Math.round((progress.correctAnswers / questions.length) * 100)}%</span>
          </div>
          <button
            onClick={resetQuiz}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold text-lg px-6 py-3 rounded-lg transition-colors"
          >
            Спробувати знову
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <button
            onClick={() => setShowStartScreen(true)}
            className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors"
          >
            ЄФВВ Підготовка
          </button>
          <div className="text-sm font-medium text-gray-600">
            Питання {progress.currentQuestionIndex + 1} • {progress.questionsAnswered}/60
          </div>
        </div>
        
        {/* Horizontal Question Navigation */}
        <div className="max-w-4xl mx-auto mt-3 flex items-center space-x-3">
          <button
            onClick={handlePrevQuestion}
            disabled={progress.currentQuestionIndex === 0}
            className="flex-shrink-0 w-10 h-10 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 text-blue-600 rounded-full flex items-center justify-center transition-colors"
          >
            ←
          </button>
          
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex space-x-2 py-2">
              {questions.map((_, index) => {
                const isAnswered = progress.answers[index] !== null
                const isCurrent = index === progress.currentQuestionIndex
                const isCorrect = isAnswered && progress.answers[index] === questions[index].correct
                
                let buttonClass = "flex-shrink-0 w-8 h-8 rounded-lg font-medium text-xs transition-all duration-200 "
                
                if (isCurrent) {
                  buttonClass += "bg-blue-600 text-white border-2 border-blue-800 shadow-lg scale-110"
                } else if (isAnswered && isCorrect) {
                  buttonClass += "bg-green-500 text-white hover:bg-green-600"
                } else if (isAnswered && !isCorrect) {
                  buttonClass += "bg-red-500 text-white hover:bg-red-600"
                } else {
                  buttonClass += "bg-gray-300 text-gray-700 hover:bg-gray-400"
                }
                
                return (
                  <button
                    key={index}
                    id={`question-${index}`}
                    onClick={() => goToQuestion(index)}
                    className={buttonClass}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
          </div>
          
          <button
            onClick={handleNextQuestion}
            disabled={progress.currentQuestionIndex === questions.length - 1}
            className="flex-shrink-0 w-10 h-10 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 text-blue-600 rounded-full flex items-center justify-center transition-colors"
          >
            →
          </button>
        </div>
        
        {/* Progress Info */}
        <div className="max-w-4xl mx-auto mt-2 text-center">
          <div className="text-xs text-gray-500">
            Прогрес: {progress.questionsAnswered}/60 ({Math.round((progress.questionsAnswered / questions.length) * 100)}%)
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 py-8">
        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-question font-semibold text-gray-800 leading-tight mb-6">
            {currentQuestion.question}
          </h2>
          
          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              let buttonClass = "w-full p-4 text-left text-option rounded-lg border-2 transition-all duration-200 min-h-[48px] "
              
              if (showExplanation) {
                if (index === currentQuestion.correct) {
                  buttonClass += "bg-green-100 border-green-500 text-green-800"
                } else if (index === selectedAnswer && index !== currentQuestion.correct) {
                  buttonClass += "bg-red-100 border-red-500 text-red-800"
                } else {
                  buttonClass += "bg-gray-100 border-gray-300 text-gray-600"
                }
              } else {
                buttonClass += "bg-gray-50 border-gray-300 text-gray-800 hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100"
              }
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={buttonClass}
                  disabled={showExplanation}
                >
                  <span className="font-semibold mr-3">{String.fromCharCode(65 + index)}</span>
                  {option}
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className="mt-8 space-y-6">
              {/* Correct Answer Explanation */}
              <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-l-4 border-green-500 shadow-sm">
                <div className="flex items-start space-x-2 mb-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-white font-bold text-xs">✓</span>
                  </div>
                  <h3 className="text-base font-bold text-green-800 leading-tight">
                    Чому правильно:
                  </h3>
                </div>
                <div className="text-lg leading-loose text-green-900 font-medium bg-white p-6 rounded-md border border-green-200 min-h-[80px]">
                  {currentQuestion.explanation.whyCorrect}
                </div>
              </div>

              {/* Wrong Answers Explanation */}
              <div className="p-5 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border-l-4 border-orange-500 shadow-sm">
                <div className="flex items-start space-x-2 mb-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-white font-bold text-xs">!</span>
                  </div>
                  <h3 className="text-base font-bold text-orange-800 leading-tight">
                    Чому інші варіанти не підходять:
                  </h3>
                </div>
                <div className="text-lg leading-loose text-orange-900 font-medium bg-white p-6 rounded-md border border-orange-200 min-h-[80px]">
                  {currentQuestion.explanation.whyNotOther}
                </div>
              </div>

              {/* Learning Tip */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-400">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-blue-600 text-sm">💡</span>
                  <span className="text-blue-800 font-medium text-sm">Порада:</span>
                </div>
                <p className="text-blue-800 text-sm leading-relaxed">
                  Перечитайте пояснення ще раз перед переходом до наступного питання
                </p>
              </div>
            </div>
          )}

          {/* Next Button */}
          {showExplanation && (
            <div className="mt-6 text-center">
              <button
                onClick={handleNextQuestion}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-3 rounded-lg transition-colors"
              >
                Наступне питання
              </button>
            </div>
          )}
        </div>
      </div>


      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 z-40 ${
          toast.type === 'correct' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default App