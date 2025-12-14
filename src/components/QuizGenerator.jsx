import { useState } from 'react'

function QuizGenerator() {
  const [topic, setTopic] = useState('')
  const [questions, setQuestions] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!topic.trim() || isGenerating) return

    setIsGenerating(true)
    setQuestions(null)
    setAnswers({})
    setSubmitted(false)
    setScore(null)

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate quiz')
      }

      const data = await response.json()
      setQuestions(data.questions)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate quiz. Please make sure your Gemini API key is configured correctly.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAnswerChange = (questionIndex, answerIndex) => {
    if (submitted) return
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }))
  }

  const handleSubmit = () => {
    if (!questions || submitted) return

    let correctCount = 0
    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correctCount++
      }
    })

    setScore(correctCount)
    setSubmitted(true)
  }

  return (
    <div className="space-y-6">
      {/* Topic Input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic (e.g., Computer Networks, World History, Calculus...)"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isGenerating}
          onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
        >
          {isGenerating ? 'Generating...' : 'Generate Quiz'}
        </button>
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Generating your quiz...</p>
        </div>
      )}

      {/* Quiz Questions */}
      {questions && (
        <div className="space-y-6">
          {questions.map((question, qIndex) => (
            <div
              key={qIndex}
              className="border border-gray-200 rounded-lg p-6 bg-gray-50 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {qIndex + 1}. {question.question}
              </h3>
              <div className="space-y-2">
                {question.options.map((option, oIndex) => {
                  const isSelected = answers[qIndex] === oIndex
                  const isCorrect = oIndex === question.correctAnswer
                  const isWrong = submitted && isSelected && !isCorrect

                  return (
                    <label
                      key={oIndex}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                        submitted
                          ? isCorrect
                            ? 'bg-green-100 border-2 border-green-500'
                            : isWrong
                            ? 'bg-red-100 border-2 border-red-500'
                            : 'bg-gray-100'
                          : isSelected
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-white border-2 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        checked={isSelected}
                        onChange={() => handleAnswerChange(qIndex, oIndex)}
                        disabled={submitted}
                        className="mr-3 w-4 h-4 text-blue-600"
                      />
                      <span
                        className={`flex-1 ${
                          submitted && isCorrect
                            ? 'text-green-800 font-semibold'
                            : submitted && isWrong
                            ? 'text-red-800'
                            : 'text-gray-700'
                        }`}
                      >
                        {option}
                      </span>
                      {submitted && isCorrect && (
                        <span className="text-green-600 font-bold ml-2">✓</span>
                      )}
                      {submitted && isWrong && (
                        <span className="text-red-600 font-bold ml-2">✗</span>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Submit Button and Score */}
          {!submitted && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Submit Answers
              </button>
            </div>
          )}

          {submitted && score !== null && (
            <div className="text-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Quiz Results</h3>
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
                {score} / {questions.length}
              </p>
              <p className="text-gray-600">
                {score === questions.length
                  ? 'Perfect score! 🎉'
                  : score >= questions.length * 0.7
                  ? 'Great job! 👍'
                  : 'Keep studying! 💪'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!questions && !isGenerating && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Enter a topic above to generate a quiz!</p>
        </div>
      )}
    </div>
  )
}

export default QuizGenerator

